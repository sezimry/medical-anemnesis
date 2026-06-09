class ApiConfig {
  static const String baseUrl = 'https://medical-anemnesis-production.up.railway.app/api';

  static const String login      = '$baseUrl/auth/login';
  static const String register   = '$baseUrl/auth/register';
  static const String profile    = '$baseUrl/user/me';
  static const String relatives  = '$baseUrl/relatives';
  static const String diagnoses  = '$baseUrl/diagnoses';
  static const String allergies  = '$baseUrl/allergies';
  static const String exportJson = '$baseUrl/export/json';
  static const String exportPdf  = '$baseUrl/export/pdf';

  static const String documents            = '$baseUrl/documents';
  static String document(int id)           => '$baseUrl/documents/$id';
  static String documentFile(int id)       => '$baseUrl/documents/$id/file';

  static const String reminders            = '$baseUrl/reminders';
  static String reminder(int id)           => '$baseUrl/reminders/$id';
  static String reminderToggle(int id)     => '$baseUrl/reminders/$id/toggle';

  static const String courses              = '$baseUrl/courses';
  static String course(int id)             => '$baseUrl/courses/$id';
  static String medications(int id)        => '$baseUrl/courses/$id/medications';
  static String medication(int cid, int mid) => '$baseUrl/courses/$cid/medications/$mid';

  static const String patients             = '$baseUrl/doctor/patients';
  static String patient(int id)            => '$baseUrl/doctor/patients/$id';
  static String patientDiagnoses(int id)   => '$baseUrl/doctor/patients/$id/diagnoses';
  static String patientAllergies(int id)   => '$baseUrl/doctor/patients/$id/allergies';
  static String patientDiagnosis(int pid, int did) => '$baseUrl/doctor/patients/$pid/diagnoses/$did';
  static String patientAllergy(int pid, int aid)   => '$baseUrl/doctor/patients/$pid/allergies/$aid';
}
