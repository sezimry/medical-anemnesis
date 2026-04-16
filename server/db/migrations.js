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
        created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
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
    console.log('✓ Migrations completed');
  } finally {
    client.release();
  }
}

module.exports = { runMigrations };
