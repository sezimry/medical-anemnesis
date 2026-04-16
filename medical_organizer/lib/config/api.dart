class ApiConfig {
  static const String baseUrl = 'http://localhost:5000/api';

  static const String login      = '$baseUrl/auth/login';
  static const String register   = '$baseUrl/auth/register';
  static const String profile    = '$baseUrl/user/me';
  static const String relatives  = '$baseUrl/relatives';
  static const String diagnoses  = '$baseUrl/diagnoses';
  static const String allergies  = '$baseUrl/allergies';
  static const String exportJson = '$baseUrl/export/json';
  static const String exportPdf  = '$baseUrl/export/pdf';
}
