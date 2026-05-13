require('dotenv').config({ path: require('path').join(__dirname, '../.env') });

const pool   = require('./database');
const bcrypt = require('bcryptjs');
const { runMigrations } = require('./migrations');

async function seed() {
  await runMigrations();

  const client = await pool.connect();
  try {
    await client.query('DELETE FROM reminders');
    await client.query('DELETE FROM documents');
    await client.query('DELETE FROM medications');
    await client.query('DELETE FROM treatment_courses');
    await client.query('DELETE FROM allergies');
    await client.query('DELETE FROM diagnoses');
    await client.query('DELETE FROM relatives');
    await client.query('DELETE FROM users');
    await client.query('ALTER SEQUENCE users_id_seq RESTART WITH 1');
    await client.query('ALTER SEQUENCE relatives_id_seq RESTART WITH 1');
    await client.query('ALTER SEQUENCE diagnoses_id_seq RESTART WITH 1');
    await client.query('ALTER SEQUENCE allergies_id_seq RESTART WITH 1');
    await client.query('ALTER SEQUENCE treatment_courses_id_seq RESTART WITH 1');
    await client.query('ALTER SEQUENCE medications_id_seq RESTART WITH 1');
    await client.query('ALTER SEQUENCE reminders_id_seq RESTART WITH 1');
    await client.query('ALTER SEQUENCE documents_id_seq RESTART WITH 1');
    console.log('✓ Таблицы очищены');

    const PASSWORD = bcrypt.hashSync('demo123', 10);

    async function insertUser(email, full_name, birth_date, gender, role = 'patient') {
      const { rows } = await client.query(
        `INSERT INTO users (email, password, full_name, birth_date, gender, role)
         VALUES ($1,$2,$3,$4,$5,$6) RETURNING id`,
        [email, PASSWORD, full_name, birth_date, gender, role]
      );
      return rows[0].id;
    }

    async function insertRelative(user_id, full_name, birth_date, gender, relation_type, parent_id = null, notes = null) {
      const { rows } = await client.query(
        `INSERT INTO relatives (user_id, full_name, birth_date, gender, relation_type, parent_relative_id, notes)
         VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING id`,
        [user_id, full_name, birth_date, gender, relation_type, parent_id, notes]
      );
      return rows[0].id;
    }

    async function insertDiagnosis(user_id, relative_id, icd_code, title, description, diagnosed_at, is_chronic) {
      await client.query(
        `INSERT INTO diagnoses (user_id, relative_id, icd_code, title, description, diagnosed_at, is_chronic)
         VALUES ($1,$2,$3,$4,$5,$6,$7)`,
        [user_id, relative_id, icd_code, title, description, diagnosed_at, is_chronic ? 1 : 0]
      );
    }

    async function insertAllergy(user_id, relative_id, allergen, reaction, severity) {
      await client.query(
        `INSERT INTO allergies (user_id, relative_id, allergen, reaction, severity)
         VALUES ($1,$2,$3,$4,$5)`,
        [user_id, relative_id, allergen, reaction, severity]
      );
    }

    // ── Пользователь 1 — Иванов Алексей ──────────────────────────────────────
    const u1 = await insertUser('alexey@demo.com', 'Иванов Алексей Петрович', '1985-03-12', 'male');
    const u1_father  = await insertRelative(u1, 'Иванов Пётр Николаевич',   '1955-07-20', 'male',   'father',  null, 'Курильщик со стажем');
    const u1_mother  = await insertRelative(u1, 'Иванова Галина Фёдоровна', '1958-11-03', 'female', 'mother');
    const u1_brother = await insertRelative(u1, 'Иванов Сергей Петрович',   '1990-05-15', 'male',   'brother', u1_father);

    await insertDiagnosis(u1, null,      'I10', 'Эссенциальная гипертензия', 'АД периодически 150/90, принимает лозартан', '2021-04-10', 1);
    await insertDiagnosis(u1, null,      'E78', 'Гиперхолестеринемия',        'ЛПНП выше нормы, диета',                     '2022-09-01', 1);
    await insertDiagnosis(u1, u1_father, 'I25', 'Ишемическая болезнь сердца', 'Инфаркт 2010, стентирование',                '2010-06-15', 1);
    await insertDiagnosis(u1, u1_father, 'J44', 'ХОБЛ',                       'Вследствие курения',                         '2015-02-20', 1);
    await insertDiagnosis(u1, u1_mother, 'E11', 'Сахарный диабет 2 типа',     'Диета + метформин',                          '2018-03-05', 1);
    await insertDiagnosis(u1, u1_brother,'J45', 'Бронхиальная астма',         'Атопическая форма, сальбутамол',             '2019-11-22', 1);
    await insertAllergy(u1, null,       'Пенициллин',     'Крапивница, отёк',    'severe');
    await insertAllergy(u1, u1_mother,  'Пыльца берёзы',  'Ринит, слезотечение', 'moderate');
    await insertAllergy(u1, u1_brother, 'Кошачья шерсть', 'Приступ астмы',       'severe');
    console.log('✓ Пользователь 1: Иванов Алексей (alexey@demo.com)');

    // ── Пользователь 2 — Сейтова Айгуль ──────────────────────────────────────
    const u2 = await insertUser('aigul@demo.com', 'Сейтова Айгуль Маратовна', '1992-08-24', 'female');
    const u2_father      = await insertRelative(u2, 'Сейтов Марат Асанович',        '1960-04-10', 'male',   'father');
    const u2_mother      = await insertRelative(u2, 'Сейтова Зулайха Токтосуновна', '1963-12-01', 'female', 'mother');
    const u2_grandmother = await insertRelative(u2, 'Токтосунова Батма',             '1935-06-15', 'female', 'grandmother', u2_mother);
    const u2_sister      = await insertRelative(u2, 'Сейтова Нурзат Маратовна',     '1995-02-18', 'female', 'sister',      u2_father);

    await insertDiagnosis(u2, null,           'F32', 'Депрессивный эпизод',    'Лёгкой степени, психотерапия',       '2023-01-15', 0);
    await insertDiagnosis(u2, u2_mother,      'C50', 'Рак молочной железы',    'Стадия II, операция 2020, ремиссия', '2020-05-10', 0);
    await insertDiagnosis(u2, u2_grandmother, 'C18', 'Рак ободочной кишки',    'Поздняя стадия',                     '2005-09-30', 0);
    await insertDiagnosis(u2, u2_father,      'E10', 'Сахарный диабет 1 типа', 'Инсулинотерапия с 30 лет',           '1990-07-22', 1);
    await insertDiagnosis(u2, u2_sister,      'L20', 'Атопический дерматит',   'Сезонные обострения',                '2017-04-14', 1);
    await insertAllergy(u2, null,      'Клубника',      'Крапивница',       'mild');
    await insertAllergy(u2, null,      'Аспирин',       'Бронхоспазм',      'severe');
    await insertAllergy(u2, u2_sister, 'Домашняя пыль', 'Ринит, чихание',   'moderate');
    console.log('✓ Пользователь 2: Сейтова Айгуль (aigul@demo.com)');

    // ── Пользователь 3 — Петров Дмитрий ──────────────────────────────────────
    const u3 = await insertUser('dmitry@demo.com', 'Петров Дмитрий Владимирович', '1978-11-30', 'male');
    const u3_father      = await insertRelative(u3, 'Петров Владимир Иванович', '1950-08-05', 'male',   'father');
    const u3_mother      = await insertRelative(u3, 'Петрова Нина Степановна',  '1953-03-17', 'female', 'mother');
    const u3_grandfather = await insertRelative(u3, 'Петров Иван Семёнович',    '1922-01-10', 'male',   'grandfather', u3_father, 'Участник ВОВ');
    const u3_son         = await insertRelative(u3, 'Петров Никита Дмитриевич', '2010-06-22', 'male',   'son');

    await insertDiagnosis(u3, null,           'G43', 'Мигрень',                 '2–3 приступа в месяц с аурой',  '2005-06-01', 1);
    await insertDiagnosis(u3, null,           'M54', 'Дорсалгия',               'Поясничный остеохондроз',        '2018-10-12', 1);
    await insertDiagnosis(u3, u3_father,      'I63', 'Ишемический инсульт',     'Частичное восстановление',       '2019-03-08', 0);
    await insertDiagnosis(u3, u3_father,      'I10', 'Гипертоническая болезнь', 'АД 170/100, терапия 20 лет',    '2000-01-15', 1);
    await insertDiagnosis(u3, u3_grandfather, 'I21', 'Острый инфаркт миокарда', 'Перенёс дважды — 1975 и 1990',  '1975-05-20', 0);
    await insertDiagnosis(u3, u3_son,         'J06', 'Частые ОРВИ',             'Более 6 эпизодов в год',        '2023-09-01', 0);
    await insertAllergy(u3, null,      'Ибупрофен',  'Боли в желудке, тошнота', 'moderate');
    await insertAllergy(u3, u3_mother, 'Мёд',        'Отёк губ',                'moderate');
    await insertAllergy(u3, u3_son,    'Цитрусовые', 'Сыпь на коже',            'mild');
    console.log('✓ Пользователь 3: Петров Дмитрий (dmitry@demo.com)');

    // ── Врач ──────────────────────────────────────────────────────────────────
    await insertUser('doctor@demo.com', 'Смирнова Елена Владимировна', '1975-05-18', 'female', 'doctor');
    console.log('✓ Врач: Смирнова Елена (doctor@demo.com)');

    // ── Вспомогательные функции для новых таблиц ──────────────────────────────
    async function insertCourse(user_id, title, doctor_name, institution, prescribed_at, started_at, ended_at, prescription, notes, is_active = 1) {
      const { rows } = await client.query(
        `INSERT INTO treatment_courses (user_id, title, doctor_name, institution, prescribed_at, started_at, ended_at, prescription, notes, is_active)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10) RETURNING id`,
        [user_id, title, doctor_name, institution, prescribed_at, started_at, ended_at, prescription, notes, is_active]
      );
      return rows[0].id;
    }

    async function insertMedication(course_id, user_id, name, dosage, frequency, times, duration, conditions) {
      const { rows } = await client.query(
        `INSERT INTO medications (course_id, user_id, name, dosage, frequency, times, duration, conditions)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8) RETURNING id`,
        [course_id, user_id, name, dosage, frequency, times, duration, conditions]
      );
      return rows[0].id;
    }

    async function insertReminder(user_id, medication_id, course_id, title, time, days) {
      await client.query(
        `INSERT INTO reminders (user_id, medication_id, course_id, title, time, days, is_enabled)
         VALUES ($1,$2,$3,$4,$5,$6,1)`,
        [user_id, medication_id, course_id, title, time, days]
      );
    }

    async function insertDocument(user_id, title, type, doctor_name, institution, doc_date, description) {
      await client.query(
        `INSERT INTO documents (user_id, title, type, doctor_name, institution, doc_date, description)
         VALUES ($1,$2,$3,$4,$5,$6,$7)`,
        [user_id, title, type, doctor_name, institution, doc_date, description]
      );
    }

    // ════════════════════════════════════════════════════════════════════════════
    // КУРСЫ ЛЕЧЕНИЯ — Пользователь 1 (Иванов Алексей)
    // ════════════════════════════════════════════════════════════════════════════
    const u1_id = 1;
    const c1 = await insertCourse(u1_id,
      'Лечение гипертонии',
      'Петрова Анна Сергеевна',
      'Городская клиническая больница №1',
      '2024-01-10', '2024-01-15', null,
      'Лозартан 50 мг утром, контроль АД 2 раза в день',
      'Снизить давление до 130/80. Ограничить соль.',
      1
    );
    const m1_1 = await insertMedication(c1, u1_id, 'Лозартан', '50 мг', '1 раз в день', '08:00', 'Постоянно', 'После еды');
    const m1_2 = await insertMedication(c1, u1_id, 'Амлодипин', '5 мг', '1 раз в день', '20:00', 'Постоянно', 'Независимо от еды');
    await insertReminder(u1_id, m1_1, c1, 'Лозартан утром', '08:00', '1,2,3,4,5,6,7');
    await insertReminder(u1_id, m1_2, c1, 'Амлодипин вечером', '20:00', '1,2,3,4,5,6,7');

    const c2 = await insertCourse(u1_id,
      'Снижение холестерина',
      'Козлов Виктор Иванович',
      'Кардиологический центр',
      '2024-03-05', '2024-03-10', '2024-09-10',
      'Аторвастатин 20 мг на ночь. Диета с ограничением жиров.',
      'Контроль липидного профиля через 3 месяца.',
      1
    );
    const m2_1 = await insertMedication(c2, u1_id, 'Аторвастатин', '20 мг', '1 раз в день', '22:00', '6 месяцев', 'На ночь');
    await insertReminder(u1_id, m2_1, c2, 'Аторвастатин на ночь', '22:00', '1,2,3,4,5,6,7');

    await insertDocument(u1_id, 'Выписка кардиолога 2024', 'discharge', 'Козлов В.И.', 'Кардиологический центр', '2024-03-05', 'Диагноз: гипертоническая болезнь II стадии. Рекомендована медикаментозная терапия.');
    await insertDocument(u1_id, 'ЭКГ от 15.01.2024', 'imaging', 'Морозова Т.А.', 'Городская клиническая больница №1', '2024-01-15', 'Синусовый ритм, ЧСС 72 уд/мин. Патологии не выявлено.');
    await insertDocument(u1_id, 'Назначение лозартана', 'prescription', 'Петрова А.С.', 'Городская клиническая больница №1', '2024-01-10', 'Лозартан 50 мг/сут длительно.');
    console.log('✓ Курсы и документы: Иванов Алексей');

    // ════════════════════════════════════════════════════════════════════════════
    // КУРСЫ ЛЕЧЕНИЯ — Пользователь 2 (Сейтова Айгуль)
    // ════════════════════════════════════════════════════════════════════════════
    const u2_id = 2;
    const c3 = await insertCourse(u2_id,
      'Психотерапия и антидепрессанты',
      'Джаксыбекова Зарина Маратовна',
      'Республиканский центр психического здоровья',
      '2023-01-10', '2023-01-20', '2023-07-20',
      'Сертралин 50 мг утром. Еженедельные сессии психотерапии.',
      'Постепенная отмена после 6 месяцев под контролем врача.',
      0
    );
    const m3_1 = await insertMedication(c3, u2_id, 'Сертралин', '50 мг', '1 раз в день', '09:00', '6 месяцев', 'Утром с едой');

    const c4 = await insertCourse(u2_id,
      'Витаминная терапия',
      'Алибекова Гульнара Сериковна',
      'Медицинский центр "Здоровье"',
      '2024-02-01', '2024-02-05', '2024-05-05',
      'Витамин D3 2000 МЕ/день, Омега-3 1000 мг/день.',
      'Приём курсами по 3 месяца с перерывом 1 месяц.',
      1
    );
    const m4_1 = await insertMedication(c4, u2_id, 'Витамин D3', '2000 МЕ', '1 раз в день', '09:00', '3 месяца', 'Во время еды');
    const m4_2 = await insertMedication(c4, u2_id, 'Омега-3', '1000 мг', '1 раз в день', '13:00', '3 месяца', 'Во время еды');
    await insertReminder(u2_id, m4_1, c4, 'Витамин D утром', '09:00', '1,2,3,4,5,6,7');
    await insertReminder(u2_id, m4_2, c4, 'Омега-3 в обед', '13:00', '1,2,3,4,5');

    await insertDocument(u2_id, 'МРТ головного мозга', 'imaging', 'Сатыбалдиев А.К.', 'Диагностический центр', '2023-06-15', 'Патологических изменений не выявлено. Норма.');
    await insertDocument(u2_id, 'Выписка онколога (мать)', 'discharge', 'Нурланова Б.О.', 'Онкологический диспансер', '2020-08-10', 'Рак молочной железы стадия II. После операции — ремиссия.');
    await insertDocument(u2_id, 'Анализ крови 2024', 'imaging', 'Лаборатория', 'Медицинский центр "Здоровье"', '2024-02-01', 'Общий анализ в норме. Витамин D — дефицит.');
    console.log('✓ Курсы и документы: Сейтова Айгуль');

    // ════════════════════════════════════════════════════════════════════════════
    // КУРСЫ ЛЕЧЕНИЯ — Пользователь 3 (Петров Дмитрий)
    // ════════════════════════════════════════════════════════════════════════════
    const u3_id = 3;
    const c5 = await insertCourse(u3_id,
      'Лечение мигрени',
      'Соколова Ирина Николаевна',
      'Неврологическая клиника',
      '2024-04-01', '2024-04-05', null,
      'Суматриптан 50 мг при приступе. Топирамат 25 мг для профилактики.',
      'При частоте приступов более 4 в месяц — профилактический курс.',
      1
    );
    const m5_1 = await insertMedication(c5, u3_id, 'Суматриптан', '50 мг', 'При приступе', 'По необходимости', 'По необходимости', 'При первых признаках мигрени');
    const m5_2 = await insertMedication(c5, u3_id, 'Топирамат', '25 мг', '1 раз в день', '21:00', '3 месяца', 'На ночь, не разжёвывать');
    await insertReminder(u3_id, m5_2, c5, 'Топирамат на ночь', '21:00', '1,2,3,4,5,6,7');

    const c6 = await insertCourse(u3_id,
      'Реабилитация спины',
      'Захаров Павел Андреевич',
      'Центр реабилитации',
      '2024-05-10', '2024-05-15', '2024-08-15',
      'ЛФК ежедневно, мовалис 7.5 мг при болях.',
      'Избегать поднятия тяжестей. Плавание 2 раза в неделю.',
      1
    );
    const m6_1 = await insertMedication(c6, u3_id, 'Мовалис', '7.5 мг', 'При болях', 'По необходимости', '5 дней максимум', 'После еды');
    const m6_2 = await insertMedication(c6, u3_id, 'Мильгамма', '1 амп', '1 раз в день', '10:00', '10 дней', 'В/м инъекция');
    await insertReminder(u3_id, m6_2, c6, 'Мильгамма (инъекция)', '10:00', '1,2,3,4,5');

    await insertDocument(u3_id, 'МРТ поясничного отдела', 'imaging', 'Захаров П.А.', 'Центр реабилитации', '2024-05-10', 'Остеохондроз L4-L5. Протрузия диска 4 мм. Рекомендована реабилитация.');
    await insertDocument(u3_id, 'Выписка невролога', 'discharge', 'Соколова И.Н.', 'Неврологическая клиника', '2024-04-01', 'Мигрень с аурой. Частота 3-4 приступа в месяц. Назначена профилактическая терапия.');
    await insertDocument(u3_id, 'КТ головного мозга 2019', 'imaging', 'Белов С.А.', 'Городская больница', '2019-03-15', 'После инсульта отца. Наследственный риск. Патологий не выявлено.');
    console.log('✓ Курсы и документы: Петров Дмитрий');

    const counts = await Promise.all([
      client.query('SELECT COUNT(*) as c FROM users'),
      client.query('SELECT COUNT(*) as c FROM relatives'),
      client.query('SELECT COUNT(*) as c FROM diagnoses'),
      client.query('SELECT COUNT(*) as c FROM allergies'),
      client.query('SELECT COUNT(*) as c FROM treatment_courses'),
      client.query('SELECT COUNT(*) as c FROM medications'),
      client.query('SELECT COUNT(*) as c FROM reminders'),
      client.query('SELECT COUNT(*) as c FROM documents'),
    ]);
    console.log('\n✓ Seed завершён:');
    console.log(`  Пользователей:   ${counts[0].rows[0].c}`);
    console.log(`  Родственников:   ${counts[1].rows[0].c}`);
    console.log(`  Диагнозов:       ${counts[2].rows[0].c}`);
    console.log(`  Аллергий:        ${counts[3].rows[0].c}`);
    console.log(`  Курсов лечения:  ${counts[4].rows[0].c}`);
    console.log(`  Лекарств:        ${counts[5].rows[0].c}`);
    console.log(`  Напоминаний:     ${counts[6].rows[0].c}`);
    console.log(`  Документов:      ${counts[7].rows[0].c}`);
    console.log('\n  Пароль для всех аккаунтов: demo123');
  } finally {
    client.release();
    await pool.end();
  }
}

seed().catch(err => {
  console.error('Seed failed:', err.message);
  process.exit(1);
});
