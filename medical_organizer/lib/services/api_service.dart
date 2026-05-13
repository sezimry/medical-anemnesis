import 'dart:convert';
import 'package:http/http.dart' as http;
import '../config/api.dart';
import '../models/user.dart';
import '../models/relative.dart';
import '../models/diagnosis.dart';
import '../models/allergy.dart';
import '../models/treatment_course.dart';
import '../models/reminder.dart';
import '../models/document.dart';
import 'package:http_parser/http_parser.dart';
import 'storage_service.dart';

class ApiException implements Exception {
  final String message;
  ApiException(this.message);
  @override
  String toString() => message;
}

class ApiService {
  static Future<Map<String, String>> _headers() async {
    final token = await StorageService.getToken();
    return {
      'Content-Type': 'application/json',
      if (token != null) 'Authorization': 'Bearer $token',
    };
  }

  static dynamic _handleResponse(http.Response res) {
    final body = jsonDecode(res.body);
    if (res.statusCode >= 200 && res.statusCode < 300) return body;
    final msg = body is Map ? body['error'] ?? 'Ошибка сервера' : 'Ошибка сервера';
    throw ApiException(msg);
  }

  // ── AUTH ──────────────────────────────────────────────────────────────────
  static Future<Map<String, dynamic>> login(String email, String password) async {
    final res = await http.post(
      Uri.parse(ApiConfig.login),
      headers: {'Content-Type': 'application/json'},
      body: jsonEncode({'email': email, 'password': password}),
    );
    return _handleResponse(res);
  }

  static Future<Map<String, dynamic>> register(String email, String password, String fullName, {String? birthDate, String? gender}) async {
    final res = await http.post(
      Uri.parse(ApiConfig.register),
      headers: {'Content-Type': 'application/json'},
      body: jsonEncode({
        'email': email,
        'password': password,
        'full_name': fullName,
        if (birthDate != null) 'birth_date': birthDate,
        if (gender != null) 'gender': gender,
      }),
    );
    return _handleResponse(res);
  }

  // ── USER ──────────────────────────────────────────────────────────────────
  static Future<User> getProfile() async {
    final res = await http.get(
      Uri.parse(ApiConfig.profile),
      headers: await _headers(),
    );
    final data = _handleResponse(res);
    return User.fromJson(data['user'] ?? data);
  }

  // ── RELATIVES ─────────────────────────────────────────────────────────────
  static Future<List<Relative>> getRelatives() async {
    final res = await http.get(
      Uri.parse(ApiConfig.relatives),
      headers: await _headers(),
    );
    final data = _handleResponse(res);
    final list = data is List ? data : data['relatives'] as List;
    return list.map((r) => Relative.fromJson(r)).toList();
  }

  static Future<Relative> createRelative(Map<String, dynamic> body) async {
    final res = await http.post(
      Uri.parse(ApiConfig.relatives),
      headers: await _headers(),
      body: jsonEncode(body),
    );
    final data = _handleResponse(res);
    return Relative.fromJson(data is Map && data['relative'] != null ? data['relative'] : data);
  }

  static Future<void> updateRelative(int id, Map<String, dynamic> body) async {
    final res = await http.put(
      Uri.parse('${ApiConfig.relatives}/$id'),
      headers: await _headers(),
      body: jsonEncode(body),
    );
    _handleResponse(res);
  }

  static Future<void> deleteRelative(int id) async {
    final res = await http.delete(
      Uri.parse('${ApiConfig.relatives}/$id'),
      headers: await _headers(),
    );
    _handleResponse(res);
  }

  // ── DIAGNOSES ─────────────────────────────────────────────────────────────
  static Future<List<Diagnosis>> getDiagnoses() async {
    final res = await http.get(
      Uri.parse(ApiConfig.diagnoses),
      headers: await _headers(),
    );
    final data = _handleResponse(res);
    final list = data is List ? data : data['diagnoses'] as List;
    return list.map((d) => Diagnosis.fromJson(d)).toList();
  }

  static Future<Diagnosis> createDiagnosis(Map<String, dynamic> body) async {
    final res = await http.post(
      Uri.parse(ApiConfig.diagnoses),
      headers: await _headers(),
      body: jsonEncode(body),
    );
    final data = _handleResponse(res);
    return Diagnosis.fromJson(data is Map && data['diagnosis'] != null ? data['diagnosis'] : data);
  }

