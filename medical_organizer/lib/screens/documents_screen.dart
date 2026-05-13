import 'package:flutter/material.dart';
import 'package:image_picker/image_picker.dart';
import 'package:file_picker/file_picker.dart';
import '../services/api_service.dart';
import '../services/cache_service.dart';
import '../services/storage_service.dart';
import '../models/document.dart';
import '../config/api.dart';

const _types = [
  {'value': '',             'label': 'Все'},
  {'value': 'discharge',    'label': 'Выписка'},
  {'value': 'surgery',      'label': 'После операции'},
  {'value': 'imaging',      'label': 'Обследование'},
  {'value': 'prescription', 'label': 'Назначение'},
  {'value': 'other',        'label': 'Другое'},
];

class DocumentsScreen extends StatefulWidget {
  const DocumentsScreen({super.key});

  @override
  State<DocumentsScreen> createState() => _DocumentsScreenState();
}

class _DocumentsScreenState extends State<DocumentsScreen> {
  List<MedDocument> _docs = [];
  bool _loading = true;
  String _filter = '';

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    // Кэш только без фильтра
    if (_filter.isEmpty) {
      final cached = await CacheService.loadList(CacheService.documents);
      if (cached != null) {
        setState(() {
          _docs = cached.map(MedDocument.fromJson).toList();
          _loading = false;
        });
      } else {
        setState(() => _loading = true);
      }
    } else {
      setState(() => _loading = true);
    }

