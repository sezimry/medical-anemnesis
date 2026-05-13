import 'package:flutter/material.dart';
import 'package:shared_preferences/shared_preferences.dart';
import '../l10n/translations.dart';

class LocaleProvider extends ChangeNotifier {
  String _locale = 'ru';
  static const _key = 'app_locale';

  String get locale => _locale;
  bool get isKg => _locale == 'kg';

  Future<void> init() async {
    final prefs = await SharedPreferences.getInstance();
    _locale = prefs.getString(_key) ?? 'ru';
    notifyListeners();
  }

  Future<void> setLocale(String locale) async {
    if (_locale == locale) return;
    _locale = locale;
    final prefs = await SharedPreferences.getInstance();
    await prefs.setString(_key, locale);
    notifyListeners();
  }

  String t(String key) {
    return translations[_locale]?[key]
        ?? translations['ru']?[key]
        ?? key;
  }
}
