require('dotenv').config({ path: require('path').join(__dirname, '../.env') });

const pool   = require('./database');
const bcrypt = require('bcryptjs');
const { runMigrations } = require('./migrations');

async function seed() {
  await runMigrations();

  const client = await pool.connect();
  try {
    await client.query('DELETE FROM allergies');
    await client.query('DELETE FROM diagnoses');
    await client.query('DELETE FROM relatives');
    await client.query('DELETE FROM users');
    await client.query('ALTER SEQUENCE users_id_seq RESTART WITH 1');
    await client.query('ALTER SEQUENCE relatives_id_seq RESTART WITH 1');
    await client.query('ALTER SEQUENCE diagnoses_id_seq RESTART WITH 1');
    await client.query('ALTER SEQUENCE allergies_id_seq RESTART WITH 1');
    console.log('✓ Таблицы очищены');

    const PASSWORD = bcrypt.hashSync('demo123', 10);

    async function insertUser(email, full_name, birth_date, gender) {
      const { rows } = await client.query(
        `INSERT INTO users (email, password, full_name, birth_date, gender)
         VALUES ($1,$2,$3,$4,$5) RETURNING id`,
        [email, PASSWORD, full_name, birth_date, gender]
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

    const counts = await Promise.all([
      client.query('SELECT COUNT(*) as c FROM users'),
      client.query('SELECT COUNT(*) as c FROM relatives'),
      client.query('SELECT COUNT(*) as c FROM diagnoses'),
      client.query('SELECT COUNT(*) as c FROM allergies'),
    ]);
    console.log('\n✓ Seed завершён:');
    console.log(`  Пользователей: ${counts[0].rows[0].c}`);
    console.log(`  Родственников: ${counts[1].rows[0].c}`);
    console.log(`  Диагнозов:     ${counts[2].rows[0].c}`);
    console.log(`  Аллергий:      ${counts[3].rows[0].c}`);
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
