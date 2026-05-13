import 'package:flutter_local_notifications/flutter_local_notifications.dart';
import 'package:timezone/timezone.dart' as tz;
import 'package:timezone/data/latest.dart' as tz;
import '../models/reminder.dart';

class NotificationService {
  static final _plugin = FlutterLocalNotificationsPlugin();
  static bool _initialized = false;

  static Future<void> init() async {
    if (_initialized) return;
    tz.initializeTimeZones();

    const android = AndroidInitializationSettings('@mipmap/ic_launcher');
    const settings = InitializationSettings(android: android);
    await _plugin.initialize(settings);
    _initialized = true;
  }

  static Future<void> scheduleReminder(Reminder reminder) async {
    await cancelReminder(reminder.id);
    if (!reminder.isEnabled) return;

    final parts = reminder.time.split(':');
    final hour   = int.parse(parts[0]);
    final minute = int.parse(parts[1]);

    const androidDetails = AndroidNotificationDetails(
      'reminders_channel',
      'Напоминания о лекарствах',
      channelDescription: 'Уведомления о приёме лекарств',
      importance: Importance.high,
      priority: Priority.high,
      icon: '@mipmap/ic_launcher',
    );
    const details = NotificationDetails(android: androidDetails);

    if (reminder.days == null || reminder.days!.isEmpty) {
      // Каждый день
      await _plugin.zonedSchedule(
        reminder.id,
        reminder.title,
        reminder.medicationName != null ? 'Время принять: ${reminder.medicationName}' : null,
        _nextInstanceOfTime(hour, minute),
        details,
        androidScheduleMode: AndroidScheduleMode.exactAllowWhileIdle,
        uiLocalNotificationDateInterpretation: UILocalNotificationDateInterpretation.absoluteTime,
        matchDateTimeComponents: DateTimeComponents.time,
      );
    } else {
      // По дням недели
      for (final dayStr in reminder.daysList) {
        final day = int.parse(dayStr);
        await _plugin.zonedSchedule(
          reminder.id * 10 + day,
          reminder.title,
          reminder.medicationName != null ? 'Время принять: ${reminder.medicationName}' : null,
          _nextInstanceOfWeekday(hour, minute, day),
          details,
          androidScheduleMode: AndroidScheduleMode.exactAllowWhileIdle,
          uiLocalNotificationDateInterpretation: UILocalNotificationDateInterpretation.absoluteTime,
          matchDateTimeComponents: DateTimeComponents.dayOfWeekAndTime,
        );
      }
    }
  }

  static Future<void> cancelReminder(int id) async {
    await _plugin.cancel(id);
    // Отменяем по дням
    for (int d = 1; d <= 7; d++) {
      await _plugin.cancel(id * 10 + d);
    }
  }

  static Future<void> scheduleAll(List<Reminder> reminders) async {
    for (final r in reminders) {
      await scheduleReminder(r);
    }
  }

  static tz.TZDateTime _nextInstanceOfTime(int hour, int minute) {
    final now  = tz.TZDateTime.now(tz.local);
    var scheduled = tz.TZDateTime(tz.local, now.year, now.month, now.day, hour, minute);
    if (scheduled.isBefore(now)) {
      scheduled = scheduled.add(const Duration(days: 1));
    }
    return scheduled;
  }

  static tz.TZDateTime _nextInstanceOfWeekday(int hour, int minute, int weekday) {
    var scheduled = _nextInstanceOfTime(hour, minute);
    // weekday: 1=Пн...7=Вс, Dart: 1=Пн...7=Вс — совпадает
    while (scheduled.weekday != weekday) {
      scheduled = scheduled.add(const Duration(days: 1));
    }
    return scheduled;
  }
}
