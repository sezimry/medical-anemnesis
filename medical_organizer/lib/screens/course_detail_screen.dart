import 'package:flutter/material.dart';
import '../services/api_service.dart';
import '../models/treatment_course.dart';
import 'course_form_screen.dart';

class CourseDetailScreen extends StatefulWidget {
  final int courseId;
  const CourseDetailScreen({super.key, required this.courseId});

  @override
  State<CourseDetailScreen> createState() => _CourseDetailScreenState();
}

class _CourseDetailScreenState extends State<CourseDetailScreen> {
  Map<String, dynamic>? _data;
  List<Medication> _medications = [];
  bool _loading = true;

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    setState(() => _loading = true);
    try {
      final data = await ApiService.getCourse(widget.courseId);
      final meds = await ApiService.getMedications(widget.courseId);
      setState(() {
        _data = data;
        _medications = meds;
      });
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

  Future<void> _showMedForm({Medication? med}) async {
    final nameCtrl       = TextEditingController(text: med?.name ?? '');
    final dosageCtrl     = TextEditingController(text: med?.dosage ?? '');
    final freqCtrl       = TextEditingController(text: med?.frequency ?? '');
    final timesCtrl      = TextEditingController(text: med?.times ?? '');
    final durationCtrl   = TextEditingController(text: med?.duration ?? '');
    final condCtrl       = TextEditingController(text: med?.conditions ?? '');
    final notesCtrl      = TextEditingController(text: med?.notes ?? '');

    await showDialog(
      context: context,
      builder: (_) => AlertDialog(
        title: Text(med != null ? 'Редактировать лекарство' : 'Добавить лекарство'),
        content: SingleChildScrollView(
          child: Column(mainAxisSize: MainAxisSize.min, children: [
            _Field(ctrl: nameCtrl,     label: 'Название *'),
            _Field(ctrl: dosageCtrl,   label: 'Дозировка', hint: '500 мг'),
            _Field(ctrl: freqCtrl,     label: 'Частота', hint: '3 раза в день'),
            _Field(ctrl: timesCtrl,    label: 'Время приёма', hint: '08:00, 14:00, 20:00'),
            _Field(ctrl: durationCtrl, label: 'Продолжительность', hint: '7 дней'),
            _Field(ctrl: condCtrl,     label: 'Условия', hint: 'После еды'),
            _Field(ctrl: notesCtrl,    label: 'Примечание'),
          ]),
        ),
        actions: [
          TextButton(onPressed: () => Navigator.pop(context), child: const Text('Отмена')),
          ElevatedButton(
            style: ElevatedButton.styleFrom(backgroundColor: Colors.teal, foregroundColor: Colors.white),
            onPressed: () async {
              if (nameCtrl.text.trim().isEmpty) return;
              final body = {
                'name': nameCtrl.text.trim(),
                'dosage': dosageCtrl.text.trim().isEmpty ? null : dosageCtrl.text.trim(),
                'frequency': freqCtrl.text.trim().isEmpty ? null : freqCtrl.text.trim(),
                'times': timesCtrl.text.trim().isEmpty ? null : timesCtrl.text.trim(),
                'duration': durationCtrl.text.trim().isEmpty ? null : durationCtrl.text.trim(),
                'conditions': condCtrl.text.trim().isEmpty ? null : condCtrl.text.trim(),
                'notes': notesCtrl.text.trim().isEmpty ? null : notesCtrl.text.trim(),
              };
              try {
                if (med != null) {
                  await ApiService.updateMedication(widget.courseId, med.id, body);
                } else {
                  await ApiService.createMedication(widget.courseId, body);
                }
                if (mounted) Navigator.pop(context);
                _load();
              } catch (e) {
                if (mounted) {
                  ScaffoldMessenger.of(context).showSnackBar(
                    SnackBar(content: Text(e.toString()), backgroundColor: Colors.red),
                  );
                }
              }
            },
            child: const Text('Сохранить'),
          ),
        ],
      ),
    );
  }

  Future<void> _deleteMed(Medication med) async {
    final ok = await showDialog<bool>(
      context: context,
      builder: (_) => AlertDialog(
        title: const Text('Удалить лекарство?'),
        actions: [
          TextButton(onPressed: () => Navigator.pop(context, false), child: const Text('Отмена')),
          TextButton(onPressed: () => Navigator.pop(context, true),
              child: const Text('Удалить', style: TextStyle(color: Colors.red))),
        ],
      ),
    );
    if (ok == true) {
      await ApiService.deleteMedication(widget.courseId, med.id);
      _load();
    }
  }

  @override
  Widget build(BuildContext context) {
    if (_loading) {
      return const Scaffold(body: Center(child: CircularProgressIndicator()));
    }
    if (_data == null) {
      return const Scaffold(body: Center(child: Text('Нет данных')));
    }

    final course = TreatmentCourse.fromJson(_data!);

    return Scaffold(
      appBar: AppBar(
        title: Text(course.title),
        backgroundColor: Colors.teal,
        foregroundColor: Colors.white,
        actions: [
          IconButton(
            icon: const Icon(Icons.edit_outlined),
            onPressed: () => Navigator.push(
              context,
              MaterialPageRoute(builder: (_) => CourseFormScreen(course: course)),
            ).then((_) => _load()),
          ),
          IconButton(icon: const Icon(Icons.refresh), onPressed: _load),
        ],
      ),
      body: ListView(
        padding: const EdgeInsets.all(16),
        children: [
          // Информация о курсе
          Card(
            child: Padding(
              padding: const EdgeInsets.all(16),
              child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                Row(children: [
                  const Text('Информация о курсе',
                      style: TextStyle(fontWeight: FontWeight.bold, fontSize: 15)),
                  const Spacer(),
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                    decoration: BoxDecoration(
                      color: course.isActive ? Colors.green.shade100 : Colors.grey.shade200,
                      borderRadius: BorderRadius.circular(12),
                    ),
                    child: Text(
                      course.isActive ? 'Активный' : 'Завершён',
                      style: TextStyle(fontSize: 11,
                          color: course.isActive ? Colors.green.shade700 : Colors.grey),
                    ),
                  ),
                ]),
                const SizedBox(height: 12),
                if (course.doctorName != null) _DetailRow(icon: Icons.person_outline, label: 'Врач', value: course.doctorName!),
                if (course.institution != null) _DetailRow(icon: Icons.local_hospital_outlined, label: 'Учреждение', value: course.institution!),
                if (course.prescribedAt != null) _DetailRow(icon: Icons.calendar_today, label: 'Дата назначения', value: course.prescribedAt!),
                if (course.startedAt != null) _DetailRow(icon: Icons.play_circle_outline, label: 'Начало', value: course.startedAt!),
                if (course.endedAt != null) _DetailRow(icon: Icons.stop_circle_outlined, label: 'Окончание', value: course.endedAt!),
                if (course.prescription != null) ...[
                  const Divider(height: 20),
                  const Text('Назначение врача', style: TextStyle(fontWeight: FontWeight.w600, fontSize: 13)),
                  const SizedBox(height: 4),
                  Text(course.prescription!, style: const TextStyle(fontSize: 14)),
                ],
                if (course.notes != null) ...[
                  const Divider(height: 20),
                  const Text('Примечание', style: TextStyle(fontWeight: FontWeight.w600, fontSize: 13)),
                  const SizedBox(height: 4),
                  Text(course.notes!, style: const TextStyle(fontSize: 14, color: Colors.grey)),
                ],
              ]),
            ),
          ),

          const SizedBox(height: 16),

          // Лекарства
          Row(children: [
            const Text('Лекарства', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 15)),
            const Spacer(),
            TextButton.icon(
              style: TextButton.styleFrom(foregroundColor: Colors.teal),
              icon: const Icon(Icons.add, size: 18),
              label: const Text('Добавить'),
              onPressed: () => _showMedForm(),
            ),
          ]),

          if (_medications.isEmpty)
            const Card(
              child: Padding(
                padding: EdgeInsets.all(20),
                child: Center(child: Text('Лекарства не добавлены', style: TextStyle(color: Colors.grey))),
              ),
            )
          else
            ..._medications.map((m) => Card(
              child: Padding(
                padding: const EdgeInsets.all(12),
                child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                  Row(children: [
                    const Icon(Icons.medication_outlined, color: Colors.teal, size: 20),
                    const SizedBox(width: 8),
                    Expanded(child: Text(m.name,
                        style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 15))),
                    IconButton(icon: const Icon(Icons.edit_outlined, size: 18), onPressed: () => _showMedForm(med: m)),
                    IconButton(
                      icon: const Icon(Icons.delete_outline, size: 18, color: Colors.red),
                      onPressed: () => _deleteMed(m),
                    ),
                  ]),
                  const SizedBox(height: 6),
                  Wrap(spacing: 16, runSpacing: 4, children: [
                    if (m.dosage != null)    _MedChip(icon: Icons.circle, label: m.dosage!),
                    if (m.frequency != null) _MedChip(icon: Icons.repeat, label: m.frequency!),
                    if (m.times != null)     _MedChip(icon: Icons.access_time, label: m.times!),
                    if (m.duration != null)  _MedChip(icon: Icons.timelapse, label: m.duration!),
                    if (m.conditions != null)_MedChip(icon: Icons.info_outline, label: m.conditions!),
                  ]),
                  if (m.notes != null) ...[
                    const SizedBox(height: 4),
                    Text(m.notes!, style: const TextStyle(fontSize: 12, color: Colors.grey, fontStyle: FontStyle.italic)),
                  ],
                ]),
              ),
            )),
        ],
      ),
    );
  }
}