    try {
      final docs = await ApiService.getDocuments(type: _filter.isEmpty ? null : _filter);
      if (_filter.isEmpty) {
        await CacheService.save(CacheService.documents,
            docs.map((d) => d.toJson()).toList());
      }
      if (mounted) setState(() => _docs = docs);
    } catch (_) {
      if (mounted && _docs.isEmpty) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Нет подключения. Показаны кэшированные данные.')),
        );
      }
    } finally {
      if (mounted) setState(() => _loading = false);
    }
  }

  Future<void> _delete(MedDocument doc) async {
    final ok = await showDialog<bool>(
      context: context,
      builder: (_) => AlertDialog(
        title: const Text('Удалить документ?'),
        content: Text('«${doc.title}» будет удалён безвозвратно.'),
        actions: [
          TextButton(onPressed: () => Navigator.pop(context, false), child: const Text('Отмена')),
          TextButton(onPressed: () => Navigator.pop(context, true),
              child: const Text('Удалить', style: TextStyle(color: Colors.red))),
        ],
      ),
    );
    if (ok == true) {
      await ApiService.deleteDocument(doc.id);
      _load();
    }
  }

  Future<void> _showAddForm() async {
    final titleCtrl  = TextEditingController();
    final doctorCtrl = TextEditingController();
    final instCtrl   = TextEditingController();
    final descCtrl   = TextEditingController();
    String type      = 'other';
    String? docDate;
    String? filePath;
    String? fileName;
    String? fileMime;

    await showDialog(
      context: context,
      builder: (_) => StatefulBuilder(
        builder: (ctx, setS) => AlertDialog(
          title: const Text('Добавить документ'),
          content: SingleChildScrollView(
            child: Column(mainAxisSize: MainAxisSize.min, children: [
              TextField(controller: titleCtrl,
                decoration: const InputDecoration(labelText: 'Название *', border: OutlineInputBorder())),
              const SizedBox(height: 10),

              DropdownButtonFormField<String>(
                value: type,
                decoration: const InputDecoration(labelText: 'Тип', border: OutlineInputBorder()),
                items: _types.skip(1).map((t) => DropdownMenuItem(
                  value: t['value'], child: Text(t['label']!),
                )).toList(),
                onChanged: (v) => setS(() => type = v!),
              ),
              const SizedBox(height: 10),

              TextField(controller: doctorCtrl,
                decoration: const InputDecoration(labelText: 'ФИО врача', border: OutlineInputBorder())),
              const SizedBox(height: 10),
              TextField(controller: instCtrl,
                decoration: const InputDecoration(labelText: 'Учреждение', border: OutlineInputBorder())),
              const SizedBox(height: 10),

              InkWell(
                onTap: () async {
                  final d = await showDatePicker(
                    context: ctx,
                    initialDate: DateTime.now(),
                    firstDate: DateTime(2000),
                    lastDate: DateTime.now(),
                  );
                  if (d != null) {
                    setS(() => docDate =
                      '${d.year}-${d.month.toString().padLeft(2,'0')}-${d.day.toString().padLeft(2,'0')}');
                  }
                },
                child: InputDecorator(
                  decoration: const InputDecoration(
                    labelText: 'Дата документа', border: OutlineInputBorder(),
                    suffixIcon: Icon(Icons.calendar_today, size: 18),
                  ),
                  child: Text(docDate ?? 'Не указана',
                      style: TextStyle(color: docDate == null ? Colors.grey : null)),
                ),
              ),
              const SizedBox(height: 10),

              TextField(controller: descCtrl, maxLines: 2,
                decoration: const InputDecoration(labelText: 'Описание', border: OutlineInputBorder())),
              const SizedBox(height: 12),

              // Загрузка файла
              Row(children: [
                Expanded(
                  child: OutlinedButton.icon(
                    icon: const Icon(Icons.photo_camera, size: 18),
                    label: const Text('Камера'),
                    onPressed: () async {
                      final img = await ImagePicker().pickImage(source: ImageSource.camera, imageQuality: 85);
                      if (img != null) setS(() {
                        filePath = img.path;
                        fileName = img.name;
                        fileMime = 'image/jpeg';
                      });
                    },
                  ),
                ),
                const SizedBox(width: 8),
                Expanded(
                  child: OutlinedButton.icon(
                    icon: const Icon(Icons.photo_library, size: 18),
                    label: const Text('Галерея'),
                    onPressed: () async {
                      final img = await ImagePicker().pickImage(source: ImageSource.gallery, imageQuality: 85);
                      if (img != null) setS(() {
                        filePath = img.path;
                        fileName = img.name;
                        fileMime = 'image/jpeg';
                      });
                    },
                  ),
                ),
              ]),
              const SizedBox(height: 6),
              OutlinedButton.icon(
                icon: const Icon(Icons.picture_as_pdf, size: 18),
                label: const Text('Выбрать PDF'),
                style: OutlinedButton.styleFrom(minimumSize: const Size.fromHeight(36)),
                onPressed: () async {
                  final result = await FilePicker.platform.pickFiles(
                    type: FileType.custom, allowedExtensions: ['pdf'],
                  );
                  if (result != null && result.files.single.path != null) {
                    setS(() {
                      filePath = result.files.single.path!;
                      fileName = result.files.single.name;
                      fileMime = 'application/pdf';
                    });
                  }
                },
              ),

              if (fileName != null) ...[
                const SizedBox(height: 8),
                Row(children: [
                  Icon(fileMime == 'application/pdf' ? Icons.picture_as_pdf : Icons.image,
                      size: 16, color: Colors.teal),
                  const SizedBox(width: 6),
                  Expanded(child: Text(fileName!, style: const TextStyle(fontSize: 12, color: Colors.grey),
                      overflow: TextOverflow.ellipsis)),
                ]),
              ],
            ]),
          ),
          actions: [
            TextButton(onPressed: () => Navigator.pop(ctx), child: const Text('Отмена')),
            ElevatedButton(
              style: ElevatedButton.styleFrom(backgroundColor: Colors.teal, foregroundColor: Colors.white),
              onPressed: () async {
                if (titleCtrl.text.trim().isEmpty) return;
                try {
                  await ApiService.createDocument(
                    title:       titleCtrl.text.trim(),
                    type:        type,
                    doctorName:  doctorCtrl.text.trim().isEmpty ? null : doctorCtrl.text.trim(),
                    institution: instCtrl.text.trim().isEmpty   ? null : instCtrl.text.trim(),
                    docDate:     docDate,
                    description: descCtrl.text.trim().isEmpty   ? null : descCtrl.text.trim(),
                    filePath:    filePath,
                    fileName:    fileName,
                    fileMime:    fileMime,
                  );
                  if (mounted) Navigator.pop(ctx);
                  _load();
                } catch (e) {
                  ScaffoldMessenger.of(context).showSnackBar(
                    SnackBar(content: Text(e.toString()), backgroundColor: Colors.red),
                  );
                }
              },
              child: const Text('Сохранить'),
            ),
          ],
        ),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Документы'),
        backgroundColor: Colors.teal,
        foregroundColor: Colors.white,
        actions: [IconButton(icon: const Icon(Icons.refresh), onPressed: _load)],
      ),
      body: Column(
        children: [
          // Фильтр
          SizedBox(
            height: 44,
            child: ListView.builder(
              scrollDirection: Axis.horizontal,
              padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 6),
              itemCount: _types.length,
              itemBuilder: (_, i) {
                final t = _types[i];
                final selected = _filter == t['value'];
                return Padding(
                  padding: const EdgeInsets.only(right: 6),
                  child: GestureDetector(
                    onTap: () { setState(() => _filter = t['value']!); _load(); },
                    child: Container(
                      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 4),
                      decoration: BoxDecoration(
                        color: selected ? Colors.teal : Colors.grey.shade200,
                        borderRadius: BorderRadius.circular(16),
                      ),
                      child: Text(t['label']!,
                          style: TextStyle(fontSize: 12, fontWeight: FontWeight.w600,
                              color: selected ? Colors.white : Colors.grey.shade700)),
                    ),
                  ),
                );
              },
            ),
          ),

          // Список
          Expanded(
            child: _loading
                ? const Center(child: CircularProgressIndicator())
                : _docs.isEmpty
                    ? Center(
                        child: Column(mainAxisAlignment: MainAxisAlignment.center, children: [
                          const Icon(Icons.folder_open, size: 64, color: Colors.grey),
                          const SizedBox(height: 12),
                          const Text('Нет документов', style: TextStyle(color: Colors.grey)),
                          const SizedBox(height: 16),
                          ElevatedButton.icon(
                            style: ElevatedButton.styleFrom(backgroundColor: Colors.teal, foregroundColor: Colors.white),
                            icon: const Icon(Icons.add),
                            label: const Text('Добавить'),
                            onPressed: _showAddForm,
                          ),
                        ]),
                      )
                    : RefreshIndicator(
                        onRefresh: _load,
                        child: ListView.builder(
                          padding: const EdgeInsets.fromLTRB(8, 0, 8, 80),
                          itemCount: _docs.length,
                          itemBuilder: (_, i) {
                            final d = _docs[i];
                            return Card(
                              margin: const EdgeInsets.only(bottom: 8),
                              child: Padding(
                                padding: const EdgeInsets.all(12),
                                child: Column(
                                  crossAxisAlignment: CrossAxisAlignment.start,
                                  children: [
                                    Row(children: [
                                      CircleAvatar(
                                        backgroundColor: _typeColor(d.type).withValues(alpha: 0.15),
                                        child: Icon(
                                          d.isPdf ? Icons.picture_as_pdf
                                          : d.isImage ? Icons.image
                                          : Icons.description,
                                          color: _typeColor(d.type),
                                        ),
                                      ),
                                      const SizedBox(width: 12),
                                      Expanded(child: Column(
                                        crossAxisAlignment: CrossAxisAlignment.start,
                                        children: [
                                          Text(d.title, style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 15)),
                                          Text(d.typeLabel, style: TextStyle(fontSize: 12, color: _typeColor(d.type))),
                                        ],
                                      )),
                                    ]),
                                    if (d.doctorName != null || d.docDate != null || d.hasFile) ...[
                                      const SizedBox(height: 6),
                                      if (d.doctorName != null)
                                        Text('👨‍⚕️ ${d.doctorName}', style: const TextStyle(fontSize: 12, color: Colors.grey)),
                                      if (d.docDate != null)
                                        Text('📅 ${d.docDate}', style: const TextStyle(fontSize: 12, color: Colors.grey)),
                                      if (d.hasFile)
                                        Text('📎 ${d.fileName ?? "Файл"} ${d.sizeLabel}',
                                            style: const TextStyle(fontSize: 12, color: Colors.teal)),
                                    ],
                                    const SizedBox(height: 10),
                                    Row(children: [
                                      if (d.hasFile) ...[
                                        Expanded(
                                          child: ElevatedButton.icon(
                                            style: ElevatedButton.styleFrom(
                                              backgroundColor: Colors.teal, foregroundColor: Colors.white,
                                              padding: const EdgeInsets.symmetric(vertical: 8),
                                            ),
                                            icon: const Icon(Icons.visibility, size: 16),
                                            label: const Text('Просмотр', style: TextStyle(fontSize: 13)),
                                            onPressed: () => _viewFile(d),
                                          ),
                                        ),
                                        const SizedBox(width: 8),
                                      ],
                                      OutlinedButton.icon(
                                        style: OutlinedButton.styleFrom(
                                          foregroundColor: Colors.red,
                                          side: const BorderSide(color: Colors.red),
                                          padding: const EdgeInsets.symmetric(vertical: 8, horizontal: 12),
                                        ),
                                        icon: const Icon(Icons.delete_outline, size: 16),
                                        label: const Text('Удалить', style: TextStyle(fontSize: 13)),
                                        onPressed: () => _delete(d),
                                      ),
                                    ]),
                                  ],
                                ),
                              ),
                            );
                          },
                        ),
                      ),
          ),
        ],
      ),
      floatingActionButton: _docs.isEmpty ? null : FloatingActionButton(
        backgroundColor: Colors.teal,
        foregroundColor: Colors.white,
        onPressed: _showAddForm,
        child: const Icon(Icons.add),
      ),
    );
  }

  Color _typeColor(String type) {
    switch (type) {
      case 'discharge':    return Colors.blue;
      case 'surgery':      return Colors.red;
      case 'imaging':      return Colors.green;
      case 'prescription': return Colors.orange;
      default:             return Colors.grey;
    }
  }

  Future<void> _viewFile(MedDocument doc) async {
    final token = await StorageService.getToken();
    final url   = '${ApiConfig.documentFile(doc.id)}?token=$token';
    if (!mounted) return;
    Navigator.push(context, MaterialPageRoute(
      builder: (_) => _FileViewerScreen(doc: doc, url: url),
    ));
  }
}

