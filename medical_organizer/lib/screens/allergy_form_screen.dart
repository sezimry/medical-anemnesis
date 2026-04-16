import 'package:flutter/material.dart';
import '../services/api_service.dart';
import '../models/relative.dart';

class AllergyFormScreen extends StatefulWidget {
  const AllergyFormScreen({super.key});

  @override
  State<AllergyFormScreen> createState() => _AllergyFormScreenState();
}

class _AllergyFormScreenState extends State<AllergyFormScreen> {
  final _formKey      = GlobalKey<FormState>();
  final _allergenCtrl = TextEditingController();
  final _reactionCtrl = TextEditingController();
  int? _relativeId;
  String? _severity;
  bool _loading = false;
  List<Relative> _relatives = [];

  @override
  void didChangeDependencies() {
    super.didChangeDependencies();
    final args = ModalRoute.of(context)?.settings.arguments;
    if (args is List<Relative>) _relatives = args;
  }

  Future<void> _submit() async {
    if (!_formKey.currentState!.validate()) return;
    setState(() => _loading = true);
    try {
      await ApiService.createAllergy({
        'allergen': _allergenCtrl.text.trim(),
        'reaction': _reactionCtrl.text.trim().isEmpty ? null : _reactionCtrl.text.trim(),
        'relative_id': _relativeId,
        'severity': _severity,
      });
      if (mounted) Navigator.pop(context);
    } catch (e) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text(e.toString()), backgroundColor: Colors.red),
      );
    } finally {
      if (mounted) setState(() => _loading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Добавить аллергию'),
        backgroundColor: Colors.teal,
        foregroundColor: Colors.white,
      ),
      body: Form(
        key: _formKey,
        child: ListView(
          padding: const EdgeInsets.all(16),
          children: [
            TextFormField(
              controller: _allergenCtrl,
              decoration: const InputDecoration(
                labelText: 'Аллерген *',
                border: OutlineInputBorder(),
              ),
              validator: (v) => (v == null || v.isEmpty) ? 'Введите аллерген' : null,
            ),
            const SizedBox(height: 16),
            TextFormField(
              controller: _reactionCtrl,
              decoration: const InputDecoration(
                labelText: 'Реакция',
                border: OutlineInputBorder(),
              ),
              maxLines: 2,
            ),
            const SizedBox(height: 16),
            DropdownButtonFormField<int?>(
              value: _relativeId,
              decoration: const InputDecoration(
                labelText: 'Кому',
                border: OutlineInputBorder(),
              ),
              items: [
                const DropdownMenuItem<int?>(value: null, child: Text('Я сам')),
                ..._relatives.map((r) => DropdownMenuItem<int?>(
                  value: r.id,
                  child: Text('${r.fullName} (${Relative.relationLabel(r.relationType)})'),
                )),
              ],
              onChanged: (v) => setState(() => _relativeId = v),
            ),
            const SizedBox(height: 16),
            DropdownButtonFormField<String?>(
              value: _severity,
              decoration: const InputDecoration(
                labelText: 'Тяжесть',
                border: OutlineInputBorder(),
              ),
              items: const [
                DropdownMenuItem(value: null,       child: Text('Не указана')),
                DropdownMenuItem(value: 'mild',     child: Text('Лёгкая')),
                DropdownMenuItem(value: 'moderate', child: Text('Средняя')),
                DropdownMenuItem(value: 'severe',   child: Text('Тяжёлая')),
              ],
              onChanged: (v) => setState(() => _severity = v),
            ),
            const SizedBox(height: 24),
            ElevatedButton(
              onPressed: _loading ? null : _submit,
              style: ElevatedButton.styleFrom(
                backgroundColor: Colors.teal,
                foregroundColor: Colors.white,
                padding: const EdgeInsets.symmetric(vertical: 14),
              ),
              child: _loading
                  ? const CircularProgressIndicator(color: Colors.white)
                  : const Text('Сохранить', style: TextStyle(fontSize: 16)),
            ),
          ],
        ),
      ),
    );
  }
}
