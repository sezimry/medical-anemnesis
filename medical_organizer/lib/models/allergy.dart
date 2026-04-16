class Allergy {
  final int id;
  final int? relativeId;
  final String? relativeName;
  final String? relationType;
  final String allergen;
  final String? reaction;
  final String? severity;

  Allergy({
    required this.id,
    this.relativeId,
    this.relativeName,
    this.relationType,
    required this.allergen,
    this.reaction,
    this.severity,
  });

  factory Allergy.fromJson(Map<String, dynamic> j) => Allergy(
        id: j['id'],
        relativeId: j['relative_id'],
        relativeName: j['relative_name'],
        relationType: j['relation_type'],
        allergen: j['allergen'],
        reaction: j['reaction'],
        severity: j['severity'],
      );

  Map<String, dynamic> toJson() => {
        'relative_id': relativeId,
        'allergen': allergen,
        'reaction': reaction,
        'severity': severity,
      };

  static String severityLabel(String? s) {
    const map = {'mild': 'Лёгкая', 'moderate': 'Средняя', 'severe': 'Тяжёлая'};
    return map[s] ?? '—';
  }
}
