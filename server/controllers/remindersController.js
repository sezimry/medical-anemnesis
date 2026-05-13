const pool = require('../db/database');

async function getAll(req, res) {
  try {
    const { rows } = await pool.query(
      `SELECT r.*, m.name AS medication_name, c.title AS course_title
       FROM reminders r
       LEFT JOIN medications m ON r.medication_id = m.id
       LEFT JOIN treatment_courses c ON r.course_id = c.id
       WHERE r.user_id = $1
       ORDER BY r.time ASC`,
      [req.userId]
    );
    res.json(rows);
  } catch (err) {
    console.error('reminders getAll:', err);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
}

async function create(req, res) {
  const { medication_id, course_id, title, time, days } = req.body;
  if (!title) return res.status(400).json({ error: 'Название обязательно' });
  if (!time)  return res.status(400).json({ error: 'Время обязательно' });
  try {
    const { rows: [reminder] } = await pool.query(
      `INSERT INTO reminders (user_id, medication_id, course_id, title, time, days)
       VALUES ($1,$2,$3,$4,$5,$6) RETURNING *`,
      [req.userId, medication_id||null, course_id||null, title, time, days||null]
    );
    res.status(201).json(reminder);
  } catch (err) {
    console.error('reminders create:', err);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
}

async function update(req, res) {
  const { title, time, days, is_enabled } = req.body;
  if (!title) return res.status(400).json({ error: 'Название обязательно' });
  if (!time)  return res.status(400).json({ error: 'Время обязательно' });
  try {
    const { rowCount, rows: [reminder] } = await pool.query(
      `UPDATE reminders SET title=$1, time=$2, days=$3, is_enabled=$4
       WHERE id=$5 AND user_id=$6 RETURNING *`,
      [title, time, days||null, is_enabled ?? 1, req.params.id, req.userId]
    );
    if (rowCount === 0) return res.status(404).json({ error: 'Напоминание не найдено' });
    res.json(reminder);
  } catch (err) {
    console.error('reminders update:', err);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
}

async function toggle(req, res) {
  try {
    const { rows: [current] } = await pool.query(
      'SELECT is_enabled FROM reminders WHERE id=$1 AND user_id=$2',
      [req.params.id, req.userId]
    );
    if (!current) return res.status(404).json({ error: 'Напоминание не найдено' });

    const { rows: [reminder] } = await pool.query(
      'UPDATE reminders SET is_enabled=$1 WHERE id=$2 AND user_id=$3 RETURNING *',
      [current.is_enabled ? 0 : 1, req.params.id, req.userId]
    );
    res.json(reminder);
  } catch (err) {
    console.error('reminders toggle:', err);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
}

async function remove(req, res) {
  try {
    const { rowCount } = await pool.query(
      'DELETE FROM reminders WHERE id=$1 AND user_id=$2',
      [req.params.id, req.userId]
    );
    if (rowCount === 0) return res.status(404).json({ error: 'Напоминание не найдено' });
    res.json({ message: 'Удалено' });
  } catch (err) {
    console.error('reminders remove:', err);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
}

module.exports = { getAll, create, update, toggle, remove };
