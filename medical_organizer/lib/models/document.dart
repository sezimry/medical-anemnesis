class MedDocument {
  final int id;
  final String title;
  final String type;
  final String? doctorName;
  final String? institution;
  final String? docDate;
  final String? description;
  final String? fileName;
  final String? filePath;
  final String? fileMime;
  final int? fileSize;

  MedDocument({
    required this.id,
    required this.title,
    required this.type,
    this.doctorName,
    this.institution,
    this.docDate,
    this.description,
    this.fileName,
    this.filePath,
    this.fileMime,
    this.fileSize,
  });

  bool get hasFile => filePath != null;
  bool get isImage => fileMime?.startsWith('image') ?? false;
  bool get isPdf   => fileMime == 'application/pdf';

  String get typeLabel {
    const map = {
      'discharge':    'Выписка из больницы',
      'surgery':      'После операции',
      'imaging':      'Обследование',
      'prescription': 'Назначение',
      'other':        'Другое',
    };
    return map[type] ?? type;
  }

  String get sizeLabel {
    if (fileSize == null) return '';
    if (fileSize! < 1024) return '$fileSize Б';
    if (fileSize! < 1024*1024) return '${(fileSize!/1024).toStringAsFixed(1)} КБ';
    return '${(fileSize!/1024/1024).toStringAsFixed(1)} МБ';
  }

  Map<String, dynamic> toJson() => {
    'id': id, 'title': title, 'type': type,
    'doctor_name': doctorName, 'institution': institution,
    'doc_date': docDate, 'description': description,
    'file_name': fileName, 'file_path': filePath,
    'file_mime': fileMime, 'file_size': fileSize,
  };

  factory MedDocument.fromJson(Map<String, dynamic> j) => MedDocument(
    id:          j['id'],
    title:       j['title'],
    type:        j['type'] ?? 'other',
    doctorName:  j['doctor_name'],
    institution: j['institution'],
    docDate:     j['doc_date'],
    description: j['description'],
    fileName:    j['file_name'],
    filePath:    j['file_path'],
    fileMime:    j['file_mime'],
    fileSize:    j['file_size'],
  );
}
