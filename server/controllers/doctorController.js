const pool = require('../db/database');

// GET /api/doctor/patients — все пациенты
async function getPatients(req, res) {
  try {
    const { rows } = await pool.query(
      `SELECT id, email, full_name, birth_date, gender, created_at
       FROM users WHERE role = 'patient' ORDER BY full_name ASC`
    );
    res.json(rows);
  } catch (err) {
    console.error('getPatients error:', err);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
}

// GET /api/doctor/patients/:id — данные конкретного пациента
async function getPatient(req, res) {
  const { id } = req.params;
  try {
    const { rows: [user] } = await pool.query(
      `SELECT id, email, full_name, birth_date, gender, created_at
       FROM users WHERE id = $1 AND role = 'patient'`,
      [id]
    );
    if (!user) return res.status(404).json({ error: 'Пациент не найден' });

    const { rows: relatives } = await pool.query(
      'SELECT * FROM relatives WHERE user_id = $1 ORDER BY created_at ASC', [id]
    );
    const { rows: diagnoses } = await pool.query(
      `SELECT d.*, r.full_name AS relative_name, r.relation_type
       FROM diagnoses d LEFT JOIN relatives r ON d.relative_id = r.id
       WHERE d.user_id = $1 ORDER BY d.diagnosed_at DESC NULLS LAST, d.created_at DESC`,
      [id]
    );
    const { rows: allergies } = await pool.query(
      `SELECT a.*, r.full_name AS relative_name, r.relation_type
       FROM allergies a LEFT JOIN relatives r ON a.relative_id = r.id
       WHERE a.user_id = $1 ORDER BY a.created_at DESC`,
      [id]
    );

    res.json({ user, relatives, diagnoses, allergies });
  } catch (err) {
    console.error('getPatient error:', err);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
}

// POST /api/doctor/patients/:id/diagnoses — добавить диагноз пациенту
async function addDiagnosis(req, res) {
  const patientId = req.params.id;
  const { relative_id, icd_code, title, description, diagnosed_at, is_chronic } = req.body;
  if (!title) return res.status(400).json({ error: 'Название диагноза обязательно' });

  try {
    const { rows: [patient] } = await pool.query(
      `SELECT id FROM users WHERE id = $1 AND role = 'patient'`, [patientId]
    );
    if (!patient) return res.status(404).json({ error: 'Пациент не найден' });

    const { rows: [diag] } = await pool.query(
      `INSERT INTO diagnoses (user_id, relative_id, icd_code, title, description, diagnosed_at, is_chronic)
       VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING *`,
      [patientId, relative_id || null, icd_code || null, title,
       description || null, diagnosed_at || null, is_chronic ? 1 : 0]
    );
    res.status(201).json(diag);
  } catch (err) {
    console.error('addDiagnosis error:', err);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
}

// POST /api/doctor/patients/:id/allergies — добавить аллергию пациенту
async function addAllergy(req, res) {
  const patientId = req.params.id;
  const { relative_id, allergen, reaction, severity } = req.body;
  if (!allergen) return res.status(400).json({ error: 'Аллерген обязателен' });

  try {
    const { rows: [patient] } = await pool.query(
      `SELECT id FROM users WHERE id = $1 AND role = 'patient'`, [patientId]
    );
    if (!patient) return res.status(404).json({ error: 'Пациент не найден' });

    const { rows: [allergy] } = await pool.query(
      `INSERT INTO allergies (user_id, relative_id, allergen, reaction, severity)
       VALUES ($1,$2,$3,$4,$5) RETURNING *`,
      [patientId, relative_id || null, allergen, reaction || null, severity || null]
    );
    res.status(201).json(allergy);
  } catch (err) {
    console.error('addAllergy error:', err);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
}

// DELETE /api/doctor/patients/:id/diagnoses/:diagId
async function deleteDiagnosis(req, res) {
  const { id: patientId, diagId } = req.params;
  try {
    await pool.query('DELETE FROM diagnoses WHERE id=$1 AND user_id=$2', [diagId, patientId]);
    res.json({ message: 'Удалено' });
  } catch (err) {
    res.status(500).json({ error: 'Ошибка сервера' });
  }
}

// DELETE /api/doctor/patients/:id/allergies/:allergId
async function deleteAllergy(req, res) {
  const { id: patientId, allergId } = req.params;
  try {
    await pool.query('DELETE FROM allergies WHERE id=$1 AND user_id=$2', [allergId, patientId]);
    res.json({ message: 'Удалено' });
  } catch (err) {
    res.status(500).json({ error: 'Ошибка сервера' });
  }
}

module.exports = { getPatients, getPatient, addDiagnosis, addAllergy, deleteDiagnosis, deleteAllergy };
