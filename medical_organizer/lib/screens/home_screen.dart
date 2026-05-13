import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../providers/auth_provider.dart';
import '../providers/locale_provider.dart';
import '../services/api_service.dart';
import '../models/relative.dart';
import '../models/diagnosis.dart';
import '../models/allergy.dart';
import '../services/cache_service.dart';
import '../widgets/lang_switch.dart';

class HomeScreen extends StatefulWidget {
  const HomeScreen({super.key});

  @override
  State<HomeScreen> createState() => _HomeScreenState();
}

class _HomeScreenState extends State<HomeScreen> {
  int _tab = 0;
  List<Relative> _relatives = [];
  List<Diagnosis> _diagnoses = [];
  List<Allergy> _allergies = [];
  bool _loading = true;

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    // Сначала показываем кэш
    final cachedRel  = await CacheService.loadList(CacheService.relatives);
    final cachedDiag = await CacheService.loadList(CacheService.diagnoses);
    final cachedAlrg = await CacheService.loadList(CacheService.allergies);

    if (cachedRel != null || cachedDiag != null || cachedAlrg != null) {
      setState(() {
        if (cachedRel  != null) _relatives = cachedRel.map(Relative.fromJson).toList();
        if (cachedDiag != null) _diagnoses = cachedDiag.map(Diagnosis.fromJson).toList();
        if (cachedAlrg != null) _allergies = cachedAlrg.map(Allergy.fromJson).toList();
        _loading = false;
      });
    } else {
      setState(() => _loading = true);
    }

