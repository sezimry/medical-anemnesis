import 'package:flutter/material.dart';
import '../services/api_service.dart';
import '../models/relative.dart';

class RelativeFormScreen extends StatefulWidget {
  const RelativeFormScreen({super.key});

  @override
  State<RelativeFormScreen> createState() => _RelativeFormScreenState();
}

class _RelativeFormScreenState extends State<RelativeFormScreen> {
  final _formKey   = GlobalKey<FormState>();
  final _nameCtrl  = TextEditingController();
  final _notesCtrl = TextEditingController();
  String _relation = 'father';
  String? _gender;
  String? _birthDate;
  bool _loading = false;
  Relative? _editing;

  final _relations = [
    'father','mother','brother','sister','son','daughter',
    'grandfather','grandmother','uncle','aunt','other',
  ];

  @override
  void didChangeDependencies() {
    super.didChangeDependencies();
    final args = ModalRoute.of(context)?.settings.arguments;
    if (args is Relative && _editing == null) {
      _editing = args;
      _nameCtrl.text  = args.fullName;
      _notesCtrl.text = args.notes ?? '';
      _relation   = args.relationType;
      _gender     = args.gender;
      _birthDate  = args.birthDate;
    }
  }

  Future<void> _pickDate() async {
    final d = await showDatePicker(
      context: context,
      initialDate: _birthDate != null
          ? DateTime.tryParse(_birthDate!) ?? DateTime(1980)
          : DateTime(1980),
      firstDate: DateTime(1900),
      lastDate: DateTime.now(),
    );
    if (d != null) {
      setState(() => _birthDate =
          '${d.year}-${d.month.toString().padLeft(2,'0')}-${d.day.toString().padLeft(2,'0')}');
    }
  }

  Future<void> _submit() async {
    if (!_formKey.currentState!.validate()) return;
    setState(() => _loading = true);
    final body = {
      'full_name':    _nameCtrl.text.trim(),
      'relation_type': _relation,
      'gender':       _gender,
      'birth_date':   _birthDate,
      'notes':        _notesCtrl.text.trim().isEmpty ? null : _notesCtrl.text.trim(),
    };
    try {
      if (_editing != null) {
        await ApiService.updateRelative(_editing!.id, body);
      } else {
        await ApiService.createRelative(body);
      }
      if (mounted) Navigator.pop(context, true);
    } catch (e) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text(e.toString()), backgroundColor: Colors.red),
      );
    } finally {
      if (mounted) setState(() => _loading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: Text(_editing != null ? 'Редактировать' : 'Добавить родственника'),
        backgroundColor: Colors.teal,
        foregroundColor: Colors.white,
      ),
      body: Form(
        key: _formKey,
        child: ListView(
          padding: const EdgeInsets.all(16),
          children: [
            TextFormField(
              controller: _nameCtrl,
              decoration: const InputDecoration(
                labelText: 'Полное имя *',
                border: OutlineInputBorder(),
              ),
              validator: (v) => (v == null || v.isEmpty) ? 'Введите имя' : null,
            ),
            const SizedBox(height: 16),
            DropdownButtonFormField<String>(
              value: _relation,
              decoration: const InputDecoration(labelText: 'Родство', border: OutlineInputBorder()),
              items: _relations.map((r) => DropdownMenuItem(
                value: r, child: Text(Relative.relationLabel(r)),
              )).toList(),
              onChanged: (v) => setState(() => _relation = v!),
            ),
            const SizedBox(height: 16),
            DropdownButtonFormField<String?>(
              value: _gender,
              decoration: const InputDecoration(labelText: 'Пол', border: OutlineInputBorder()),
              items: const [
                DropdownMenuItem(value: null,     child: Text('Не указан')),
                DropdownMenuItem(value: 'male',   child: Text('Мужской')),
                DropdownMenuItem(value: 'female', child: Text('Женский')),
                DropdownMenuItem(value: 'other',  child: Text('Другой')),
              ],
              onChanged: (v) => setState(() => _gender = v),
            ),
            const SizedBox(height: 16),
            InkWell(
              onTap: _pickDate,
              child: InputDecorator(
                decoration: const InputDecoration(
                  labelText: 'Дата рождения',
                  border: OutlineInputBorder(),
                  suffixIcon: Icon(Icons.calendar_today),
                ),
                child: Text(
                  _birthDate ?? 'Не указана',
                  style: TextStyle(color: _birthDate == null ? Colors.grey : null),
                ),
              ),
            ),
            const SizedBox(height: 16),
            TextFormField(
              controller: _notesCtrl,
              decoration: const InputDecoration(labelText: 'Заметки', border: OutlineInputBorder()),
              maxLines: 3,
            ),
            const SizedBox(height: 24),
            ElevatedButton(
              onPressed: _loading ? null : _submit,
              style: ElevatedButton.styleFrom(
                backgroundColor: Colors.teal,
                foregroundColor: Colors.white,
                padding: const EdgeInsets.symmetric(vertical: 14),
              ),
              child: _loading
                  ? const CircularProgressIndicator(color: Colors.white)
                  : Text(_editing != null ? 'Сохранить изменения' : 'Добавить',
                      style: const TextStyle(fontSize: 16)),
            ),
          ],
        ),
      ),
    );
  }
}
