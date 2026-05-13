const pool = require('../db/database');

// ── Курсы лечения ─────────────────────────────────────────────────────────────

async function getAll(req, res) {
  try {
    const { rows } = await pool.query(
      `SELECT c.*, COUNT(m.id)::int AS medications_count
       FROM treatment_courses c
       LEFT JOIN medications m ON m.course_id = c.id
       WHERE c.user_id = $1
       GROUP BY c.id
       ORDER BY c.created_at DESC`,
      [req.userId]
    );
    res.json(rows);
  } catch (err) {
    console.error('courses getAll:', err);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
}

async function getOne(req, res) {
  try {
    const { rows: [course] } = await pool.query(
      'SELECT * FROM treatment_courses WHERE id=$1 AND user_id=$2',
      [req.params.id, req.userId]
    );
    if (!course) return res.status(404).json({ error: 'Курс не найден' });

    const { rows: medications } = await pool.query(
      'SELECT * FROM medications WHERE course_id=$1 ORDER BY created_at ASC',
      [req.params.id]
    );
    res.json({ ...course, medications });
  } catch (err) {
    console.error('courses getOne:', err);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
}

async function create(req, res) {
  const { title, doctor_name, institution, prescribed_at, started_at, ended_at, prescription, notes } = req.body;
  if (!title) return res.status(400).json({ error: 'Название курса обязательно' });
  try {
    const { rows: [course] } = await pool.query(
      `INSERT INTO treatment_courses
         (user_id, title, doctor_name, institution, prescribed_at, started_at, ended_at, prescription, notes)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9) RETURNING *`,
      [req.userId, title, doctor_name||null, institution||null, prescribed_at||null,
       started_at||null, ended_at||null, prescription||null, notes||null]
    );
    res.status(201).json(course);
  } catch (err) {
    console.error('courses create:', err);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
}

async function update(req, res) {
  const { title, doctor_name, institution, prescribed_at, started_at, ended_at, prescription, notes, is_active } = req.body;
  if (!title) return res.status(400).json({ error: 'Название курса обязательно' });
  try {
    const { rowCount, rows: [course] } = await pool.query(
      `UPDATE treatment_courses
       SET title=$1, doctor_name=$2, institution=$3, prescribed_at=$4,
           started_at=$5, ended_at=$6, prescription=$7, notes=$8, is_active=$9
       WHERE id=$10 AND user_id=$11 RETURNING *`,
      [title, doctor_name||null, institution||null, prescribed_at||null,
       started_at||null, ended_at||null, prescription||null, notes||null,
       is_active ?? 1, req.params.id, req.userId]
    );
    if (rowCount === 0) return res.status(404).json({ error: 'Курс не найден' });
    res.json(course);
  } catch (err) {
    console.error('courses update:', err);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
}

async function remove(req, res) {
  try {
    const { rowCount } = await pool.query(
      'DELETE FROM treatment_courses WHERE id=$1 AND user_id=$2',
      [req.params.id, req.userId]
    );
    if (rowCount === 0) return res.status(404).json({ error: 'Курс не найден' });
    res.json({ message: 'Удалено' });
  } catch (err) {
    console.error('courses remove:', err);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
}

// ── Лекарства ─────────────────────────────────────────────────────────────────

async function getMedications(req, res) {
  try {
    const { rows } = await pool.query(
      'SELECT * FROM medications WHERE course_id=$1 AND user_id=$2 ORDER BY created_at ASC',
      [req.params.id, req.userId]
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: 'Ошибка сервера' });
  }
}

async function createMedication(req, res) {
  const { name, dosage, frequency, times, duration, conditions, notes } = req.body;
  if (!name) return res.status(400).json({ error: 'Название препарата обязательно' });
  try {
    const { rows: [course] } = await pool.query(
      'SELECT id FROM treatment_courses WHERE id=$1 AND user_id=$2',
      [req.params.id, req.userId]
    );
    if (!course) return res.status(404).json({ error: 'Курс не найден' });

    const { rows: [med] } = await pool.query(
      `INSERT INTO medications (course_id, user_id, name, dosage, frequency, times, duration, conditions, notes)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9) RETURNING *`,
      [req.params.id, req.userId, name, dosage||null, frequency||null,
       times||null, duration||null, conditions||null, notes||null]
    );
    res.status(201).json(med);
  } catch (err) {
    console.error('medication create:', err);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
}

async function updateMedication(req, res) {
  const { name, dosage, frequency, times, duration, conditions, notes } = req.body;
  if (!name) return res.status(400).json({ error: 'Название препарата обязательно' });
  try {
    const { rowCount, rows: [med] } = await pool.query(
      `UPDATE medications SET name=$1, dosage=$2, frequency=$3, times=$4, duration=$5, conditions=$6, notes=$7
       WHERE id=$8 AND course_id=$9 AND user_id=$10 RETURNING *`,
      [name, dosage||null, frequency||null, times||null, duration||null,
       conditions||null, notes||null, req.params.medId, req.params.id, req.userId]
    );
    if (rowCount === 0) return res.status(404).json({ error: 'Лекарство не найдено' });
    res.json(med);
  } catch (err) {
    res.status(500).json({ error: 'Ошибка сервера' });
  }
}

async function removeMedication(req, res) {
  try {
    const { rowCount } = await pool.query(
      'DELETE FROM medications WHERE id=$1 AND course_id=$2 AND user_id=$3',
      [req.params.medId, req.params.id, req.userId]
    );
    if (rowCount === 0) return res.status(404).json({ error: 'Лекарство не найдено' });
    res.json({ message: 'Удалено' });
  } catch (err) {
    res.status(500).json({ error: 'Ошибка сервера' });
  }
}

module.exports = { getAll, getOne, create, update, remove, getMedications, createMedication, updateMedication, removeMedication };