    // Потом обновляем с сервера
    try {
      final results = await Future.wait([
        ApiService.getRelatives(),
        ApiService.getDiagnoses(),
        ApiService.getAllergies(),
      ]);
      final relatives = results[0] as List<Relative>;
      final diagnoses = results[1] as List<Diagnosis>;
      final allergies = results[2] as List<Allergy>;

      // Сохраняем в кэш
      await CacheService.save(CacheService.relatives, relatives.map((r) => r.toJson()).toList());
      await CacheService.save(CacheService.diagnoses, diagnoses.map((d) => d.toJson()).toList());
      await CacheService.save(CacheService.allergies, allergies.map((a) => a.toJson()).toList());

      if (mounted) {
        setState(() {
          _relatives = relatives;
          _diagnoses = diagnoses;
          _allergies = allergies;
        });
      }
    } catch (_) {
      // Нет интернета — остаёмся на кэше, показываем снэкбар
      if (mounted && cachedRel == null) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Нет подключения. Данные могут быть устаревшими.')),
        );
      }
    } finally {
      if (mounted) setState(() => _loading = false);
    }
  }

  Future<void> _confirmDelete(String title, VoidCallback onConfirm) async {
    final ok = await showDialog<bool>(
      context: context,
      builder: (_) => AlertDialog(
        title: const Text('Удалить?'),
        content: Text('Удалить "$title"?'),
        actions: [
          TextButton(onPressed: () => Navigator.pop(context, false), child: const Text('Отмена')),
          TextButton(
            onPressed: () => Navigator.pop(context, true),
            child: const Text('Удалить', style: TextStyle(color: Colors.red)),
          ),
        ],
      ),
    );
    if (ok == true) onConfirm();
  }

  @override
  Widget build(BuildContext context) {
    final user = context.watch<AuthProvider>().user;

    final screens = [
      _DashboardTab(user: user, relatives: _relatives, diagnoses: _diagnoses, allergies: _allergies, loading: _loading),
      _RelativesTab(relatives: _relatives, loading: _loading, onRefresh: _load,
        onEdit: (r) => Navigator.pushNamed(context, '/relative/new', arguments: r).then((_) => _load()),
        onDelete: (r) => _confirmDelete(r.fullName, () async { await ApiService.deleteRelative(r.id); _load(); }),
      ),
      _DiagnosesTab(diagnoses: _diagnoses, relatives: _relatives, loading: _loading, onRefresh: _load,
        onEdit: (d) => Navigator.pushNamed(context, '/diagnosis/new', arguments: {'relatives': _relatives, 'diagnosis': d}).then((_) => _load()),
        onDelete: (d) => _confirmDelete(d.title, () async { await ApiService.deleteDiagnosis(d.id); _load(); }),
      ),
      _AllergiesTab(allergies: _allergies, relatives: _relatives, loading: _loading, onRefresh: _load,
        onEdit: (a) => Navigator.pushNamed(context, '/allergy/new', arguments: {'relatives': _relatives, 'allergy': a}).then((_) => _load()),
        onDelete: (a) => _confirmDelete(a.allergen, () async { await ApiService.deleteAllergy(a.id); _load(); }),
      ),
    ];

    final t = context.watch<LocaleProvider>().t;

    return Scaffold(
      appBar: AppBar(
        title: Text(t('home_title')),
        backgroundColor: Colors.teal,
        foregroundColor: Colors.white,
        actions: [
          const LangSwitch(),
          IconButton(icon: const Icon(Icons.refresh), onPressed: _load),
          IconButton(
            icon: const Icon(Icons.logout),
            tooltip: t('logout'),
            onPressed: () async {
              final ok = await showDialog<bool>(
                context: context,
                builder: (_) => AlertDialog(
                  title: const Text('Выйти из аккаунта?'),
                  actions: [
                    TextButton(onPressed: () => Navigator.pop(context, false), child: const Text('Отмена')),
                    TextButton(onPressed: () => Navigator.pop(context, true),
                        child: const Text('Выйти', style: TextStyle(color: Colors.red))),
                  ],
                ),
              );
              if (ok == true && context.mounted) {
                await context.read<AuthProvider>().logout();
                if (context.mounted) {
                  Navigator.of(context).pushNamedAndRemoveUntil('/login', (_) => false);
                }
              }
            },
          ),
        ],
      ),
      body: Column(
        children: [
          Expanded(child: screens[_tab]),
          Container(
            decoration: BoxDecoration(
              color: Colors.white,
              boxShadow: [BoxShadow(color: Colors.black12, blurRadius: 8)],
            ),
            child: BottomNavigationBar(
              currentIndex: _tab,
              onTap: (i) => setState(() => _tab = i),
              type: BottomNavigationBarType.fixed,
              selectedItemColor: Colors.teal,
              unselectedItemColor: Colors.grey,
              backgroundColor: Colors.white,
              elevation: 0,
              items: [
                BottomNavigationBarItem(icon: const Icon(Icons.dashboard_outlined),           activeIcon: const Icon(Icons.dashboard),           label: t('nav_home')),
                BottomNavigationBarItem(icon: const Icon(Icons.people_outlined),              activeIcon: const Icon(Icons.people),              label: t('nav_relatives')),
                BottomNavigationBarItem(icon: const Icon(Icons.medical_information_outlined), activeIcon: const Icon(Icons.medical_information), label: t('nav_diagnoses')),
                BottomNavigationBarItem(icon: const Icon(Icons.warning_amber_outlined),       activeIcon: const Icon(Icons.warning_amber),       label: t('nav_allergies')),
              ],
            ),
          ),
        ],
      ),
    );
  }
}

// ── Dashboard ─────────────────────────────────────────────────────────────────
class _DashboardTab extends StatelessWidget {
  final dynamic user;
  final List<Relative> relatives;
  final List<Diagnosis> diagnoses;
  final List<Allergy> allergies;
  final bool loading;

  const _DashboardTab({required this.user, required this.relatives, required this.diagnoses, required this.allergies, required this.loading});