  static Future<void> updateDiagnosis(int id, Map<String, dynamic> body) async {
    final res = await http.put(
      Uri.parse('${ApiConfig.diagnoses}/$id'),
      headers: await _headers(),
      body: jsonEncode(body),
    );
    _handleResponse(res);
  }

  static Future<void> deleteDiagnosis(int id) async {
    final res = await http.delete(
      Uri.parse('${ApiConfig.diagnoses}/$id'),
      headers: await _headers(),
    );
    _handleResponse(res);
  }

  // ── ALLERGIES ─────────────────────────────────────────────────────────────
  static Future<List<Allergy>> getAllergies() async {
    final res = await http.get(
      Uri.parse(ApiConfig.allergies),
      headers: await _headers(),
    );
    final data = _handleResponse(res);
    final list = data is List ? data : data['allergies'] as List;
    return list.map((a) => Allergy.fromJson(a)).toList();
  }

  static Future<Allergy> createAllergy(Map<String, dynamic> body) async {
    final res = await http.post(
      Uri.parse(ApiConfig.allergies),
      headers: await _headers(),
      body: jsonEncode(body),
    );
    final data = _handleResponse(res);
    return Allergy.fromJson(data is Map && data['allergy'] != null ? data['allergy'] : data);
  }

  static Future<void> updateAllergy(int id, Map<String, dynamic> body) async {
    final res = await http.put(
      Uri.parse('${ApiConfig.allergies}/$id'),
      headers: await _headers(),
      body: jsonEncode(body),
    );
    _handleResponse(res);
  }

  static Future<void> deleteAllergy(int id) async {
    final res = await http.delete(
      Uri.parse('${ApiConfig.allergies}/$id'),
      headers: await _headers(),
    );
    _handleResponse(res);
  }

  // ── DOCUMENTS ─────────────────────────────────────────────────────────────
  static Future<List<MedDocument>> getDocuments({String? type}) async {
    final url = type != null
        ? Uri.parse('${ApiConfig.documents}?type=$type')
        : Uri.parse(ApiConfig.documents);
    final res = await http.get(url, headers: await _headers());
    return (_handleResponse(res) as List).map((d) => MedDocument.fromJson(d)).toList();
  }

  static Future<MedDocument> createDocument({
    required String title,
    required String type,
    String? doctorName,
    String? institution,
    String? docDate,
    String? description,
    String? filePath,
    String? fileName,
    String? fileMime,
  }) async {
    final token = await StorageService.getToken();
    final request = http.MultipartRequest('POST', Uri.parse(ApiConfig.documents));
    request.headers['Authorization'] = 'Bearer $token';
    request.fields['title'] = title;
    request.fields['type']  = type;
    if (doctorName  != null) request.fields['doctor_name']  = doctorName;
    if (institution != null) request.fields['institution']  = institution;
    if (docDate     != null) request.fields['doc_date']     = docDate;
    if (description != null) request.fields['description']  = description;

    if (filePath != null && fileName != null && fileMime != null) {
      request.files.add(await http.MultipartFile.fromPath(
        'file', filePath,
        contentType: MediaType.parse(fileMime),
        filename: fileName,
      ));
    }

    final streamed = await request.send();
    final res = await http.Response.fromStream(streamed);
    return MedDocument.fromJson(_handleResponse(res));
  }

  static Future<void> deleteDocument(int id) async {
    final res = await http.delete(Uri.parse(ApiConfig.document(id)), headers: await _headers());
    _handleResponse(res);
  }

  // ── REMINDERS ─────────────────────────────────────────────────────────────
  static Future<List<Reminder>> getReminders() async {
    final res = await http.get(Uri.parse(ApiConfig.reminders), headers: await _headers());
    return (_handleResponse(res) as List).map((r) => Reminder.fromJson(r)).toList();
  }

  static Future<Reminder> createReminder(Map<String, dynamic> body) async {
    final res = await http.post(Uri.parse(ApiConfig.reminders), headers: await _headers(), body: jsonEncode(body));
    return Reminder.fromJson(_handleResponse(res));
  }

  static Future<Reminder> updateReminder(int id, Map<String, dynamic> body) async {
    final res = await http.put(Uri.parse(ApiConfig.reminder(id)), headers: await _headers(), body: jsonEncode(body));
    return Reminder.fromJson(_handleResponse(res));
  }

