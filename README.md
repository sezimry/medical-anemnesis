# Семейный анамнез — Family Medical History System

Система для хранения, редактирования и анализа медицинской информации о пользователе и его родственниках. Включает веб-приложение и мобильное приложение на Flutter.

---

## Технологии

### Веб-приложение
| Слой | Стек |
|---|---|
| Frontend | React 18, React Router 6, Axios, Vite 5 |
| Backend | Node.js, Express 4 |
| База данных | SQLite (better-sqlite3) |
| Аутентификация | JWT + bcryptjs |
| PDF-экспорт | pdfkit |

### Мобильное приложение
| Слой | Стек |
|---|---|
| Фреймворк | Flutter 3, Dart |
| Состояние | Provider 6 |
| HTTP-клиент | http 1.2 |
| Хранилище | shared_preferences |
| Локализация | intl |
| Платформы | Android, iOS |

---

## Структура проекта

```
medical-organizer/
├── client/                      # React-приложение
│   └── src/
│       ├── api/                 # Axios-клиент
│       ├── components/          # UI, Layout, PatientCard, FamilyTree
│       ├── context/             # AuthContext, LocaleContext
│       ├── hooks/               # useAuth, useRelatives, useMedical
│       ├── locales/             # ru.json, kg.json
│       ├── pages/               # Login, Register, Dashboard, Profile,
│       │                        # Relatives, MedicalRecords, FamilyTree
│       └── utils/               # export.js
├── server/                      # Express-сервер
│   ├── controllers/             # authController, userController,
│   │                            # relativesController, diagnosesController,
│   │                            # allergiesController
│   ├── db/                      # database.js, migrations.js, medical.db*
│   ├── middleware/              # auth.js (JWT)
│   ├── models/                  # User, Relative, Diagnosis, Allergy
│   ├── routes/                  # auth, user, relatives, diagnoses,
│   │                            # allergies, export
│   └── utils/                   # exportPdf.js
└── medical_organizer/           # Flutter мобильное приложение
    └── lib/
        ├── config/              # api.dart — базовый URL сервера
        ├── models/              # User, Relative, Diagnosis, Allergy
        ├── providers/           # AuthProvider (Provider)
        ├── screens/             # LoginScreen, RegisterScreen, HomeScreen,
        │                        # RelativeFormScreen, DiagnosisFormScreen,
        │                        # AllergyFormScreen
        └── services/            # ApiService, StorageService
```

---

## Быстрый старт

### Веб-приложение

#### 1. Установка зависимостей

```bash
# Сервер
cd server
npm install

# Клиент (в другом терминале)
cd client
npm install
```

#### 2. Переменные окружения

Файл `server/.env` уже создан. При необходимости измените:

```env
PORT=5000
JWT_SECRET=super_secret_medical_key_change_in_production
JWT_EXPIRES_IN=7d
```

#### 3. Запуск

```bash
# Терминал 1 — сервер (http://localhost:5000)
cd server
npm run dev

# Терминал 2 — клиент (http://localhost:5173)
cd client
npm run dev
```

При первом запуске сервера база данных `server/db/medical.db` создаётся автоматически.

---

### Мобильное приложение (Flutter)

#### Требования

- Flutter SDK 3.x ([flutter.dev](https://flutter.dev/docs/get-started/install))
- Dart SDK ^3.11
- Android Studio / Xcode для эмулятора или физическое устройство

#### 1. Установка зависимостей

```bash
cd medical_organizer
flutter pub get
```

#### 2. Настройка сервера

В файле `medical_organizer/lib/config/api.dart` укажите адрес вашего сервера:

```dart
// Для эмулятора Android — 10.0.2.2 вместо localhost
const String baseUrl = 'http://10.0.2.2:5000/api';

// Для физического устройства — IP вашего компьютера
// const String baseUrl = 'http://192.168.x.x:5000/api';
```

#### 3. Запуск

```bash
cd medical_organizer

# Просмотр доступных устройств
flutter devices

# Запуск на устройстве/эмуляторе
flutter run

# Сборка APK для Android
flutter build apk --release
```

---

## API эндпоинты

### Аутентификация (публичные)
| Метод | URL | Тело |
|---|---|---|
| POST | `/api/auth/register` | `{ email, password, full_name, birth_date?, gender? }` |
| POST | `/api/auth/login`    | `{ email, password }` |

### Профиль пользователя (JWT)
| Метод | URL | Описание |
|---|---|---|
| GET    | `/api/user/me`           | Получить профиль |
| PUT    | `/api/user/me`           | Обновить ФИО / дату / пол |
| PUT    | `/api/user/me/password`  | Сменить пароль |
| DELETE | `/api/user/me`           | Удалить аккаунт |

### Родственники (JWT)
| Метод | URL | Описание |
|---|---|---|
| GET    | `/api/relatives`     | Список |
| POST   | `/api/relatives`     | Создать |
| PUT    | `/api/relatives/:id` | Обновить |
| DELETE | `/api/relatives/:id` | Удалить |

### Диагнозы (JWT)
| Метод | URL | Описание |
|---|---|---|
| GET    | `/api/diagnoses`     | Список (с именем родственника) |
| POST   | `/api/diagnoses`     | Создать |
| PUT    | `/api/diagnoses/:id` | Обновить |
| DELETE | `/api/diagnoses/:id` | Удалить |

### Аллергии (JWT)
| Метод | URL | Описание |
|---|---|---|
| GET    | `/api/allergies`     | Список |
| POST   | `/api/allergies`     | Создать |
| PUT    | `/api/allergies/:id` | Обновить |
| DELETE | `/api/allergies/:id` | Удалить |

### Экспорт (JWT)
| Метод | URL | Описание |
|---|---|---|
| GET | `/api/export/json` | Скачать все данные в JSON |
| GET | `/api/export/pdf`  | Скачать медицинский отчёт PDF |

---

## Функционал

### Веб-приложение
- Регистрация и авторизация (JWT, хэширование паролей bcrypt)
- Профиль пользователя: просмотр, редактирование, смена пароля, удаление аккаунта
- Управление родственниками: добавление, редактирование, удаление, поиск
- Медицинские карты:
  - Диагнозы с кодом МКБ-10, датой, хроничностью
  - Аллергии с аллергеном, реакцией и тяжестью
  - Привязка к конкретному родственнику или к себе
  - Фильтрация по родственнику / типу / тяжести / тексту
- Семейное дерево: SVG-визуализация с кликом на узел
- Экспорт данных: JSON и PDF
- Локализация: русский (RU) и кыргызский (KG)
- Offline-кэш: данные пользователя хранятся в localStorage

### Мобильное приложение (Flutter)
- Авторизация и регистрация через API сервера
- Токен хранится локально (shared_preferences)
- Просмотр и добавление родственников
- Добавление диагнозов и аллергий с привязкой к родственнику
- Provider для управления состоянием аутентификации
- Работает на Android и iOS

---

## Схема базы данных

```
users        id, email, password, full_name, birth_date, gender, created_at
relatives    id, user_id, full_name, birth_date, gender, relation_type,
             parent_relative_id, notes, created_at
diagnoses    id, user_id, relative_id, icd_code, title, description,
             diagnosed_at, is_chronic, created_at
allergies    id, user_id, relative_id, allergen, reaction, severity, created_at
```

`relative_id = NULL` — запись относится к самому пользователю.  
`parent_relative_id` — для построения семейного дерева.