  @override
  Widget build(BuildContext context) {
    final t = context.watch<LocaleProvider>().t;
    if (loading) return const Center(child: CircularProgressIndicator());
    return ListView(
      padding: const EdgeInsets.all(16),
      children: [
        Card(
          child: Padding(
            padding: const EdgeInsets.all(16),
            child: Row(children: [
              CircleAvatar(
                radius: 28, backgroundColor: Colors.teal,
                child: Text(user?.fullName.substring(0,1) ?? '?',
                    style: const TextStyle(color: Colors.white, fontSize: 22)),
              ),
              const SizedBox(width: 16),
              Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                Text(user?.fullName ?? '', style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 16)),
                Text(user?.email ?? '', style: const TextStyle(color: Colors.grey)),
              ]),
            ]),
          ),
        ),
        const SizedBox(height: 16),
        Row(children: [
          _StatCard(label: t('relatives_count'), value: relatives.length, icon: Icons.people,              color: Colors.blue),
          const SizedBox(width: 12),
          _StatCard(label: t('diagnoses_count'), value: diagnoses.length, icon: Icons.medical_information, color: Colors.orange),
          const SizedBox(width: 12),
          _StatCard(label: t('allergies_count'), value: allergies.length, icon: Icons.warning_amber,       color: Colors.red),
        ]),
        const SizedBox(height: 12),
        Card(
          color: Colors.teal.shade50,
          child: ListTile(
            leading: const Icon(Icons.medical_services, color: Colors.teal, size: 28),
            title: Text(t('courses_label'), style: const TextStyle(fontWeight: FontWeight.bold)),
            subtitle: Text(t('courses_sub')),
            trailing: const Icon(Icons.chevron_right, color: Colors.teal),
            onTap: () => Navigator.pushNamed(context, '/courses'),
          ),
        ),
        const SizedBox(height: 8),
        Card(
          color: Colors.orange.shade50,
          child: ListTile(
            leading: const Icon(Icons.notifications_active, color: Colors.orange, size: 28),
            title: Text(t('reminders_label'), style: const TextStyle(fontWeight: FontWeight.bold)),
            subtitle: Text(t('reminders_sub')),
            trailing: const Icon(Icons.chevron_right, color: Colors.orange),
            onTap: () => Navigator.pushNamed(context, '/reminders'),
          ),
        ),
        const SizedBox(height: 8),
        Card(
          color: Colors.purple.shade50,
          child: ListTile(
            leading: const Icon(Icons.folder_open, color: Colors.purple, size: 28),
            title: Text(t('documents_label'), style: const TextStyle(fontWeight: FontWeight.bold)),
            subtitle: Text(t('documents_sub')),
            trailing: const Icon(Icons.chevron_right, color: Colors.purple),
            onTap: () => Navigator.pushNamed(context, '/documents'),
          ),
        ),
        const SizedBox(height: 8),
        Card(
          color: Colors.green.shade50,
          child: ListTile(
            leading: const Icon(Icons.security, color: Colors.green, size: 28),
            title: Text(t('security_label'), style: const TextStyle(fontWeight: FontWeight.bold)),
            subtitle: Text(t('security_sub')),
            trailing: const Icon(Icons.chevron_right, color: Colors.green),
            onTap: () => Navigator.pushNamed(context, '/security'),
          ),
        ),
        if (diagnoses.isNotEmpty) ...[
          const SizedBox(height: 16),
          const Text('Последние диагнозы', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 16)),
          const SizedBox(height: 8),
          ...diagnoses.take(3).map((d) => Card(
            child: ListTile(
              leading: const Icon(Icons.medical_information, color: Colors.orange),
              title: Text(d.title),
              subtitle: Text(d.relativeName ?? 'Я сам'),
              trailing: d.isChronic ? const Chip(label: Text('Хронич.')) : null,
            ),
          )),
        ],
        if (allergies.isNotEmpty) ...[
          const SizedBox(height: 16),
          const Text('Аллергии', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 16)),
          const SizedBox(height: 8),
          ...allergies.take(3).map((a) => Card(
            child: ListTile(
              leading: const Icon(Icons.warning_amber, color: Colors.red),
              title: Text(a.allergen),
              subtitle: Text(a.relativeName ?? 'Я сам'),
              trailing: Chip(label: Text(Allergy.severityLabel(a.severity))),
            ),
          )),
        ],
      ],
    );
  }
}

