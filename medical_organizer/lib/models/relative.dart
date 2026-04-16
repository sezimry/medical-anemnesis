class Relative {
  final int id;
  final String fullName;
  final String? birthDate;
  final String? gender;
  final String relationType;
  final int? parentRelativeId;
  final String? notes;

  Relative({
    required this.id,
    required this.fullName,
    this.birthDate,
    this.gender,
    required this.relationType,
    this.parentRelativeId,
    this.notes,
  });

  factory Relative.fromJson(Map<String, dynamic> j) => Relative(
        id: j['id'],
        fullName: j['full_name'],
        birthDate: j['birth_date'],
        gender: j['gender'],
        relationType: j['relation_type'],
        parentRelativeId: j['parent_relative_id'],
        notes: j['notes'],
      );

  Map<String, dynamic> toJson() => {
        'full_name': fullName,
        'birth_date': birthDate,
        'gender': gender,
        'relation_type': relationType,
        'parent_relative_id': parentRelativeId,
        'notes': notes,
      };

  static String relationLabel(String type) {
    const map = {
      'father': 'Отец',
      'mother': 'Мать',
      'brother': 'Брат',
      'sister': 'Сестра',
      'son': 'Сын',
      'daughter': 'Дочь',
      'grandfather': 'Дедушка',
      'grandmother': 'Бабушка',
      'uncle': 'Дядя',
      'aunt': 'Тётя',
      'other': 'Другое',
    };
    return map[type] ?? type;
  }
}
