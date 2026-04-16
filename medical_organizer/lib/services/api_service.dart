import 'dart:convert';
import 'package:http/http.dart' as http;
import '../config/api.dart';
import '../models/user.dart';
import '../models/relative.dart';
import '../models/diagnosis.dart';
import '../models/allergy.dart';
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
  static Future<String> login(String email, String password) async {
    final res = await http.post(
      Uri.parse(ApiConfig.login),
      headers: {'Content-Type': 'application/json'},
      body: jsonEncode({'email': email, 'password': password}),
    );
    final data = _handleResponse(res);
    return data['token'];
  }

  static Future<String> register(String email, String password, String fullName) async {
    final res = await http.post(
      Uri.parse(ApiConfig.register),
      headers: {'Content-Type': 'application/json'},
      body: jsonEncode({'email': email, 'password': password, 'full_name': fullName}),
    );
    final data = _handleResponse(res);
    return data['token'];
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
}
