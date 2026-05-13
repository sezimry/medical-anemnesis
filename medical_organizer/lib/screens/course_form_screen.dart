import 'package:flutter/material.dart';
import '../services/api_service.dart';
import '../models/treatment_course.dart';

class CourseFormScreen extends StatefulWidget {
  final TreatmentCourse? course;
  const CourseFormScreen({super.key, this.course});

  @override
  State<CourseFormScreen> createState() => _CourseFormScreenState();
}

class _CourseFormScreenState extends State<CourseFormScreen> {
  final _formKey       = GlobalKey<FormState>();
  final _titleCtrl     = TextEditingController();
  final _doctorCtrl    = TextEditingController();
  final _institutCtrl  = TextEditingController();
  final _prescCtrl     = TextEditingController();
  final _notesCtrl     = TextEditingController();
  String? _prescribedAt;
  String? _startedAt;
  String? _endedAt;
  bool _isActive = true;
  bool _loading  = false;

  @override
  void initState() {
    super.initState();
    final c = widget.course;
    if (c != null) {
      _titleCtrl.text    = c.title;
      _doctorCtrl.text   = c.doctorName ?? '';
      _institutCtrl.text = c.institution ?? '';
      _prescCtrl.text    = c.prescription ?? '';
      _notesCtrl.text    = c.notes ?? '';
      _prescribedAt      = c.prescribedAt;
      _startedAt         = c.startedAt;
      _endedAt           = c.endedAt;
      _isActive          = c.isActive;
    }
  }

  Future<void> _pickDate(String field) async {
    final initial = () {
      final s = field == 'prescribed' ? _prescribedAt
               : field == 'started'   ? _startedAt
               : _endedAt;
      return s != null ? DateTime.tryParse(s) ?? DateTime.now() : DateTime.now();
    }();

    final d = await showDatePicker(
      context: context,
      initialDate: initial,
      firstDate: DateTime(2000),
      lastDate: DateTime(2100),
    );
    if (d == null) return;
    final str = '${d.year}-${d.month.toString().padLeft(2,'0')}-${d.day.toString().padLeft(2,'0')}';
    setState(() {
      if (field == 'prescribed') _prescribedAt = str;
      else if (field == 'started') _startedAt = str;
      else _endedAt = str;
    });
  }

  Future<void> _submit() async {
    if (!_formKey.currentState!.validate()) return;
    setState(() => _loading = true);
    final body = {
      'title':        _titleCtrl.text.trim(),
      'doctor_name':  _doctorCtrl.text.trim().isEmpty   ? null : _doctorCtrl.text.trim(),
      'institution':  _institutCtrl.text.trim().isEmpty ? null : _institutCtrl.text.trim(),
      'prescribed_at': _prescribedAt,
      'started_at':   _startedAt,
      'ended_at':     _endedAt,
      'prescription': _prescCtrl.text.trim().isEmpty ? null : _prescCtrl.text.trim(),
      'notes':        _notesCtrl.text.trim().isEmpty ? null : _notesCtrl.text.trim(),
      'is_active':    _isActive ? 1 : 0,
    };
    try {
      if (widget.course != null) {
        await ApiService.updateCourse(widget.course!.id, body);
      } else {
        await ApiService.createCourse(body);
      }
      if (mounted) Navigator.pop(context, true);
    } catch (e) {
      if (mounted) ScaffoldMessenger.of(context).showSnackBar(
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
        title: Text(widget.course != null ? 'Редактировать курс' : 'Новый курс лечения'),
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
              decoration: const InputDecoration(labelText: 'Название курса *', border: OutlineInputBorder()),
              validator: (v) => (v == null || v.isEmpty) ? 'Обязательное поле' : null,
            ),
            const SizedBox(height: 14),
            TextFormField(
              controller: _doctorCtrl,
              decoration: const InputDecoration(labelText: 'ФИО врача', border: OutlineInputBorder(),
                  prefixIcon: Icon(Icons.person_outline)),
            ),
            const SizedBox(height: 14),
            TextFormField(
              controller: _institutCtrl,
              decoration: const InputDecoration(labelText: 'Медицинское учреждение', border: OutlineInputBorder(),
                  prefixIcon: Icon(Icons.local_hospital_outlined)),
            ),
            const SizedBox(height: 14),

            // Даты
            Row(children: [
              Expanded(child: _DateField(label: 'Дата назначения', value: _prescribedAt, onTap: () => _pickDate('prescribed'))),
              const SizedBox(width: 10),
              Expanded(child: _DateField(label: 'Дата начала', value: _startedAt, onTap: () => _pickDate('started'))),
            ]),
            const SizedBox(height: 14),
            _DateField(label: 'Дата окончания', value: _endedAt, onTap: () => _pickDate('ended')),
            const SizedBox(height: 14),

            TextFormField(
              controller: _prescCtrl,
              decoration: const InputDecoration(labelText: 'Назначение врача', border: OutlineInputBorder()),
              maxLines: 4,
            ),
            const SizedBox(height: 14),
            TextFormField(
              controller: _notesCtrl,
              decoration: const InputDecoration(labelText: 'Примечание', border: OutlineInputBorder()),
              maxLines: 2,
            ),
            const SizedBox(height: 8),
            SwitchListTile(
              title: const Text('Активный курс'),
              value: _isActive,
              activeColor: Colors.teal,
              onChanged: (v) => setState(() => _isActive = v),
            ),
            const SizedBox(height: 24),
            ElevatedButton(
              onPressed: _loading ? null : _submit,
              style: ElevatedButton.styleFrom(
                backgroundColor: Colors.teal, foregroundColor: Colors.white,
                padding: const EdgeInsets.symmetric(vertical: 14),
              ),
              child: _loading
                  ? const CircularProgressIndicator(color: Colors.white)
                  : Text(widget.course != null ? 'Сохранить изменения' : 'Создать курс',
                      style: const TextStyle(fontSize: 16)),
            ),
          ],
        ),
      ),
    );
  }
}

class _DateField extends StatelessWidget {
  final String label;
  final String? value;
  final VoidCallback onTap;
  const _DateField({required this.label, required this.value, required this.onTap});

  @override
  Widget build(BuildContext context) => InkWell(
    onTap: onTap,
    child: InputDecorator(
      decoration: InputDecoration(
        labelText: label,
        border: const OutlineInputBorder(),
        suffixIcon: const Icon(Icons.calendar_today, size: 18),
      ),
      child: Text(value ?? 'Не указана',
          style: TextStyle(color: value == null ? Colors.grey : null, fontSize: 14)),
    ),
  );
}