  static Future<Reminder> toggleReminder(int id) async {
    final res = await http.patch(Uri.parse(ApiConfig.reminderToggle(id)), headers: await _headers());
    return Reminder.fromJson(_handleResponse(res));
  }

  static Future<void> deleteReminder(int id) async {
    final res = await http.delete(Uri.parse(ApiConfig.reminder(id)), headers: await _headers());
    _handleResponse(res);
  }

  // ── COURSES ───────────────────────────────────────────────────────────────
  static Future<List<TreatmentCourse>> getCourses() async {
    final res = await http.get(Uri.parse(ApiConfig.courses), headers: await _headers());
    final data = _handleResponse(res);
    return (data as List).map((c) => TreatmentCourse.fromJson(c)).toList();
  }

  static Future<Map<String, dynamic>> getCourse(int id) async {
    final res = await http.get(Uri.parse(ApiConfig.course(id)), headers: await _headers());
    return Map<String, dynamic>.from(_handleResponse(res));
  }

  static Future<TreatmentCourse> createCourse(Map<String, dynamic> body) async {
    final res = await http.post(Uri.parse(ApiConfig.courses), headers: await _headers(), body: jsonEncode(body));
    return TreatmentCourse.fromJson(_handleResponse(res));
  }

  static Future<void> updateCourse(int id, Map<String, dynamic> body) async {
    final res = await http.put(Uri.parse(ApiConfig.course(id)), headers: await _headers(), body: jsonEncode(body));
    _handleResponse(res);
  }

  static Future<void> deleteCourse(int id) async {
    final res = await http.delete(Uri.parse(ApiConfig.course(id)), headers: await _headers());
    _handleResponse(res);
  }

  static Future<List<Medication>> getMedications(int courseId) async {
    final res = await http.get(Uri.parse(ApiConfig.medications(courseId)), headers: await _headers());
    return (_handleResponse(res) as List).map((m) => Medication.fromJson(m)).toList();
  }

  static Future<Medication> createMedication(int courseId, Map<String, dynamic> body) async {
    final res = await http.post(Uri.parse(ApiConfig.medications(courseId)), headers: await _headers(), body: jsonEncode(body));
    return Medication.fromJson(_handleResponse(res));
  }

  static Future<void> updateMedication(int courseId, int medId, Map<String, dynamic> body) async {
    final res = await http.put(Uri.parse(ApiConfig.medication(courseId, medId)), headers: await _headers(), body: jsonEncode(body));
    _handleResponse(res);
  }

  static Future<void> deleteMedication(int courseId, int medId) async {
    final res = await http.delete(Uri.parse(ApiConfig.medication(courseId, medId)), headers: await _headers());
    _handleResponse(res);
  }

  // ── DOCTOR ────────────────────────────────────────────────────────────────
  static Future<List<Map<String, dynamic>>> getPatients() async {
    final res = await http.get(
      Uri.parse(ApiConfig.patients),
      headers: await _headers(),
    );
    final data = _handleResponse(res);
    return (data as List).map((p) => Map<String, dynamic>.from(p)).toList();
  }

  static Future<Map<String, dynamic>> getPatient(int id) async {
    final res = await http.get(
      Uri.parse(ApiConfig.patient(id)),
      headers: await _headers(),
    );
    return Map<String, dynamic>.from(_handleResponse(res));
  }

  static Future<void> addPatientDiagnosis(int patientId, Map<String, dynamic> body) async {
    final res = await http.post(
      Uri.parse(ApiConfig.patientDiagnoses(patientId)),
      headers: await _headers(),
      body: jsonEncode(body),
    );
    _handleResponse(res);
  }

  static Future<void> addPatientAllergy(int patientId, Map<String, dynamic> body) async {
    final res = await http.post(
      Uri.parse(ApiConfig.patientAllergies(patientId)),
      headers: await _headers(),
      body: jsonEncode(body),
    );
    _handleResponse(res);
  }

  static Future<void> deletePatientDiagnosis(int patientId, int diagId) async {
    final res = await http.delete(
      Uri.parse(ApiConfig.patientDiagnosis(patientId, diagId)),
      headers: await _headers(),
    );
    _handleResponse(res);
  }

  static Future<void> deletePatientAllergy(int patientId, int allergId) async {
    final res = await http.delete(
      Uri.parse(ApiConfig.patientAllergy(patientId, allergId)),
      headers: await _headers(),
    );
    _handleResponse(res);
  }
}