class _FileViewerScreen extends StatelessWidget {
  final MedDocument doc;
  final String url;
  const _FileViewerScreen({required this.doc, required this.url});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: Text(doc.title),
        backgroundColor: Colors.teal,
        foregroundColor: Colors.white,
      ),
      body: doc.isImage
          ? InteractiveViewer(
              minScale: 0.5,
              maxScale: 4.0,
              child: Center(
                child: Image.network(
                  url,
                  fit: BoxFit.contain,
                  loadingBuilder: (_, child, progress) =>
                      progress == null ? child : const Center(child: CircularProgressIndicator()),
                  errorBuilder: (_, __, ___) => const Center(
                    child: Column(mainAxisAlignment: MainAxisAlignment.center, children: [
                      Icon(Icons.broken_image, size: 64, color: Colors.grey),
                      SizedBox(height: 8),
                      Text('Ошибка загрузки', style: TextStyle(color: Colors.grey)),
                    ]),
                  ),
                ),
              ),
            )
          : Center(
              child: Column(mainAxisAlignment: MainAxisAlignment.center, children: [
                const Icon(Icons.picture_as_pdf, size: 80, color: Colors.red),
                const SizedBox(height: 16),
                Text(doc.fileName ?? 'PDF документ',
                    style: const TextStyle(fontSize: 16, fontWeight: FontWeight.bold)),
                const SizedBox(height: 8),
                Text(doc.sizeLabel, style: const TextStyle(color: Colors.grey)),
                const SizedBox(height: 24),
                ElevatedButton.icon(
                  style: ElevatedButton.styleFrom(backgroundColor: Colors.red, foregroundColor: Colors.white),
                  icon: const Icon(Icons.open_in_new),
                  label: const Text('Открыть в браузере'),
                  onPressed: () {
                    // ignore: avoid_web_libraries_in_flutter
                    // ignore: undefined_prefixed_name
                    // Для Flutter web открываем через dart:html
                  },
                ),
              ]),
            ),
    );
  }
}
