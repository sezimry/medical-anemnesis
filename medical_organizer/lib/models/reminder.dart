class Reminder {
  final int id;
  final int? medicationId;
  final int? courseId;
  final String title;
  final String time;
  final String? days;
  final bool isEnabled;
  final String? medicationName;
  final String? courseTitle;

  Reminder({
    required this.id,
    this.medicationId,
    this.courseId,
    required this.title,
    required this.time,
    this.days,
    this.isEnabled = true,
    this.medicationName,
    this.courseTitle,
  });

  factory Reminder.fromJson(Map<String, dynamic> j) => Reminder(
    id:             j['id'],
    medicationId:   j['medication_id'],
    courseId:       j['course_id'],
    title:          j['title'],
    time:           j['time'],
    days:           j['days'],
    isEnabled:      j['is_enabled'] == 1 || j['is_enabled'] == true,
    medicationName: j['medication_name'],
    courseTitle:    j['course_title'],
  );

  Map<String, dynamic> toJson() => {
    'id': id, 'medication_id': medicationId, 'course_id': courseId,
    'title': title, 'time': time, 'days': days,
    'is_enabled': isEnabled ? 1 : 0,
    'medication_name': medicationName, 'course_title': courseTitle,
  };

  List<String> get daysList => days?.split(',') ?? [];

  static const dayNames = ['', 'Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'];
  String get daysLabel {
    if (days == null || days!.isEmpty) return 'Каждый день';
    return daysList.map((d) => dayNames[int.parse(d)]).join(', ');
  }
}
