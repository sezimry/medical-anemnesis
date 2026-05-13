import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../services/pin_service.dart';
import '../services/bio_service.dart';
import '../providers/locale_provider.dart';
import 'pin_screen.dart';

class SecurityScreen extends StatefulWidget {
  const SecurityScreen({super.key});

  @override
  State<SecurityScreen> createState() => _SecurityScreenState();
}

class _SecurityScreenState extends State<SecurityScreen> {
  bool _pinEnabled = false;
  bool _bioEnabled = false;
  bool _bioAvailable = false;

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    final pin = await PinService.isPinEnabled();
    final bio = await PinService.isBioEnabled();
    final bioAvail = await BioService.isAvailable();
    setState(() {
      _pinEnabled   = pin;
      _bioEnabled   = bio;
      _bioAvailable = bioAvail;
    });
  }

  Future<void> _togglePin(bool value) async {
    if (value) {
      // Устанавливаем новый PIN
      final result = await Navigator.push<bool>(
        context,
        MaterialPageRoute(builder: (_) => const PinScreen(mode: PinMode.setup)),
      );
      if (result == true) {
        // Подтверждение PIN
        if (!mounted) return;
        await Navigator.push<bool>(
          context,
          MaterialPageRoute(builder: (_) => PinScreen(mode: PinMode.confirm)),
        );
      }
    } else {
      // Отключаем PIN — сначала проверяем текущий
      final ok = await Navigator.push<bool>(
        context,
        MaterialPageRoute(builder: (_) => const PinScreen(mode: PinMode.enter)),
      );
      if (ok == true) await PinService.disablePin();
    }
    _load();
  }

  Future<void> _toggleBio(bool value) async {
    if (!_pinEnabled) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Сначала включите PIN-код')),
      );
      return;
    }
    await PinService.setBioEnabled(value);
    _load();
  }

  Future<void> _changePin() async {
    // Сначала проверяем старый PIN
    final ok = await Navigator.push<bool>(
      context,
      MaterialPageRoute(builder: (_) => const PinScreen(mode: PinMode.enter)),
    );
    if (ok == true && mounted) {
      await Navigator.push<bool>(
        context,
        MaterialPageRoute(builder: (_) => const PinScreen(mode: PinMode.setup)),
      );
      if (mounted) {
        await Navigator.push<bool>(
          context,
          MaterialPageRoute(builder: (_) => const PinScreen(mode: PinMode.confirm)),
        );
      }
    }
    _load();
  }

  @override
  Widget build(BuildContext context) {
    final t = context.watch<LocaleProvider>().t;
    return Scaffold(
      appBar: AppBar(
        title: Text(t('security_title')),
        backgroundColor: Colors.teal,
        foregroundColor: Colors.white,
      ),
      body: ListView(
        children: [
          const SizedBox(height: 8),

          // PIN-код
          _SectionHeader('PIN'),
          SwitchListTile(
            title: Text(t('pin_protection')),
            subtitle: Text(t('pin_subtitle')),
            value: _pinEnabled,
            activeColor: Colors.teal,
            onChanged: _togglePin,
            secondary: CircleAvatar(
              backgroundColor: _pinEnabled ? Colors.teal.shade50 : Colors.grey.shade100,
              child: Icon(Icons.pin, color: _pinEnabled ? Colors.teal : Colors.grey),
            ),
          ),
          if (_pinEnabled)
            ListTile(
              leading: CircleAvatar(
                backgroundColor: Colors.blue.shade50,
                child: const Icon(Icons.edit, color: Colors.blue),
              ),
              title: Text(t('change_pin')),
              trailing: const Icon(Icons.chevron_right),
              onTap: _changePin,
            ),

          const Divider(),

          // Биометрия
          _SectionHeader(t('bio_title')),
          if (!_bioAvailable)
            Padding(
              padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
              child: Text(t('bio_unavailable'),
                  style: const TextStyle(color: Colors.grey, fontSize: 13)),
            )
          else
            SwitchListTile(
              title: Text(t('bio_title')),
              subtitle: Text(t('bio_subtitle')),
              value: _bioEnabled,
              activeColor: Colors.teal,
              onChanged: _pinEnabled ? _toggleBio : null,
              secondary: CircleAvatar(
                backgroundColor: _bioEnabled ? Colors.teal.shade50 : Colors.grey.shade100,
                child: Icon(Icons.fingerprint, color: _bioEnabled ? Colors.teal : Colors.grey),
              ),
            ),

          const Divider(),

          // Информация
          _SectionHeader('Информация'),
          const ListTile(
            leading: CircleAvatar(
              backgroundColor: Color(0xFFE8F5E9),
              child: Icon(Icons.security, color: Colors.green),
            ),
            title: Text('Локальное хранение'),
            subtitle: Text('PIN-код хранится только на устройстве в зашифрованном виде'),
          ),
          const ListTile(
            leading: CircleAvatar(
              backgroundColor: Color(0xFFE3F2FD),
              child: Icon(Icons.lock, color: Colors.blue),
            ),
            title: Text('SHA-256 шифрование'),
            subtitle: Text('PIN не передаётся на сервер и не может быть восстановлен'),
          ),
        ],
      ),
    );
  }
}

class _SectionHeader extends StatelessWidget {
  final String title;
  const _SectionHeader(this.title);

  @override
  Widget build(BuildContext context) => Padding(
    padding: const EdgeInsets.fromLTRB(16, 12, 16, 4),
    child: Text(title,
      style: TextStyle(fontSize: 12, fontWeight: FontWeight.bold,
          color: Colors.teal.shade700, letterSpacing: 0.5),
    ),
  );
}
