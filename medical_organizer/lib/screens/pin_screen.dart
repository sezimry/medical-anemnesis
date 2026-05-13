import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../services/pin_service.dart';
import '../services/bio_service.dart';
import '../providers/locale_provider.dart';

enum PinMode { enter, setup, confirm }

class PinScreen extends StatefulWidget {
  final PinMode mode;
  final VoidCallback? onSuccess;

  const PinScreen({super.key, this.mode = PinMode.enter, this.onSuccess});

  @override
  State<PinScreen> createState() => _PinScreenState();
}

class _PinScreenState extends State<PinScreen> {
  String _pin     = '';
  String _pinFirst = ''; // для confirm режима
  String _error   = '';
  bool _bioAvailable = false;

  @override
  void initState() {
    super.initState();
    _checkBio();
    if (widget.mode == PinMode.enter) {
      _tryBio();
    }
  }

  Future<void> _checkBio() async {
    final available = await BioService.isAvailable();
    final enabled   = await PinService.isBioEnabled();
    setState(() => _bioAvailable = available && enabled);
  }

  Future<void> _tryBio() async {
    final enabled = await PinService.isBioEnabled();
    if (!enabled) return;
    final ok = await BioService.authenticate();
    if (ok && mounted) _success();
  }

  void _onKey(String key) {
    if (_pin.length >= 4) return;
    setState(() {
      _pin += key;
      _error = '';
    });
    if (_pin.length == 4) _onComplete();
  }

  void _onDelete() {
    if (_pin.isEmpty) return;
    setState(() => _pin = _pin.substring(0, _pin.length - 1));
  }

  Future<void> _onComplete() async {
    // ignore: use_build_context_synchronously
    final t = context.read<LocaleProvider>().t;
    switch (widget.mode) {
      case PinMode.enter:
        final ok = await PinService.verifyPin(_pin);
        if (ok) {
          _success();
        } else {
          setState(() { _pin = ''; _error = t('wrong_pin'); });
        }

      case PinMode.setup:
        setState(() { _pinFirst = _pin; _pin = ''; });

      case PinMode.confirm:
        if (_pin == _pinFirst) {
          await PinService.setPin(_pin);
          _success();
        } else {
          setState(() { _pin = ''; _pinFirst = ''; _error = t('pin_mismatch'); });
        }
    }
  }

  void _success() {
    if (widget.onSuccess != null) {
      widget.onSuccess!();
    } else if (mounted) {
      Navigator.of(context).pop(true);
    }
  }

  String _title(String Function(String) t) {
    if (widget.mode == PinMode.setup)   return t('create_pin');
    if (widget.mode == PinMode.confirm && _pinFirst.isNotEmpty) return t('repeat_pin');
    if (widget.mode == PinMode.confirm) return t('create_pin');
    return t('enter_pin');
  }

  @override
  Widget build(BuildContext context) {
    final t = context.watch<LocaleProvider>().t;
    return Scaffold(
      backgroundColor: Colors.teal,
      body: SafeArea(
        child: Column(children: [
          const SizedBox(height: 60),

          // Иконка
          const Icon(Icons.lock_outline, size: 56, color: Colors.white),
          const SizedBox(height: 16),

          // Заголовок
          Text(_title(t), style: const TextStyle(color: Colors.white, fontSize: 20, fontWeight: FontWeight.bold)),
          const SizedBox(height: 8),

          // Ошибка
          AnimatedOpacity(
            opacity: _error.isEmpty ? 0 : 1,
            duration: const Duration(milliseconds: 200),
            child: Text(_error, style: const TextStyle(color: Colors.red, fontSize: 14, fontWeight: FontWeight.w500)),
          ),
          const SizedBox(height: 32),

          // Точки PIN
          Row(mainAxisAlignment: MainAxisAlignment.center, children: List.generate(4, (i) => Container(
            margin: const EdgeInsets.symmetric(horizontal: 10),
            width: 18, height: 18,
            decoration: BoxDecoration(
              shape: BoxShape.circle,
              color: i < _pin.length ? Colors.white : Colors.white.withValues(alpha: 0.3),
              border: Border.all(color: Colors.white, width: 2),
            ),
          ))),
          const SizedBox(height: 48),

          // Клавиатура
          Expanded(
            child: Container(
              decoration: const BoxDecoration(
                color: Colors.white,
                borderRadius: BorderRadius.vertical(top: Radius.circular(32)),
              ),
              child: Padding(
                padding: const EdgeInsets.symmetric(horizontal: 32, vertical: 24),
                child: Column(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    for (final row in [['1','2','3'],['4','5','6'],['7','8','9']])
                      Padding(
                        padding: const EdgeInsets.only(bottom: 12),
                        child: Row(
                          mainAxisAlignment: MainAxisAlignment.spaceEvenly,
                          children: row.map((k) => _PinKey(label: k, onTap: () => _onKey(k))).toList(),
                        ),
                      ),
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceEvenly,
                      children: [
                        // Биометрия или пустая кнопка
                        _bioAvailable && widget.mode == PinMode.enter
                            ? _PinKey(
                                icon: Icons.fingerprint,
                                color: Colors.teal,
                                onTap: _tryBio,
                              )
                            : const SizedBox(width: 72, height: 72),
                        _PinKey(label: '0', onTap: () => _onKey('0')),
                        _PinKey(icon: Icons.backspace_outlined, onTap: _onDelete),
                      ],
                    ),
                  ],
                ),
              ),
            ),
          ),
        ]),
      ),
    );
  }
}

class _PinKey extends StatelessWidget {
  final String? label;
  final IconData? icon;
  final Color? color;
  final VoidCallback onTap;

  const _PinKey({this.label, this.icon, this.color, required this.onTap});

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        width: 72, height: 72,
        decoration: BoxDecoration(
          shape: BoxShape.circle,
          color: Colors.grey.shade100,
        ),
        child: Center(
          child: label != null
              ? Text(label!, style: const TextStyle(fontSize: 26, fontWeight: FontWeight.w600))
              : Icon(icon, size: 26, color: color ?? Colors.grey.shade700),
        ),
      ),
    );
  }
}
