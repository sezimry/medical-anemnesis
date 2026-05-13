# Medical Organizer — Семейный анамнез

Полнофункциональная система для хранения и управления медицинской информацией семьи. Включает веб-приложение и мобильное приложение на Android с общим backend и облачной базой данных.

---

## Архитектура

```
┌─────────────────┐    ┌─────────────────┐
│   React Web     │    │  Flutter Mobile │
│   (Frontend)    │    │   (Android)     │
└────────┬────────┘    └────────┬────────┘
         │                     │
         └──────────┬──────────┘
                    │ HTTP REST API
         ┌──────────▼──────────┐
         │   Node.js / Express  │
         └──────────┬──────────┘
                    │
         ┌──────────▼──────────┐
         │  Supabase PostgreSQL │
         │   (облачная БД)      │
         └─────────────────────┘
```

---

## Технологический стек

### Backend
| Технология | Версия | Назначение |
|---|---|---|
| Node.js | 22 | Серверная платформа |
| Express.js | 4.18 | REST API |
| PostgreSQL | 15 | База данных (Supabase) |
| pg | 8.11 | Драйвер PostgreSQL |
| jsonwebtoken | 9.0 | JWT аутентификация |
| bcryptjs | 2.4 | Хэширование паролей |
| multer | 2.1 | Загрузка файлов |
| pdfkit | 0.15 | Генерация PDF |

### Frontend (React Web)
| Технология | Версия | Назначение |
|---|---|---|
| React | 18.3 | UI библиотека |
| Vite | 5.2 | Сборщик |
| React Router | 6.22 | Маршрутизация |
| Axios | 1.6 | HTTP клиент |
| Lucide React | 1.14 | SVG иконки |
| Context API | — | Управление состоянием |

### Mobile (Flutter / Android)
| Технология | Версия | Назначение |
|---|---|---|
| Flutter | 3.41 | Мобильный фреймворк |
| Dart | 3.11 | Язык программирования |
| Provider | 6.1 | Управление состоянием |
| http | 1.2 | HTTP запросы |
| shared_preferences | 2.3 | Кэширование данных |
| flutter_local_notifications | 18.0 | Push-уведомления |
| local_auth | 2.3 | Биометрия |
| image_picker | 1.1 | Камера / галерея |
| file_picker | 8.1 | Выбор PDF файлов |
| crypto | 3.0 | SHA-256 для PIN |
| timezone | 0.9 | Планирование уведомлений |

---

## Структура проекта

```
Medical Organizer site/
├── client/                        # React веб-приложение
│   └── src/
│       ├── api/                   # Axios клиент
│       ├── components/            # UI компоненты (Layout, PatientCard и др.)
│       ├── context/               # Auth, Locale, Theme, Toast
│       ├── hooks/                 # useAuth, useRelatives, useMedical
│       ├── pages/                 # Страницы приложения
│       │   ├── Dashboard.jsx
│       │   ├── Relatives.jsx
│       │   ├── MedicalRecords.jsx
│       │   ├── FamilyTree.jsx
│       │   ├── TreatmentCourses.jsx
│       │   ├── Reminders.jsx
│       │   ├── Documents.jsx
│       │   ├── Profile.jsx
│       │   └── doctor/            # Страницы врача
│       └── utils/
├── server/                        # Express backend
│   ├── controllers/               # Бизнес-логика
│   ├── db/                        # Миграции, seed
│   ├── middleware/                # auth.js, requireDoctor.js
│   ├── models/                    # User, Relative, Diagnosis, Allergy
│   ├── routes/                    # Все маршруты API
│   ├── uploads/                   # Загруженные файлы
│   └── utils/                     # exportPdf.js
└── medical_organizer/             # Flutter мобильное приложение
    └── lib/
        ├── config/                # api.dart
        ├── l10n/                  # translations.dart (RU/KG)
        ├── models/                # Все модели данных
        ├── providers/             # AuthProvider, LocaleProvider
        ├── screens/               # Все экраны
        │   └── doctor/            # Экраны врача
        ├── services/              # API, Cache, PIN, Bio, Notifications
        └── widgets/               # LangSwitch и др.
```

---

## Быстрый старт

### 1. Переменные окружения

Создайте файл `server/.env`:

```env
PORT=5000
JWT_SECRET=your_secret_key
JWT_EXPIRES_IN=7d
DATABASE_URL=postgresql://...supabase connection string...
```

### 2. Установка и запуск Backend

```bash
cd server
npm install
node db/seed.js    # Заполнить демо-данными
npm run dev        # http://localhost:5000
```

### 3. Запуск React Web

```bash
cd client
npm install
npm run dev        # http://localhost:5173
```

### 4. Запуск Flutter Mobile

```bash
cd medical_organizer
flutter pub get
flutter run        # Android эмулятор или устройство
```

---

## Демо-аккаунты

| Роль | Email | Пароль |
|---|---|---|
| Пациент | alexey@demo.com | demo123 |
| Пациент | aigul@demo.com | demo123 |
| Пациент | dmitry@demo.com | demo123 |
| Врач | doctor@demo.com | demo123 |

---

## API эндпоинты