class _DetailRow extends StatelessWidget {
  final IconData icon;
  final String label;
  final String value;
  const _DetailRow({required this.icon, required this.label, required this.value});

  @override
  Widget build(BuildContext context) => Padding(
    padding: const EdgeInsets.symmetric(vertical: 4),
    child: Row(children: [
      Icon(icon, size: 16, color: Colors.grey),
      const SizedBox(width: 8),
      Text('$label: ', style: const TextStyle(color: Colors.grey, fontSize: 13)),
      Expanded(child: Text(value, style: const TextStyle(fontSize: 13))),
    ]),
  );
}

class _MedChip extends StatelessWidget {
  final IconData icon;
  final String label;
  const _MedChip({required this.icon, required this.label});

  @override
  Widget build(BuildContext context) => Row(mainAxisSize: MainAxisSize.min, children: [
    Icon(icon, size: 13, color: Colors.teal),
    const SizedBox(width: 3),
    Text(label, style: const TextStyle(fontSize: 12, color: Colors.grey)),
  ]);
}

class _Field extends StatelessWidget {
  final TextEditingController ctrl;
  final String label;
  final String? hint;
  const _Field({required this.ctrl, required this.label, this.hint});

  @override
  Widget build(BuildContext context) => Padding(
    padding: const EdgeInsets.only(bottom: 10),
    child: TextField(
      controller: ctrl,
      decoration: InputDecoration(
        labelText: label,
        hintText: hint,
        border: const OutlineInputBorder(),
        isDense: true,
      ),
    ),
  );
}
