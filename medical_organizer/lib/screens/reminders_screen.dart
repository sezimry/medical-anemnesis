import 'package:flutter/material.dart';
import '../services/api_service.dart';
import '../services/cache_service.dart';
import '../services/notification_service.dart';
import '../models/reminder.dart';
import '../models/treatment_course.dart';

class RemindersScreen extends StatefulWidget {
  const RemindersScreen({super.key});

  @override
  State<RemindersScreen> createState() => _RemindersScreenState();
}

class _RemindersScreenState extends State<RemindersScreen> {
  List<Reminder> _reminders = [];
  List<TreatmentCourse> _courses = [];
  List<Medication> _medications = [];
  bool _loading = true;

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    // Загружаем кэш
    final cachedReminders = await CacheService.loadList(CacheService.reminders);
    final cachedCourses   = await CacheService.loadList(CacheService.courses);

    if (cachedReminders != null) {
      setState(() {
        _reminders = cachedReminders.map(Reminder.fromJson).toList();
        if (cachedCourses != null) {
          _courses = cachedCourses.map(TreatmentCourse.fromJson).toList();
        }
        _loading = false;
      });
    } else {
      setState(() => _loading = true);
    }

    // Обновляем с сервера
    try {
      final reminders = await ApiService.getReminders();
      final courses   = await ApiService.getCourses();

      final List<Medication> allMeds = [];
      for (final c in courses) {
        final meds = await ApiService.getMedications(c.id);
        allMeds.addAll(meds);
      }

      await CacheService.save(CacheService.reminders,
          reminders.map((r) => r.toJson()).toList());
      await CacheService.save(CacheService.courses,
          courses.map((c) => c.toJson()).toList());

      if (mounted) {
        setState(() {
          _reminders   = reminders;
          _courses     = courses;
          _medications = allMeds;
        });
      }

      await NotificationService.scheduleAll(reminders);
    } catch (_) {
      if (mounted && cachedReminders == null) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Нет подключения. Показаны кэшированные данные.')),
        );
      }
    } finally {
      if (mounted) setState(() => _loading = false);
    }
  }

  Future<void> _toggle(Reminder r) async {
    try {
      final updated = await ApiService.toggleReminder(r.id);
      await NotificationService.scheduleReminder(updated);
      _load();
    } catch (e) {
      if (mounted) ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text(e.toString()), backgroundColor: Colors.red),
      );
    }
  }

  Future<void> _delete(Reminder r) async {
    final ok = await showDialog<bool>(
      context: context,
      builder: (_) => AlertDialog(
        title: const Text('Удалить напоминание?'),
        actions: [
          TextButton(onPressed: () => Navigator.pop(context, false), child: const Text('Отмена')),
          TextButton(onPressed: () => Navigator.pop(context, true),
              child: const Text('Удалить', style: TextStyle(color: Colors.red))),
        ],
      ),
    );
    if (ok == true) {
      await ApiService.deleteReminder(r.id);
      await NotificationService.cancelReminder(r.id);
      _load();
    }
  }

  Future<void> _showForm({Reminder? reminder}) async {
    final titleCtrl = TextEditingController(text: reminder?.title ?? '');
    String time = reminder?.time ?? '08:00';
    List<String> days = reminder?.daysList ?? [];
    int? medicationId = reminder?.medicationId;
    int? courseId     = reminder?.courseId;
    bool isEnabled    = reminder?.isEnabled ?? true;

    await showDialog(
      context: context,
      builder: (_) => StatefulBuilder(
        builder: (ctx, setS) => AlertDialog(
          title: Text(reminder != null ? 'Редактировать' : 'Новое напоминание'),
          content: SingleChildScrollView(
            child: Column(mainAxisSize: MainAxisSize.min, children: [
              // Название
              TextField(
                controller: titleCtrl,
                decoration: const InputDecoration(labelText: 'Название *', border: OutlineInputBorder()),
              ),
              const SizedBox(height: 12),

              // Время
              InkWell(
                onTap: () async {
                  final parts = time.split(':');
                  final picked = await showTimePicker(
                    context: ctx,
                    initialTime: TimeOfDay(hour: int.parse(parts[0]), minute: int.parse(parts[1])),
                  );
                  if (picked != null) {
                    setS(() => time =
                      '${picked.hour.toString().padLeft(2,'0')}:${picked.minute.toString().padLeft(2,'0')}');
                  }
                },
                child: InputDecorator(
                  decoration: const InputDecoration(
                    labelText: 'Время *',
                    border: OutlineInputBorder(),
                    suffixIcon: Icon(Icons.access_time),
                  ),
                  child: Text(time),
                ),
              ),
              const SizedBox(height: 12),

              // Дни недели
              const Align(alignment: Alignment.centerLeft,
                child: Text('Дни недели (пусто = каждый день)',
                    style: TextStyle(fontSize: 12, color: Colors.grey))),
              const SizedBox(height: 6),
              Wrap(
                spacing: 6,
                children: ['Пн','Вт','Ср','Чт','Пт','Сб','Вс'].asMap().entries.map((e) {
                  final val = '${e.key + 1}';
                  final selected = days.contains(val);
                  return GestureDetector(
                    onTap: () => setS(() {
                      if (selected) days.remove(val); else days.add(val);
                    }),
                    child: CircleAvatar(
                      radius: 18,
                      backgroundColor: selected ? Colors.teal : Colors.grey.shade200,
                      child: Text(e.value,
                          style: TextStyle(fontSize: 11, fontWeight: FontWeight.bold,
                              color: selected ? Colors.white : Colors.grey.shade700)),
                    ),
                  );
                }).toList(),
              ),
              const SizedBox(height: 12),

              // Лекарство
              if (_medications.isNotEmpty)
                DropdownButtonFormField<int?>(
                  value: medicationId,
                  decoration: const InputDecoration(labelText: 'Лекарство', border: OutlineInputBorder()),
                  items: [
                    const DropdownMenuItem<int?>(value: null, child: Text('Без привязки')),
                    ..._medications.map((m) => DropdownMenuItem<int?>(
                      value: m.id, child: Text(m.name),
                    )),
                  ],
                  onChanged: (v) => setS(() => medicationId = v),
                ),
              const SizedBox(height: 12),

              // Курс
              if (_courses.isNotEmpty)
                DropdownButtonFormField<int?>(
                  value: courseId,
                  decoration: const InputDecoration(labelText: 'Курс лечения', border: OutlineInputBorder()),
                  items: [
                    const DropdownMenuItem<int?>(value: null, child: Text('Без привязки')),
                    ..._courses.map((c) => DropdownMenuItem<int?>(
                      value: c.id, child: Text(c.title),
                    )),
                  ],
                  onChanged: (v) => setS(() => courseId = v),
                ),
              const SizedBox(height: 8),

              // Активность
              SwitchListTile(
                title: const Text('Активное'),
                value: isEnabled,
                activeColor: Colors.teal,
                onChanged: (v) => setS(() => isEnabled = v),
                contentPadding: EdgeInsets.zero,
              ),
            ]),
          ),
          actions: [
            TextButton(onPressed: () => Navigator.pop(ctx), child: const Text('Отмена')),
            ElevatedButton(
              style: ElevatedButton.styleFrom(backgroundColor: Colors.teal, foregroundColor: Colors.white),
              onPressed: () async {
                if (titleCtrl.text.trim().isEmpty) return;
                final body = {
                  'title':         titleCtrl.text.trim(),
                  'time':          time,
                  'days':          days.isEmpty ? null : days.join(','),
                  'medication_id': medicationId,
                  'course_id':     courseId,
                  'is_enabled':    isEnabled ? 1 : 0,
                };
                try {
                  Reminder result;
                  if (reminder != null) {
                    result = await ApiService.updateReminder(reminder.id, body);
                  } else {
                    result = await ApiService.createReminder(body);
                  }
                  await NotificationService.scheduleReminder(result);
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
    final activeCount = _reminders.where((r) => r.isEnabled).length;

    return Scaffold(
      appBar: AppBar(
        title: const Text('Напоминания'),
        backgroundColor: Colors.teal,
        foregroundColor: Colors.white,
        actions: [IconButton(icon: const Icon(Icons.refresh), onPressed: _load)],
      ),
      body: _loading
          ? const Center(child: CircularProgressIndicator())
          : Column(children: [
              // Статистика
              if (_reminders.isNotEmpty)
                Padding(
                  padding: const EdgeInsets.all(12),
                  child: Row(children: [
                    _StatChip(label: 'Всего', value: _reminders.length, color: Colors.blue),
                    const SizedBox(width: 8),
                    _StatChip(label: 'Активных', value: activeCount, color: Colors.green),
                    const SizedBox(width: 8),
                    _StatChip(label: 'Откл.', value: _reminders.length - activeCount, color: Colors.grey),
                  ]),
                ),

              // Список
              Expanded(
                child: _reminders.isEmpty
                    ? Center(
                        child: Column(mainAxisAlignment: MainAxisAlignment.center, children: [
                          const Icon(Icons.notifications_off_outlined, size: 64, color: Colors.grey),
                          const SizedBox(height: 12),
                          const Text('Нет напоминаний', style: TextStyle(color: Colors.grey)),
                          const SizedBox(height: 16),
                          ElevatedButton.icon(
                            style: ElevatedButton.styleFrom(backgroundColor: Colors.teal, foregroundColor: Colors.white),
                            icon: const Icon(Icons.add),
                            label: const Text('Добавить'),
                            onPressed: () => _showForm(),
                          ),
                        ]),
                      )
                    : ListView.builder(
                        padding: const EdgeInsets.symmetric(horizontal: 8),
                        itemCount: _reminders.length,
                        itemBuilder: (_, i) {
                          final r = _reminders[i];
                          return Opacity(
                            opacity: r.isEnabled ? 1.0 : 0.55,
                            child: Card(
                              child: ListTile(
                                leading: CircleAvatar(
                                  backgroundColor: r.isEnabled ? Colors.teal : Colors.grey,
                                  child: Icon(
                                    r.isEnabled ? Icons.notifications_active : Icons.notifications_off,
                                    color: Colors.white, size: 20,
                                  ),
                                ),
                                title: Text(r.title, style: const TextStyle(fontWeight: FontWeight.w600)),
                                subtitle: Column(
                                  crossAxisAlignment: CrossAxisAlignment.start,
                                  children: [
                                    Row(children: [
                                      const Icon(Icons.access_time, size: 13, color: Colors.grey),
                                      const SizedBox(width: 4),
                                      Text(r.time, style: const TextStyle(fontSize: 13)),
                                      const SizedBox(width: 12),
                                      const Icon(Icons.calendar_today, size: 13, color: Colors.grey),
                                      const SizedBox(width: 4),
                                      Text(r.daysLabel, style: const TextStyle(fontSize: 12, color: Colors.grey)),
                                    ]),
                                    if (r.medicationName != null)
                                      Text('💊 ${r.medicationName}',
                                          style: const TextStyle(fontSize: 12, color: Colors.teal)),
                                  ],
                                ),
                                isThreeLine: r.medicationName != null,
                                trailing: Row(mainAxisSize: MainAxisSize.min, children: [
                                  Switch(
                                    value: r.isEnabled,
                                    activeColor: Colors.teal,
                                    onChanged: (_) => _toggle(r),
                                  ),
                                  IconButton(
                                    icon: const Icon(Icons.edit_outlined, color: Colors.teal, size: 20),
                                    onPressed: () => _showForm(reminder: r),
                                  ),
                                  IconButton(
                                    icon: const Icon(Icons.delete_outline, color: Colors.red, size: 20),
                                    onPressed: () => _delete(r),
                                  ),
                                ]),
                              ),
                            ),
                          );
                        },
                      ),
              ),
            ]),
      floatingActionButton: _reminders.isEmpty ? null : FloatingActionButton(
        backgroundColor: Colors.teal,
        foregroundColor: Colors.white,
        onPressed: () => _showForm(),
        child: const Icon(Icons.add),
      ),
    );
  }
}

class _StatChip extends StatelessWidget {
  final String label;
  final int value;
  final Color color;
  const _StatChip({required this.label, required this.value, required this.color});

  @override
  Widget build(BuildContext context) => Expanded(
    child: Container(
      padding: const EdgeInsets.symmetric(vertical: 10),
      decoration: BoxDecoration(
        color: color.withValues(alpha: 0.1),
        borderRadius: BorderRadius.circular(8),
      ),
      child: Column(children: [
        Text('$value', style: TextStyle(fontSize: 20, fontWeight: FontWeight.bold, color: color)),
        Text(label, style: TextStyle(fontSize: 11, color: color)),
      ]),
    ),
  );
}
