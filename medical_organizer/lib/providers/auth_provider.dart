import 'package:flutter/material.dart';
import '../models/user.dart';
import '../services/api_service.dart';
import '../services/storage_service.dart';

class AuthProvider extends ChangeNotifier {
  User? _user;
  bool _loading = true;

  User? get user => _user;
  bool get loading => _loading;
  bool get isAuthenticated => _user != null;

  Future<void> init() async {
    final token = await StorageService.getToken();
    if (token != null) {
      try {
        _user = await ApiService.getProfile();
      } catch (_) {
        await StorageService.removeToken();
      }
    }
    _loading = false;
    notifyListeners();
  }

  Future<void> login(String email, String password) async {
    final token = await ApiService.login(email, password);
    await StorageService.saveToken(token);
    _user = await ApiService.getProfile();
    notifyListeners();
  }

  Future<void> register(String email, String password, String fullName) async {
    final token = await ApiService.register(email, password, fullName);
    await StorageService.saveToken(token);
    _user = await ApiService.getProfile();
    notifyListeners();
  }

  Future<void> logout() async {
    await StorageService.removeToken();
    _user = null;
    notifyListeners();
  }
}
