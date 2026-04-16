import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../providers/auth_provider.dart';
import '../services/api_service.dart';
import '../models/relative.dart';
import '../models/diagnosis.dart';
import '../models/allergy.dart';

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
    setState(() => _loading = true);
    try {
      final results = await Future.wait([
        ApiService.getRelatives(),
        ApiService.getDiagnoses(),
        ApiService.getAllergies(),
      ]);
      setState(() {
        _relatives = results[0] as List<Relative>;
        _diagnoses = results[1] as List<Diagnosis>;
        _allergies = results[2] as List<Allergy>;
      });
    } catch (e) {
      _showError(e.toString());
    } finally {
      if (mounted) setState(() => _loading = false);
    }
  }

  void _showError(String msg) {
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(content: Text(msg), backgroundColor: Colors.red),
    );
  }

  @override
  Widget build(BuildContext context) {
    final user = context.watch<AuthProvider>().user;

    final screens = [
      _DashboardTab(
        user: user,
        relatives: _relatives,
        diagnoses: _diagnoses,
        allergies: _allergies,
        loading: _loading,
      ),
      _RelativesTab(relatives: _relatives, loading: _loading, onRefresh: _load),
      _DiagnosesTab(diagnoses: _diagnoses, relatives: _relatives, loading: _loading, onRefresh: _load),
      _AllergiesTab(allergies: _allergies, relatives: _relatives, loading: _loading, onRefresh: _load),
    ];

    return Scaffold(
      appBar: AppBar(
        title: const Text('Семейный анамнез'),
        backgroundColor: Colors.teal,
        foregroundColor: Colors.white,
        actions: [
          IconButton(
            icon: const Icon(Icons.refresh),
            onPressed: _load,
          ),
          PopupMenuButton(
            itemBuilder: (_) => [
              const PopupMenuItem(value: 'logout', child: Text('Выйти')),
            ],
            onSelected: (v) {
              if (v == 'logout') context.read<AuthProvider>().logout();
            },
          ),
        ],
      ),
      body: screens[_tab],
      bottomNavigationBar: NavigationBar(
        selectedIndex: _tab,
        onDestinationSelected: (i) => setState(() => _tab = i),
        destinations: const [
          NavigationDestination(icon: Icon(Icons.dashboard_outlined), selectedIcon: Icon(Icons.dashboard), label: 'Главная'),
          NavigationDestination(icon: Icon(Icons.people_outlined), selectedIcon: Icon(Icons.people), label: 'Родственники'),
          NavigationDestination(icon: Icon(Icons.medical_information_outlined), selectedIcon: Icon(Icons.medical_information), label: 'Диагнозы'),
          NavigationDestination(icon: Icon(Icons.warning_amber_outlined), selectedIcon: Icon(Icons.warning_amber), label: 'Аллергии'),
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

  const _DashboardTab({
    required this.user,
    required this.relatives,
    required this.diagnoses,
    required this.allergies,
    required this.loading,
  });

  @override
  Widget build(BuildContext context) {
    if (loading) return const Center(child: CircularProgressIndicator());
    return RefreshIndicator(
      onRefresh: () async {},
      child: ListView(
        padding: const EdgeInsets.all(16),
        children: [
          Card(
            child: Padding(
              padding: const EdgeInsets.all(16),
              child: Row(
                children: [
                  CircleAvatar(
                    radius: 28,
                    backgroundColor: Colors.teal,
                    child: Text(
                      user?.fullName.substring(0, 1) ?? '?',
                      style: const TextStyle(color: Colors.white, fontSize: 22),
                    ),
                  ),
                  const SizedBox(width: 16),
                  Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(user?.fullName ?? '', style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 16)),
                      Text(user?.email ?? '', style: const TextStyle(color: Colors.grey)),
                    ],
                  ),
                ],
              ),
            ),
          ),
          const SizedBox(height: 16),
          Row(
            children: [
              _StatCard(label: 'Родственники', value: relatives.length, icon: Icons.people, color: Colors.blue),
              const SizedBox(width: 12),
              _StatCard(label: 'Диагнозы', value: diagnoses.length, icon: Icons.medical_information, color: Colors.orange),
              const SizedBox(width: 12),
              _StatCard(label: 'Аллергии', value: allergies.length, icon: Icons.warning_amber, color: Colors.red),
            ],
          ),
          const SizedBox(height: 16),
          if (diagnoses.isNotEmpty) ...[
            const Text('Последние диагнозы', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 16)),
            const SizedBox(height: 8),
            ...diagnoses.take(3).map((d) => Card(
              child: ListTile(
                leading: const Icon(Icons.medical_information, color: Colors.orange),
                title: Text(d.title),
                subtitle: Text(d.relativeName ?? 'Я сам'),
                trailing: d.isChronic
                    ? const Chip(label: Text('Хронич.'), backgroundColor: Colors.orange)
                    : null,
              ),
            )),
          ],
          const SizedBox(height: 16),
          if (allergies.isNotEmpty) ...[
            const Text('Аллергии', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 16)),
            const SizedBox(height: 8),
            ...allergies.take(3).map((a) => Card(
              child: ListTile(
                leading: const Icon(Icons.warning_amber, color: Colors.red),
                title: Text(a.allergen),
                subtitle: Text(a.relativeName ?? 'Я сам'),
                trailing: Chip(
                  label: Text(Allergy.severityLabel(a.severity)),
                  backgroundColor: a.severity == 'severe'
                      ? Colors.red[100]
                      : a.severity == 'moderate'
                          ? Colors.orange[100]
                          : Colors.green[100],
                ),
              ),
            )),
          ],
        ],
      ),
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
          child: Column(
            children: [
              Icon(icon, color: color, size: 28),
              const SizedBox(height: 4),
              Text('$value', style: TextStyle(fontSize: 22, fontWeight: FontWeight.bold, color: color)),
              Text(label, style: const TextStyle(fontSize: 11, color: Colors.grey), textAlign: TextAlign.center),
            ],
          ),
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

  const _RelativesTab({required this.relatives, required this.loading, required this.onRefresh});

  @override
  Widget build(BuildContext context) {
    if (loading) return const Center(child: CircularProgressIndicator());
    return Scaffold(
      body: relatives.isEmpty
          ? const Center(child: Text('Нет родственников'))
          : ListView.builder(
              padding: const EdgeInsets.all(8),
              itemCount: relatives.length,
              itemBuilder: (_, i) {
                final r = relatives[i];
                return Card(
                  child: ListTile(
                    leading: CircleAvatar(
                      backgroundColor: Colors.teal,
                      child: Text(r.fullName.substring(0, 1), style: const TextStyle(color: Colors.white)),
                    ),
                    title: Text(r.fullName),
                    subtitle: Text(Relative.relationLabel(r.relationType)),
                    trailing: IconButton(
                      icon: const Icon(Icons.delete_outline, color: Colors.red),
                      onPressed: () async {
                        await ApiService.deleteRelative(r.id);
                        onRefresh();
                      },
                    ),
                  ),
                );
              },
            ),
      floatingActionButton: FloatingActionButton(
        backgroundColor: Colors.teal,
        child: const Icon(Icons.add, color: Colors.white),
        onPressed: () => Navigator.pushNamed(context, '/relative/new').then((_) => onRefresh()),
      ),
    );
  }
}

