import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../providers/locale_provider.dart';

class LangSwitch extends StatelessWidget {
  final bool dark; // true — на тёмном фоне (AppBar), false — на светлом
  const LangSwitch({super.key, this.dark = true});

  @override
  Widget build(BuildContext context) {
    final locale = context.watch<LocaleProvider>();
    final selBg    = dark ? Colors.white      : Colors.teal;
    final selText  = dark ? Colors.teal       : Colors.white;
    final unselBorder = dark ? Colors.white54 : Colors.teal.shade200;
    final unselText   = dark ? Colors.white70 : Colors.teal;

    return Row(
      mainAxisSize: MainAxisSize.min,
      children: ['ru', 'kg'].map((lang) {
        final selected = locale.locale == lang;
        return GestureDetector(
          onTap: () => locale.setLocale(lang),
          child: Container(
            margin: const EdgeInsets.symmetric(horizontal: 2),
            padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
            decoration: BoxDecoration(
              color: selected ? selBg : Colors.transparent,
              borderRadius: BorderRadius.circular(12),
              border: Border.all(color: selected ? selBg : unselBorder),
            ),
            child: Text(
              lang.toUpperCase(),
              style: TextStyle(
                color: selected ? selText : unselText,
                fontWeight: FontWeight.bold,
                fontSize: 12,
              ),
            ),
          ),
        );
      }).toList(),
    );
  }
}
