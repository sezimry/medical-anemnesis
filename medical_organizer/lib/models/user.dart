class User {
  final int id;
  final String email;
  final String fullName;
  final String? birthDate;
  final String? gender;
  final String role;

  User({
    required this.id,
    required this.email,
    required this.fullName,
    this.birthDate,
    this.gender,
    this.role = 'patient',
  });

  bool get isDoctor => role == 'doctor';

  factory User.fromJson(Map<String, dynamic> j) => User(
        id: j['id'],
        email: j['email'],
        fullName: j['full_name'],
        birthDate: j['birth_date'],
        gender: j['gender'],
        role: j['role'] ?? 'patient',
      );
}
