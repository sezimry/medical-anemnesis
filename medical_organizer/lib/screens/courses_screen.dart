import 'package:flutter/material.dart';
import '../services/api_service.dart';
import '../services/cache_service.dart';
import '../models/treatment_course.dart';
import 'course_detail_screen.dart';

class CoursesScreen extends StatefulWidget {
  final bool standalone;
  const CoursesScreen({super.key, this.standalone = false});

  @override
  State<CoursesScreen> createState() => _CoursesScreenState();
}

class _CoursesScreenState extends State<CoursesScreen> {
  List<TreatmentCourse> _courses = [];
  bool _loading = true;

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    // Загружаем кэш сразу
    final cached = await CacheService.loadList(CacheService.courses);
    if (cached != null) {
      setState(() {
        _courses = cached.map(TreatmentCourse.fromJson).toList();
        _loading = false;
      });
    } else {
      setState(() => _loading = true);
    }

    // Обновляем с сервера
    try {
      final courses = await ApiService.getCourses();
      await CacheService.save(CacheService.courses,
          courses.map((c) => c.toJson()).toList());
      if (mounted) setState(() => _courses = courses);
    } catch (_) {
      if (mounted && cached == null) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Нет подключения. Показаны кэшированные данные.')),
        );
      }
    } finally {
      if (mounted) setState(() => _loading = false);
    }
  }

  Future<void> _deleteCourse(TreatmentCourse c) async {
    final ok = await showDialog<bool>(
      context: context,
      builder: (_) => AlertDialog(
        title: const Text('Удалить курс?'),
        content: Text('Курс "${c.title}" и все лекарства будут удалены.'),
        actions: [
          TextButton(onPressed: () => Navigator.pop(context, false), child: const Text('Отмена')),
          TextButton(onPressed: () => Navigator.pop(context, true),
              child: const Text('Удалить', style: TextStyle(color: Colors.red))),
        ],
      ),
    );
    if (ok == true) {
      await ApiService.deleteCourse(c.id);
      _load();
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Курсы лечения'),
        backgroundColor: Colors.teal,
        foregroundColor: Colors.white,
        actions: [IconButton(icon: const Icon(Icons.refresh), onPressed: _load)],
      ),
      body: _loading
          ? const Center(child: CircularProgressIndicator())
          : _courses.isEmpty
              ? Center(
                  child: Column(mainAxisAlignment: MainAxisAlignment.center, children: [
                    const Icon(Icons.medical_services_outlined, size: 64, color: Colors.grey),
                    const SizedBox(height: 12),
                    const Text('Нет курсов лечения', style: TextStyle(color: Colors.grey)),
                    const SizedBox(height: 16),
                    ElevatedButton.icon(
                      style: ElevatedButton.styleFrom(backgroundColor: Colors.teal, foregroundColor: Colors.white),
                      icon: const Icon(Icons.add),
                      label: const Text('Добавить курс'),
                      onPressed: () => Navigator.pushNamed(context, '/course/form').then((_) => _load()),
                    ),
                  ]),
                )
              : RefreshIndicator(
                  onRefresh: _load,
                  child: ListView.builder(
                    padding: const EdgeInsets.all(8),
                    itemCount: _courses.length,
                    itemBuilder: (_, i) {
                      final c = _courses[i];
                      return Card(
                        child: InkWell(
                          borderRadius: BorderRadius.circular(12),
                          onTap: () => Navigator.push(context,
                            MaterialPageRoute(builder: (_) => CourseDetailScreen(courseId: c.id)),
                          ).then((_) => _load()),
                          child: Padding(
                            padding: const EdgeInsets.all(14),
                            child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                              Row(children: [
                                Expanded(
                                  child: Text(c.title,
                                      style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 16)),
                                ),
                                Container(
                                  padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                                  decoration: BoxDecoration(
                                    color: c.isActive ? Colors.green.shade100 : Colors.grey.shade200,
                                    borderRadius: BorderRadius.circular(12),
                                  ),
                                  child: Text(
                                    c.isActive ? 'Активный' : 'Завершён',
                                    style: TextStyle(fontSize: 11, color: c.isActive ? Colors.green.shade700 : Colors.grey),
                                  ),
                                ),
                              ]),
                              const SizedBox(height: 6),
                              if (c.doctorName != null)
                                _Info(icon: Icons.person_outline, text: c.doctorName!),
                              if (c.institution != null)
                                _Info(icon: Icons.local_hospital_outlined, text: c.institution!),
                              if (c.startedAt != null)
                                _Info(icon: Icons.calendar_today,
                                    text: c.endedAt != null ? '${c.startedAt} — ${c.endedAt}' : 'С ${c.startedAt}'),
                              if (c.medicationsCount > 0) ...[
                                const SizedBox(height: 8),
                                Row(children: [
                                  const Icon(Icons.medication_outlined, size: 14, color: Colors.teal),
                                  const SizedBox(width: 4),
                                  Text('${c.medicationsCount} препарат(ов)',
                                      style: const TextStyle(fontSize: 12, color: Colors.teal)),
                                ]),
                              ],
                              const SizedBox(height: 10),
                              Row(mainAxisAlignment: MainAxisAlignment.end, children: [
                                TextButton.icon(
                                  icon: const Icon(Icons.edit_outlined, size: 16),
                                  label: const Text('Изменить'),
                                  onPressed: () => Navigator.pushNamed(context, '/course/form', arguments: c).then((_) => _load()),
                                ),
                                const SizedBox(width: 4),
                                TextButton.icon(
                                  style: TextButton.styleFrom(foregroundColor: Colors.red),
                                  icon: const Icon(Icons.delete_outline, size: 16),
                                  label: const Text('Удалить'),
                                  onPressed: () => _deleteCourse(c),
                                ),
                              ]),
                            ]),
                          ),
                        ),
                      );
                    },
                  ),
                ),
      floatingActionButton: _courses.isEmpty ? null : FloatingActionButton(
        backgroundColor: Colors.teal,
        foregroundColor: Colors.white,
        child: const Icon(Icons.add),
        onPressed: () => Navigator.pushNamed(context, '/course/form').then((_) => _load()),
      ),
    );
  }
}

class _Info extends StatelessWidget {
  final IconData icon;
  final String text;
  const _Info({required this.icon, required this.text});

  @override
  Widget build(BuildContext context) => Padding(
    padding: const EdgeInsets.only(top: 3),
    child: Row(children: [
      Icon(icon, size: 13, color: Colors.grey),
      const SizedBox(width: 4),
      Expanded(child: Text(text, style: const TextStyle(fontSize: 13, color: Colors.grey))),
    ]),
  );
}