### Аутентификация
| Метод | URL | Описание |
|---|---|---|
| POST | `/api/auth/register` | Регистрация |
| POST | `/api/auth/login` | Вход, получение JWT |

### Профиль
| Метод | URL | Описание |
|---|---|---|
| GET | `/api/user/me` | Получить профиль |
| PUT | `/api/user/me` | Обновить профиль |
| PUT | `/api/user/me/password` | Сменить пароль |
| DELETE | `/api/user/me` | Удалить аккаунт |

### Родственники
| Метод | URL | Описание |
|---|---|---|
| GET | `/api/relatives` | Список |
| POST | `/api/relatives` | Создать |
| PUT | `/api/relatives/:id` | Обновить |
| DELETE | `/api/relatives/:id` | Удалить |

### Диагнозы и Аллергии
| Метод | URL | Описание |
|---|---|---|
| GET/POST | `/api/diagnoses` | Список / Создать |
| PUT/DELETE | `/api/diagnoses/:id` | Обновить / Удалить |
| GET/POST | `/api/allergies` | Список / Создать |
| PUT/DELETE | `/api/allergies/:id` | Обновить / Удалить |

### Курсы лечения
| Метод | URL | Описание |
|---|---|---|
| GET/POST | `/api/courses` | Список / Создать |
| PUT/DELETE | `/api/courses/:id` | Обновить / Удалить |
| GET/POST | `/api/courses/:id/medications` | Лекарства курса |
| PUT/DELETE | `/api/courses/:id/medications/:medId` | Обновить / Удалить |

### Напоминания
| Метод | URL | Описание |
|---|---|---|
| GET/POST | `/api/reminders` | Список / Создать |
| PUT | `/api/reminders/:id` | Обновить |
| PATCH | `/api/reminders/:id/toggle` | Вкл/Выкл |
| DELETE | `/api/reminders/:id` | Удалить |

### Документы
| Метод | URL | Описание |
|---|---|---|
| GET/POST | `/api/documents` | Список / Загрузить |
| PUT/DELETE | `/api/documents/:id` | Обновить / Удалить |
| GET | `/api/documents/:id/file` | Получить файл |

### Врачебный модуль (только role=doctor)
| Метод | URL | Описание |
|---|---|---|
| GET | `/api/doctor/patients` | Список пациентов |
| GET | `/api/doctor/patients/:id` | Данные пациента |
| POST | `/api/doctor/patients/:id/diagnoses` | Добавить диагноз |
| POST | `/api/doctor/patients/:id/allergies` | Добавить аллергию |
| DELETE | `/api/doctor/patients/:id/diagnoses/:diagId` | Удалить диагноз |

### Экспорт
| Метод | URL | Описание |
|---|---|---|
| GET | `/api/export/json` | Экспорт в JSON |
| GET | `/api/export/pdf` | Генерация PDF отчёта |

---

## База данных

```
users              id, email, password, full_name, birth_date, gender, role, created_at
relatives          id, user_id, full_name, birth_date, gender, relation_type,
                   parent_relative_id, notes, created_at
diagnoses          id, user_id, relative_id, icd_code, title, description,
                   diagnosed_at, is_chronic, created_at
allergies          id, user_id, relative_id, allergen, reaction, severity, created_at
treatment_courses  id, user_id, title, doctor_name, institution, prescribed_at,
                   started_at, ended_at, prescription, notes, is_active, created_at
medications        id, course_id, user_id, name, dosage, frequency, times,
                   duration, conditions, notes, created_at
reminders          id, user_id, medication_id, course_id, title, time,
                   days, is_enabled, created_at
documents          id, user_id, title, type, doctor_name, institution,
                   doc_date, description, file_name, file_path, file_mime,
                   file_size, created_at
```

---

## Функционал

### Веб-приложение (React)
- Регистрация и авторизация с JWT
- Управление родственниками с семейным деревом (SVG)
- Диагнозы с кодами МКБ-10 и автокомплитом
- Аллергии с уровнем тяжести
- Курсы лечения и лекарства
- Напоминания о приёме лекарств по дням недели
- Загрузка и просмотр медицинских документов (фото/PDF)
- Экспорт данных в JSON и PDF
- Врачебный интерфейс для работы с пациентами
- Тёмная / светлая тема
- Локализация RU / KG

### Мобильное приложение (Flutter / Android)
- Полный CRUD для всех разделов
- Роли: пациент и врач с разными интерфейсами
- Push-уведомления о приёме лекарств
- Загрузка документов с камеры, галереи, файлового менеджера
- PIN-код при запуске (SHA-256 хэширование)
- Биометрическая аутентификация (отпечаток / лицо)
- Локальное кэширование данных (offline чтение)
- Локализация RU / KG с сохранением выбора

---

## Безопасность

| Механизм | Реализация |
|---|---|
| Аутентификация | JWT токены (7 дней) |
| Пароли | bcryptjs, salt rounds 10 |
| PIN-код | SHA-256 хэш в SharedPreferences |
| Биометрия | Android Biometric API |
| Роли | Middleware `requireDoctor` на сервере |
| Изоляция данных | Все запросы фильтруются по `user_id` |
| Файлы | Доступ через JWT (header или query-param) |
