import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'providers/auth_provider.dart';
import 'providers/locale_provider.dart';
import 'screens/login_screen.dart';
import 'screens/register_screen.dart';
import 'screens/home_screen.dart';
import 'screens/relative_form_screen.dart';
import 'screens/diagnosis_form_screen.dart';
import 'screens/allergy_form_screen.dart';
import 'screens/doctor/doctor_home_screen.dart';
import 'screens/doctor/patient_detail_screen.dart';
import 'screens/courses_screen.dart';
import 'screens/course_form_screen.dart';
import 'screens/reminders_screen.dart';
import 'screens/documents_screen.dart';
import 'screens/pin_screen.dart';
import 'screens/security_screen.dart';
import 'services/notification_service.dart';
import 'services/pin_service.dart';

void main() async {
  WidgetsFlutterBinding.ensureInitialized();
  await NotificationService.init();
  final localeProvider = LocaleProvider();
  await localeProvider.init();
  runApp(
    MultiProvider(
      providers: [
        ChangeNotifierProvider(create: (_) => AuthProvider()..init()),
        ChangeNotifierProvider.value(value: localeProvider),
      ],
      child: const App(),
    ),
  );
}

class App extends StatelessWidget {
  const App({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'Семейный анамнез',
      debugShowCheckedModeBanner: false,
      theme: ThemeData(
        colorSchemeSeed: Colors.teal,
        useMaterial3: false,
      ),
      routes: {
        '/login':           (_) => const LoginScreen(),
        '/register':        (_) => const RegisterScreen(),
        '/home':            (_) => const HomeScreen(),
        '/relative/new':    (_) => const RelativeFormScreen(),
        '/diagnosis/new':   (_) => const DiagnosisFormScreen(),
        '/allergy/new':     (_) => const AllergyFormScreen(),
        '/doctor/patients': (_) => const DoctorHomeScreen(),
        '/doctor/patient':  (_) => const PatientDetailScreen(),
        '/courses':         (_) => const CoursesScreen(),
        '/reminders':       (_) => const RemindersScreen(),
        '/documents':       (_) => const DocumentsScreen(),
        '/security':        (_) => const SecurityScreen(),
        '/course/form':     (ctx) => CourseFormScreen(
          course: ModalRoute.of(ctx)?.settings.arguments as dynamic,
        ),
      },
      home: const _Root(),
    );
  }
}

class _Root extends StatefulWidget {
  const _Root();

  @override
  State<_Root> createState() => _RootState();
}

class _RootState extends State<_Root> {
  bool _pinPassed = false;
  bool _checkingPin = true;

  @override
  void initState() {
    super.initState();
    _checkPin();
  }

  Future<void> _checkPin() async {
    final pinEnabled = await PinService.isPinEnabled();
    if (!pinEnabled) {
      setState(() { _pinPassed = true; _checkingPin = false; });
      return;
    }
    setState(() => _checkingPin = false);
    // Показываем экран PIN
    if (mounted) {
      final ok = await Navigator.push<bool>(
        context,
        MaterialPageRoute(
          builder: (_) => PinScreen(
            mode: PinMode.enter,
            onSuccess: () {
              setState(() => _pinPassed = true);
              Navigator.of(context).pop();
            },
          ),
        ),
      );
      if (ok == true) setState(() => _pinPassed = true);
    }
  }

  @override
  Widget build(BuildContext context) {
    if (_checkingPin) {
      return const Scaffold(
        backgroundColor: Colors.teal,
        body: Center(child: CircularProgressIndicator(color: Colors.white)),
      );
    }

    if (!_pinPassed) {
      return PinScreen(
        mode: PinMode.enter,
        onSuccess: () => setState(() => _pinPassed = true),
      );
    }

    final auth = context.watch<AuthProvider>();

    if (auth.loading) {
      return const Scaffold(body: Center(child: CircularProgressIndicator()));
    }

    if (!auth.isAuthenticated) return const LoginScreen();

    return auth.user!.isDoctor ? const DoctorHomeScreen() : const HomeScreen();
  }
}
