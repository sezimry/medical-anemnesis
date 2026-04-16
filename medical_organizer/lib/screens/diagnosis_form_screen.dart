import 'package:flutter/material.dart';
import '../services/api_service.dart';
import '../models/relative.dart';

class DiagnosisFormScreen extends StatefulWidget {
  const DiagnosisFormScreen({super.key});

  @override
  State<DiagnosisFormScreen> createState() => _DiagnosisFormScreenState();
}

class _DiagnosisFormScreenState extends State<DiagnosisFormScreen> {
  final _formKey  = GlobalKey<FormState>();
  final _titleCtrl = TextEditingController();
  final _icdCtrl   = TextEditingController();
  final _descCtrl  = TextEditingController();
  int? _relativeId;
  bool _isChronic = false;
  String? _diagnosedAt;
  bool _loading = false;
  List<Relative> _relatives = [];

  @override
  void didChangeDependencies() {
    super.didChangeDependencies();
    final args = ModalRoute.of(context)?.settings.arguments;
    if (args is List<Relative>) _relatives = args;
  }

  Future<void> _pickDate() async {
    final d = await showDatePicker(
      context: context,
      initialDate: DateTime.now(),
      firstDate: DateTime(1900),
      lastDate: DateTime.now(),
    );
    if (d != null) {
      setState(() => _diagnosedAt = '${d.year}-${d.month.toString().padLeft(2,'0')}-${d.day.toString().padLeft(2,'0')}');
    }
  }

  Future<void> _submit() async {
    if (!_formKey.currentState!.validate()) return;
    setState(() => _loading = true);
    try {
      await ApiService.createDiagnosis({
        'title': _titleCtrl.text.trim(),
        'icd_code': _icdCtrl.text.trim().isEmpty ? null : _icdCtrl.text.trim(),
        'description': _descCtrl.text.trim().isEmpty ? null : _descCtrl.text.trim(),
        'relative_id': _relativeId,
        'is_chronic': _isChronic ? 1 : 0,
        'diagnosed_at': _diagnosedAt,
      });
      if (mounted) Navigator.pop(context);
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
        title: const Text('Добавить диагноз'),
        backgroundColor: Colors.teal,
        foregroundColor: Colors.white,
      ),
      body: Form(
        key: _formKey,
        child: ListView(
          padding: const EdgeInsets.all(16),
          children: [
            TextFormField(
              controller: _titleCtrl,
              decoration: const InputDecoration(
                labelText: 'Название диагноза *',
                border: OutlineInputBorder(),
              ),
              validator: (v) => (v == null || v.isEmpty) ? 'Введите название' : null,
            ),
            const SizedBox(height: 16),
            TextFormField(
              controller: _icdCtrl,
              decoration: const InputDecoration(
                labelText: 'Код МКБ-10 (например I10)',
                border: OutlineInputBorder(),
              ),
            ),
            const SizedBox(height: 16),
            DropdownButtonFormField<int?>(
              value: _relativeId,
              decoration: const InputDecoration(
                labelText: 'Кому',
                border: OutlineInputBorder(),
              ),
              items: [
                const DropdownMenuItem<int?>(value: null, child: Text('Я сам')),
                ..._relatives.map((r) => DropdownMenuItem<int?>(
                  value: r.id,
                  child: Text('${r.fullName} (${Relative.relationLabel(r.relationType)})'),
                )),
              ],
              onChanged: (v) => setState(() => _relativeId = v),
            ),
            const SizedBox(height: 16),
            InkWell(
              onTap: _pickDate,
              child: InputDecorator(
                decoration: const InputDecoration(
                  labelText: 'Дата постановки диагноза',
                  border: OutlineInputBorder(),
                  suffixIcon: Icon(Icons.calendar_today),
                ),
                child: Text(_diagnosedAt ?? 'Не указана', style: TextStyle(
                  color: _diagnosedAt == null ? Colors.grey : null,
                )),
              ),
            ),
            const SizedBox(height: 16),
            TextFormField(
              controller: _descCtrl,
              decoration: const InputDecoration(
                labelText: 'Описание',
                border: OutlineInputBorder(),
              ),
              maxLines: 3,
            ),
            const SizedBox(height: 8),
            SwitchListTile(
              title: const Text('Хроническое заболевание'),
              value: _isChronic,
              activeColor: Colors.teal,
              onChanged: (v) => setState(() => _isChronic = v),
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
                  : const Text('Сохранить', style: TextStyle(fontSize: 16)),
            ),
          ],
        ),
      ),
    );
  }
}