// ── Diagnoses Tab ─────────────────────────────────────────────────────────────
class _DiagnosesTab extends StatelessWidget {
  final List<Diagnosis> diagnoses;
  final List<Relative> relatives;
  final bool loading;
  final VoidCallback onRefresh;

  const _DiagnosesTab({required this.diagnoses, required this.relatives, required this.loading, required this.onRefresh});

  @override
  Widget build(BuildContext context) {
    if (loading) return const Center(child: CircularProgressIndicator());
    return Scaffold(
      body: diagnoses.isEmpty
          ? const Center(child: Text('Нет диагнозов'))
          : ListView.builder(
              padding: const EdgeInsets.all(8),
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
                    subtitle: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(d.relativeName ?? 'Я сам'),
                        if (d.icdCode != null)
                          Text(d.icdCode!, style: const TextStyle(color: Colors.teal, fontSize: 12)),
                      ],
                    ),
                    isThreeLine: d.icdCode != null,
                    trailing: Row(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        if (d.isChronic)
                          const Chip(label: Text('Хр.', style: TextStyle(fontSize: 10)), backgroundColor: Colors.orange),
                        IconButton(
                          icon: const Icon(Icons.delete_outline, color: Colors.red),
                          onPressed: () async {
                            await ApiService.deleteDiagnosis(d.id);
                            onRefresh();
                          },
                        ),
                      ],
                    ),
                  ),
                );
              },
            ),
      floatingActionButton: FloatingActionButton(
        backgroundColor: Colors.teal,
        child: const Icon(Icons.add, color: Colors.white),
        onPressed: () => Navigator.pushNamed(context, '/diagnosis/new', arguments: relatives).then((_) => onRefresh()),
      ),
    );
  }
}

// ── Allergies Tab ─────────────────────────────────────────────────────────────
class _AllergiesTab extends StatelessWidget {
  final List<Allergy> allergies;
  final List<Relative> relatives;
  final bool loading;
  final VoidCallback onRefresh;

  const _AllergiesTab({required this.allergies, required this.relatives, required this.loading, required this.onRefresh});

  Color _severityColor(String? s) {
    if (s == 'severe') return Colors.red;
    if (s == 'moderate') return Colors.orange;
    return Colors.green;
  }

  @override
  Widget build(BuildContext context) {
    if (loading) return const Center(child: CircularProgressIndicator());
    return Scaffold(
      body: allergies.isEmpty
          ? const Center(child: Text('Нет аллергий'))
          : ListView.builder(
              padding: const EdgeInsets.all(8),
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
                    trailing: Row(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        Chip(
                          label: Text(Allergy.severityLabel(a.severity), style: const TextStyle(fontSize: 10)),
                          backgroundColor: _severityColor(a.severity).withOpacity(0.2),
                        ),
                        IconButton(
                          icon: const Icon(Icons.delete_outline, color: Colors.red),
                          onPressed: () async {
                            await ApiService.deleteAllergy(a.id);
                            onRefresh();
                          },
                        ),
                      ],
                    ),
                  ),
                );
              },
            ),
      floatingActionButton: FloatingActionButton(
        backgroundColor: Colors.teal,
        child: const Icon(Icons.add, color: Colors.white),
        onPressed: () => Navigator.pushNamed(context, '/allergy/new', arguments: relatives).then((_) => onRefresh()),
      ),
    );
  }
}
