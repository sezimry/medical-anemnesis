import 'package:flutter/material.dart';
import '../../services/api_service.dart';
import '../../models/relative.dart';

class PatientDetailScreen extends StatefulWidget {
  const PatientDetailScreen({super.key});

  @override
  State<PatientDetailScreen> createState() => _PatientDetailScreenState();
}

class _PatientDetailScreenState extends State<PatientDetailScreen> {
  Map<String, dynamic>? _patientInfo;
  Map<String, dynamic>? _data;
  bool _loading = true;
  int _tab = 0;

  @override
  void didChangeDependencies() {
    super.didChangeDependencies();
    final args = ModalRoute.of(context)?.settings.arguments;
    if (args is Map<String, dynamic> && _patientInfo == null) {
      _patientInfo = args;
      _load(args['id']);
    }
  }

  Future<void> _load(int id) async {
    setState(() => _loading = true);
    try {
      final data = await ApiService.getPatient(id);
      setState(() => _data = data);
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text(e.toString()), backgroundColor: Colors.red),
        );
      }
    } finally {
      if (mounted) setState(() => _loading = false);
    }
  }

  Future<void> _showAddDiagnosis() async {
    final titleCtrl = TextEditingController();
    final icdCtrl   = TextEditingController();
    final descCtrl  = TextEditingController();
    bool isChronic  = false;

    await showDialog(
      context: context,
      builder: (_) => StatefulBuilder(
        builder: (ctx, setS) => AlertDialog(
          title: const Text('Добавить диагноз'),
          content: SingleChildScrollView(
            child: Column(mainAxisSize: MainAxisSize.min, children: [
              TextField(controller: titleCtrl, decoration: const InputDecoration(labelText: 'Название *', border: OutlineInputBorder())),
              const SizedBox(height: 12),
              TextField(controller: icdCtrl, decoration: const InputDecoration(labelText: 'Код МКБ-10', border: OutlineInputBorder())),
              const SizedBox(height: 12),
              TextField(controller: descCtrl, decoration: const InputDecoration(labelText: 'Описание', border: OutlineInputBorder()), maxLines: 2),
              const SizedBox(height: 8),
              SwitchListTile(
                title: const Text('Хроническое'),
                value: isChronic,
                onChanged: (v) => setS(() => isChronic = v),
              ),
            ]),
          ),
          actions: [
            TextButton(onPressed: () => Navigator.pop(ctx), child: const Text('Отмена')),
            ElevatedButton(
              style: ElevatedButton.styleFrom(backgroundColor: Colors.teal, foregroundColor: Colors.white),
              onPressed: () async {
                if (titleCtrl.text.trim().isEmpty) return;
                try {
                  await ApiService.addPatientDiagnosis(_patientInfo!['id'], {
                    'title':      titleCtrl.text.trim(),
                    'icd_code':   icdCtrl.text.trim().isEmpty ? null : icdCtrl.text.trim(),
                    'description': descCtrl.text.trim().isEmpty ? null : descCtrl.text.trim(),
                    'is_chronic': isChronic ? 1 : 0,
                  });
                  if (mounted) Navigator.pop(ctx);
                  _load(_patientInfo!['id']);
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

  Future<void> _showAddAllergy() async {
    final allergenCtrl  = TextEditingController();
    final reactionCtrl  = TextEditingController();
    String? severity;

    await showDialog(
      context: context,
      builder: (_) => StatefulBuilder(
        builder: (ctx, setS) => AlertDialog(
          title: const Text('Добавить аллергию'),
          content: SingleChildScrollView(
            child: Column(mainAxisSize: MainAxisSize.min, children: [
              TextField(controller: allergenCtrl, decoration: const InputDecoration(labelText: 'Аллерген *', border: OutlineInputBorder())),
              const SizedBox(height: 12),
              TextField(controller: reactionCtrl, decoration: const InputDecoration(labelText: 'Реакция', border: OutlineInputBorder())),
              const SizedBox(height: 12),
              DropdownButtonFormField<String?>(
                value: severity,
                decoration: const InputDecoration(labelText: 'Тяжесть', border: OutlineInputBorder()),
                items: const [
                  DropdownMenuItem(value: null,       child: Text('Не указана')),
                  DropdownMenuItem(value: 'mild',     child: Text('Лёгкая')),
                  DropdownMenuItem(value: 'moderate', child: Text('Средняя')),
                  DropdownMenuItem(value: 'severe',   child: Text('Тяжёлая')),
                ],
                onChanged: (v) => setS(() => severity = v),
              ),
            ]),
          ),
          actions: [
            TextButton(onPressed: () => Navigator.pop(ctx), child: const Text('Отмена')),
            ElevatedButton(
              style: ElevatedButton.styleFrom(backgroundColor: Colors.teal, foregroundColor: Colors.white),
              onPressed: () async {
                if (allergenCtrl.text.trim().isEmpty) return;
                try {
                  await ApiService.addPatientAllergy(_patientInfo!['id'], {
                    'allergen': allergenCtrl.text.trim(),
                    'reaction': reactionCtrl.text.trim().isEmpty ? null : reactionCtrl.text.trim(),
                    'severity': severity,
                  });
                  if (mounted) Navigator.pop(ctx);
                  _load(_patientInfo!['id']);
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

  Future<void> _deleteDiag(int diagId) async {
    final ok = await showDialog<bool>(
      context: context,
      builder: (_) => AlertDialog(
        title: const Text('Удалить диагноз?'),
        actions: [
          TextButton(onPressed: () => Navigator.pop(context, false), child: const Text('Отмена')),
          TextButton(onPressed: () => Navigator.pop(context, true),
              child: const Text('Удалить', style: TextStyle(color: Colors.red))),
        ],
      ),
    );
    if (ok == true) {
      await ApiService.deletePatientDiagnosis(_patientInfo!['id'], diagId);
      _load(_patientInfo!['id']);
    }
  }

  Future<void> _deleteAllergy(int allergId) async {
    final ok = await showDialog<bool>(
      context: context,
      builder: (_) => AlertDialog(
        title: const Text('Удалить аллергию?'),
        actions: [
          TextButton(onPressed: () => Navigator.pop(context, false), child: const Text('Отмена')),
          TextButton(onPressed: () => Navigator.pop(context, true),
              child: const Text('Удалить', style: TextStyle(color: Colors.red))),
        ],
      ),
    );
    if (ok == true) {
      await ApiService.deletePatientAllergy(_patientInfo!['id'], allergId);
      _load(_patientInfo!['id']);
    }
  }

  @override
  Widget build(BuildContext context) {
    final name = _patientInfo?['full_name'] ?? 'Пациент';

    return Scaffold(
      appBar: AppBar(
        title: Text(name),
        backgroundColor: Colors.teal,
        foregroundColor: Colors.white,
        actions: [
          IconButton(icon: const Icon(Icons.refresh), onPressed: () => _load(_patientInfo!['id'])),
        ],
      ),
      body: _loading
          ? const Center(child: CircularProgressIndicator())
          : _data == null
              ? const Center(child: Text('Нет данных'))
              : _buildBody(),
      floatingActionButton: _data == null ? null : FloatingActionButton.extended(
        backgroundColor: Colors.teal,
        foregroundColor: Colors.white,
        icon: const Icon(Icons.add),
        label: Text(_tab == 0 ? 'Диагноз' : 'Аллергия'),
        onPressed: _tab == 0 ? _showAddDiagnosis : _showAddAllergy,
      ),
    );
  }

  Widget _buildBody() {
    final user      = _data!['user'] as Map<String, dynamic>;
    final relatives = (_data!['relatives'] as List).cast<Map<String, dynamic>>();
    final diagnoses = (_data!['diagnoses'] as List).cast<Map<String, dynamic>>();
    final allergies = (_data!['allergies'] as List).cast<Map<String, dynamic>>();

    String relativeName(dynamic rid) {
      if (rid == null) return 'Сам пациент';
      return relatives.firstWhere((r) => r['id'] == rid, orElse: () => {'full_name': '—'})['full_name'];
    }

    return Column(
      children: [
        // Карточка пациента
        Card(
          margin: const EdgeInsets.all(12),
          child: Padding(
            padding: const EdgeInsets.all(16),
            child: Row(children: [
              CircleAvatar(
                radius: 28, backgroundColor: Colors.teal,
                child: Text((user['full_name'] as String)[0].toUpperCase(),
                    style: const TextStyle(color: Colors.white, fontSize: 22, fontWeight: FontWeight.bold)),
              ),
              const SizedBox(width: 16),
              Expanded(child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                Text(user['full_name'], style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 16)),
                Text(user['email'], style: const TextStyle(color: Colors.grey, fontSize: 13)),
                if (user['birth_date'] != null)
                  Text(user['birth_date'], style: const TextStyle(color: Colors.grey, fontSize: 12)),
              ])),
              Column(children: [
                _MiniStat(label: 'Диагнозов', value: diagnoses.length, color: Colors.orange),
                const SizedBox(height: 8),
                _MiniStat(label: 'Аллергий', value: allergies.length, color: Colors.red),
              ]),
            ]),
          ),
        ),

        // Вкладки
        Padding(
          padding: const EdgeInsets.symmetric(horizontal: 12),
          child: Row(children: [
            _TabBtn(label: 'Диагнозы (${diagnoses.length})', active: _tab == 0, onTap: () => setState(() => _tab = 0)),
            const SizedBox(width: 8),
            _TabBtn(label: 'Аллергии (${allergies.length})', active: _tab == 1, onTap: () => setState(() => _tab = 1)),
            const SizedBox(width: 8),
            _TabBtn(label: 'Родственники (${relatives.length})', active: _tab == 2, onTap: () => setState(() => _tab = 2)),
          ]),
        ),
        const SizedBox(height: 8),

        // Содержимое вкладок
        Expanded(
          child: ListView(
            padding: const EdgeInsets.fromLTRB(12, 0, 12, 80),
            children: [
              if (_tab == 0) ...[
                if (diagnoses.isEmpty)
                  const Center(child: Padding(padding: EdgeInsets.all(32), child: Text('Диагнозов нет', style: TextStyle(color: Colors.grey))))
                else
                  ...diagnoses.map((d) => Card(
                    child: ListTile(
                      leading: const CircleAvatar(backgroundColor: Colors.orange,
                          child: Icon(Icons.medical_information, color: Colors.white, size: 18)),
                      title: Text(d['title'], style: const TextStyle(fontWeight: FontWeight.w600)),
                      subtitle: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                        Text(relativeName(d['relative_id'])),
                        if (d['icd_code'] != null)
                          Text(d['icd_code'], style: const TextStyle(color: Colors.teal, fontSize: 12)),
                      ]),
                      isThreeLine: d['icd_code'] != null,
                      trailing: Row(mainAxisSize: MainAxisSize.min, children: [
                        if (d['is_chronic'] == 1)
                          const Chip(label: Text('Хр.', style: TextStyle(fontSize: 10))),
                        IconButton(
                          icon: const Icon(Icons.delete_outline, color: Colors.red),
                          onPressed: () => _deleteDiag(d['id']),
                        ),
                      ]),
                    ),
                  )),
              ],

              if (_tab == 1) ...[
                if (allergies.isEmpty)
                  const Center(child: Padding(padding: EdgeInsets.all(32), child: Text('Аллергий нет', style: TextStyle(color: Colors.grey))))
                else
                  ...allergies.map((a) {
                    final sev = a['severity'];
                    final color = sev == 'severe' ? Colors.red : sev == 'moderate' ? Colors.orange : Colors.green;
                    return Card(
                      child: ListTile(
                        leading: CircleAvatar(backgroundColor: color,
                            child: const Icon(Icons.warning_amber, color: Colors.white, size: 18)),
                        title: Text(a['allergen'], style: const TextStyle(fontWeight: FontWeight.w600)),
                        subtitle: Text(relativeName(a['relative_id'])),
                        trailing: Row(mainAxisSize: MainAxisSize.min, children: [
                          if (sev != null) Chip(
                            label: Text(sev == 'severe' ? 'Тяж.' : sev == 'moderate' ? 'Ср.' : 'Лёг.',
                                style: const TextStyle(fontSize: 10)),
                            backgroundColor: color.withValues(alpha: 0.2),
                          ),
                          IconButton(
                            icon: const Icon(Icons.delete_outline, color: Colors.red),
                            onPressed: () => _deleteAllergy(a['id']),
                          ),
                        ]),
                      ),
                    );
                  }),
              ],

              if (_tab == 2) ...[
                if (relatives.isEmpty)
                  const Center(child: Padding(padding: EdgeInsets.all(32), child: Text('Родственников нет', style: TextStyle(color: Colors.grey))))
                else
                  ...relatives.map((r) => Card(
                    child: ListTile(
                      leading: CircleAvatar(backgroundColor: Colors.blueGrey,
                          child: Text((r['full_name'] as String)[0], style: const TextStyle(color: Colors.white))),
                      title: Text(r['full_name']),
                      subtitle: Text(Relative.relationLabel(r['relation_type'])),
                    ),
                  )),
              ],
            ],
          ),
        ),
      ],
    );
  }
}

class _MiniStat extends StatelessWidget {
  final String label;
  final int value;
  final Color color;
  const _MiniStat({required this.label, required this.value, required this.color});

  @override
  Widget build(BuildContext context) => Column(children: [
    Text('$value', style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold, color: color)),
    Text(label, style: const TextStyle(fontSize: 10, color: Colors.grey)),
  ]);
}

class _TabBtn extends StatelessWidget {
  final String label;
  final bool active;
  final VoidCallback onTap;
  const _TabBtn({required this.label, required this.active, required this.onTap});

  @override
  Widget build(BuildContext context) => Expanded(
    child: GestureDetector(
      onTap: onTap,
      child: Container(
        padding: const EdgeInsets.symmetric(vertical: 8),
        decoration: BoxDecoration(
          color: active ? Colors.teal : Colors.grey.shade200,
          borderRadius: BorderRadius.circular(8),
        ),
        child: Text(label,
          textAlign: TextAlign.center,
          style: TextStyle(fontSize: 11, fontWeight: FontWeight.w600,
              color: active ? Colors.white : Colors.grey.shade700),
        ),
      ),
    ),
  );
}
