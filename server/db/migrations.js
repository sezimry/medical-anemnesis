const pool = require('./database');

async function runMigrations() {
  const client = await pool.connect();
  try {
    await client.query(`
      CREATE TABLE IF NOT EXISTS users (
        id          SERIAL PRIMARY KEY,
        email       TEXT    NOT NULL UNIQUE,
        password    TEXT    NOT NULL,
        full_name   TEXT    NOT NULL,
        birth_date  TEXT,
        gender      TEXT    CHECK(gender IN ('male','female','other')),
        role        TEXT    NOT NULL DEFAULT 'patient' CHECK(role IN ('patient','doctor')),
        created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `);

    // Если таблица уже существует — добавляем колонку role если её нет
    await client.query(`
      ALTER TABLE users ADD COLUMN IF NOT EXISTS
        role TEXT NOT NULL DEFAULT 'patient' CHECK(role IN ('patient','doctor'))
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS relatives (
        id                 SERIAL PRIMARY KEY,
        user_id            INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        full_name          TEXT    NOT NULL,
        birth_date         TEXT,
        gender             TEXT    CHECK(gender IN ('male','female','other')),
        relation_type      TEXT    NOT NULL,
        parent_relative_id INTEGER REFERENCES relatives(id) ON DELETE SET NULL,
        notes              TEXT,
        created_at         TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `);
    await client.query(`
      CREATE TABLE IF NOT EXISTS diagnoses (
        id           SERIAL PRIMARY KEY,
        user_id      INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        relative_id  INTEGER REFERENCES relatives(id) ON DELETE CASCADE,
        icd_code     TEXT,
        title        TEXT    NOT NULL,
        description  TEXT,
        diagnosed_at TEXT,
        is_chronic   SMALLINT NOT NULL DEFAULT 0 CHECK(is_chronic IN (0,1)),
        created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `);
    await client.query(`
      CREATE TABLE IF NOT EXISTS allergies (
        id          SERIAL PRIMARY KEY,
        user_id     INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        relative_id INTEGER REFERENCES relatives(id) ON DELETE CASCADE,
        allergen    TEXT    NOT NULL,
        reaction    TEXT,
        severity    TEXT    CHECK(severity IN ('mild','moderate','severe')),
        created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS treatment_courses (
        id           SERIAL PRIMARY KEY,
        user_id      INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        title        TEXT    NOT NULL,
        doctor_name  TEXT,
        institution  TEXT,
        prescribed_at TEXT,
        started_at   TEXT,
        ended_at     TEXT,
        prescription TEXT,
        notes        TEXT,
        is_active    SMALLINT NOT NULL DEFAULT 1 CHECK(is_active IN (0,1)),
        created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS medications (
        id          SERIAL PRIMARY KEY,
        course_id   INTEGER NOT NULL REFERENCES treatment_courses(id) ON DELETE CASCADE,
        user_id     INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        name        TEXT    NOT NULL,
        dosage      TEXT,
        frequency   TEXT,
        times       TEXT,
        duration    TEXT,
        conditions  TEXT,
        notes       TEXT,
        created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS reminders (
        id            SERIAL PRIMARY KEY,
        user_id       INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        medication_id INTEGER REFERENCES medications(id) ON DELETE CASCADE,
        course_id     INTEGER REFERENCES treatment_courses(id) ON DELETE CASCADE,
        title         TEXT NOT NULL,
        time          TEXT NOT NULL,
        days          TEXT,
        is_enabled    SMALLINT NOT NULL DEFAULT 1 CHECK(is_enabled IN (0,1)),
        created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS documents (
        id          SERIAL PRIMARY KEY,
        user_id     INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        title       TEXT NOT NULL,
        type        TEXT CHECK(type IN ('discharge','surgery','imaging','prescription','other')),
        doctor_name TEXT,
        institution TEXT,
        doc_date    TEXT,
        description TEXT,
        file_name   TEXT,
        file_path   TEXT,
        file_mime   TEXT,
        file_size   INTEGER,
        created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `);

    console.log('✓ Migrations completed');
  } finally {
    client.release();
  }
}

module.exports = { runMigrations };