class _StatCard extends StatelessWidget {
  final String label;
  final int value;
  final IconData icon;
  final Color color;

  const _StatCard({required this.label, required this.value, required this.icon, required this.color});

  @override
  Widget build(BuildContext context) {
    return Expanded(
      child: Card(
        child: Padding(
          padding: const EdgeInsets.all(12),
          child: Column(children: [
            Icon(icon, color: color, size: 28),
            const SizedBox(height: 4),
            Text('$value', style: TextStyle(fontSize: 22, fontWeight: FontWeight.bold, color: color)),
            Text(label, style: const TextStyle(fontSize: 11, color: Colors.grey), textAlign: TextAlign.center),
          ]),
        ),
      ),
    );
  }
}

// ── Relatives Tab ─────────────────────────────────────────────────────────────
class _RelativesTab extends StatelessWidget {
  final List<Relative> relatives;
  final bool loading;
  final VoidCallback onRefresh;
  final void Function(Relative) onEdit;
  final void Function(Relative) onDelete;

  const _RelativesTab({required this.relatives, required this.loading, required this.onRefresh, required this.onEdit, required this.onDelete});

  @override
  Widget build(BuildContext context) {
    if (loading) return const Center(child: CircularProgressIndicator());
    return Stack(
      children: [
        relatives.isEmpty
            ? const Center(child: Text('Нет родственников'))
            : ListView.builder(
                padding: const EdgeInsets.fromLTRB(8, 8, 8, 80),
                itemCount: relatives.length,
                itemBuilder: (_, i) {
                  final r = relatives[i];
                  return Card(
                    child: ListTile(
                      leading: CircleAvatar(
                        backgroundColor: Colors.teal,
                        child: Text(r.fullName.substring(0,1), style: const TextStyle(color: Colors.white)),
                      ),
                      title: Text(r.fullName),
                      subtitle: Text(Relative.relationLabel(r.relationType)),
                      trailing: Row(mainAxisSize: MainAxisSize.min, children: [
                        IconButton(icon: const Icon(Icons.edit_outlined, color: Colors.teal), onPressed: () => onEdit(r)),
                        IconButton(icon: const Icon(Icons.delete_outline, color: Colors.red), onPressed: () => onDelete(r)),
                      ]),
                    ),
                  );
                },
              ),
        Positioned(
          bottom: 16, right: 16,
          child: FloatingActionButton(
            backgroundColor: Colors.teal,
            foregroundColor: Colors.white,
            onPressed: () => Navigator.pushNamed(context, '/relative/new').then((_) => onRefresh()),
            child: const Icon(Icons.add),
          ),
        ),
      ],
    );
  }
}

// ── Diagnoses Tab ─────────────────────────────────────────────────────────────
class _DiagnosesTab extends StatelessWidget {
  final List<Diagnosis> diagnoses;
  final List<Relative> relatives;
  final bool loading;
  final VoidCallback onRefresh;
  final void Function(Diagnosis) onEdit;
  final void Function(Diagnosis) onDelete;

  const _DiagnosesTab({required this.diagnoses, required this.relatives, required this.loading, required this.onRefresh, required this.onEdit, required this.onDelete});

