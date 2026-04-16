class Diagnosis {
  final int id;
  final int? relativeId;
  final String? relativeName;
  final String? relationType;
  final String? icdCode;
  final String title;
  final String? description;
  final String? diagnosedAt;
  final bool isChronic;

  Diagnosis({
    required this.id,
    this.relativeId,
    this.relativeName,
    this.relationType,
    this.icdCode,
    required this.title,
    this.description,
    this.diagnosedAt,
    required this.isChronic,
  });

  factory Diagnosis.fromJson(Map<String, dynamic> j) => Diagnosis(
        id: j['id'],
        relativeId: j['relative_id'],
        relativeName: j['relative_name'],
        relationType: j['relation_type'],
        icdCode: j['icd_code'],
        title: j['title'],
        description: j['description'],
        diagnosedAt: j['diagnosed_at'],
        isChronic: j['is_chronic'] == 1 || j['is_chronic'] == true,
      );

  Map<String, dynamic> toJson() => {
        'relative_id': relativeId,
        'icd_code': icdCode,
        'title': title,
        'description': description,
        'diagnosed_at': diagnosedAt,
        'is_chronic': isChronic ? 1 : 0,
      };
}
