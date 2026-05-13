class TreatmentCourse {
  final int id;
  final String title;
  final String? doctorName;
  final String? institution;
  final String? prescribedAt;
  final String? startedAt;
  final String? endedAt;
  final String? prescription;
  final String? notes;
  final bool isActive;
  final int medicationsCount;

  TreatmentCourse({
    required this.id,
    required this.title,
    this.doctorName,
    this.institution,
    this.prescribedAt,
    this.startedAt,
    this.endedAt,
    this.prescription,
    this.notes,
    this.isActive = true,
    this.medicationsCount = 0,
  });

  Map<String, dynamic> toJson() => {
    'id': id, 'title': title, 'doctor_name': doctorName,
    'institution': institution, 'prescribed_at': prescribedAt,
    'started_at': startedAt, 'ended_at': endedAt,
    'prescription': prescription, 'notes': notes,
    'is_active': isActive ? 1 : 0, 'medications_count': medicationsCount,
  };

  factory TreatmentCourse.fromJson(Map<String, dynamic> j) => TreatmentCourse(
    id: j['id'],
    title: j['title'],
    doctorName: j['doctor_name'],
    institution: j['institution'],
    prescribedAt: j['prescribed_at'],
    startedAt: j['started_at'],
    endedAt: j['ended_at'],
    prescription: j['prescription'],
    notes: j['notes'],
    isActive: j['is_active'] == 1 || j['is_active'] == true,
    medicationsCount: j['medications_count'] ?? 0,
  );
}

class Medication {
  final int id;
  final int courseId;
  final String name;
  final String? dosage;
  final String? frequency;
  final String? times;
  final String? duration;
  final String? conditions;
  final String? notes;

  Medication({
    required this.id,
    required this.courseId,
    required this.name,
    this.dosage,
    this.frequency,
    this.times,
    this.duration,
    this.conditions,
    this.notes,
  });

  factory Medication.fromJson(Map<String, dynamic> j) => Medication(
    id: j['id'],
    courseId: j['course_id'],
    name: j['name'],
    dosage: j['dosage'],
    frequency: j['frequency'],
    times: j['times'],
    duration: j['duration'],
    conditions: j['conditions'],
    notes: j['notes'],
  );
}