  @override
  Widget build(BuildContext context) {
    if (loading) return const Center(child: CircularProgressIndicator());
    return Stack(
      children: [
        diagnoses.isEmpty
            ? const Center(child: Text('Нет диагнозов'))
            : ListView.builder(
                padding: const EdgeInsets.fromLTRB(8, 8, 8, 80),
                itemCount: diagnoses.length,
                itemBuilder: (_, i) {
                  final d = diagnoses[i];
                  return Card(
                    child: ListTile(
                      leading: const CircleAvatar(
                        backgroundColor: Colors.orange,
                        child: Icon(Icons.medical_information, color: Colors.white, size: 18),
                      ),
                      title: Text(d.title),
                      subtitle: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                        Text(d.relativeName ?? 'Я сам'),
                        if (d.icdCode != null)
                          Text(d.icdCode!, style: const TextStyle(color: Colors.teal, fontSize: 12)),
                      ]),
                      isThreeLine: d.icdCode != null,
                      trailing: Row(mainAxisSize: MainAxisSize.min, children: [
                        if (d.isChronic)
                          const Chip(label: Text('Хр.', style: TextStyle(fontSize: 10))),
                        IconButton(icon: const Icon(Icons.edit_outlined, color: Colors.teal), onPressed: () => onEdit(d)),
                        IconButton(icon: const Icon(Icons.delete_outline, color: Colors.red), onPressed: () => onDelete(d)),
                      ]),
                    ),
                  );
                },
              ),
        Positioned(
          bottom: 16, right: 16,
          child: FloatingActionButton(
            backgroundColor: Colors.teal,
            foregroundColor: Colors.white,
            onPressed: () => Navigator.pushNamed(context, '/diagnosis/new', arguments: relatives).then((_) => onRefresh()),
            child: const Icon(Icons.add),
          ),
        ),
      ],
    );
  }
}

// ── Allergies Tab ─────────────────────────────────────────────────────────────
class _AllergiesTab extends StatelessWidget {
  final List<Allergy> allergies;
  final List<Relative> relatives;
  final bool loading;
  final VoidCallback onRefresh;
  final void Function(Allergy) onEdit;
  final void Function(Allergy) onDelete;

  const _AllergiesTab({required this.allergies, required this.relatives, required this.loading, required this.onRefresh, required this.onEdit, required this.onDelete});

  Color _severityColor(String? s) {
    if (s == 'severe') return Colors.red;
    if (s == 'moderate') return Colors.orange;
    return Colors.green;
  }

  @override
  Widget build(BuildContext context) {
    if (loading) return const Center(child: CircularProgressIndicator());
    return Stack(
      children: [
        allergies.isEmpty
            ? const Center(child: Text('Нет аллергий'))
            : ListView.builder(
                padding: const EdgeInsets.fromLTRB(8, 8, 8, 80),
                itemCount: allergies.length,
                itemBuilder: (_, i) {
                  final a = allergies[i];
                  return Card(
                    child: ListTile(
                      leading: CircleAvatar(
                        backgroundColor: _severityColor(a.severity),
                        child: const Icon(Icons.warning_amber, color: Colors.white, size: 18),
                      ),
                      title: Text(a.allergen),
                      subtitle: Text(a.relativeName ?? 'Я сам'),
                      trailing: Row(mainAxisSize: MainAxisSize.min, children: [
                        Chip(
                          label: Text(Allergy.severityLabel(a.severity), style: const TextStyle(fontSize: 10)),
                          backgroundColor: _severityColor(a.severity).withValues(alpha: 0.2),
                        ),
                        IconButton(icon: const Icon(Icons.edit_outlined, color: Colors.teal), onPressed: () => onEdit(a)),
                        IconButton(icon: const Icon(Icons.delete_outline, color: Colors.red), onPressed: () => onDelete(a)),
                      ]),
                    ),
                  );
                },
              ),
        Positioned(
          bottom: 16, right: 16,
          child: FloatingActionButton(
            backgroundColor: Colors.teal,
            foregroundColor: Colors.white,
            onPressed: () => Navigator.pushNamed(context, '/allergy/new', arguments: relatives).then((_) => onRefresh()),
            child: const Icon(Icons.add),
          ),
        ),
      ],
    );
  }
}
