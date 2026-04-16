const express = require('express');
const router  = express.Router();
const auth    = require('../middleware/auth');
const pool    = require('../db/database');
const { generatePdf } = require('../utils/exportPdf');

router.use(auth);

router.get('/json', async (req, res) => {
  const userId = req.userId;
  try {
    const { rows: [user] } = await pool.query(
      'SELECT id, email, full_name, birth_date, gender, created_at FROM users WHERE id = $1', [userId]
    );
    const { rows: relatives } = await pool.query(
      'SELECT * FROM relatives WHERE user_id=$1 ORDER BY created_at ASC', [userId]
    );
    const { rows: diagnoses } = await pool.query(`
      SELECT d.*, r.full_name AS relative_name
      FROM diagnoses d LEFT JOIN relatives r ON d.relative_id = r.id
      WHERE d.user_id=$1 ORDER BY d.diagnosed_at DESC NULLS LAST, d.created_at DESC
    `, [userId]);
    const { rows: allergies } = await pool.query(`
      SELECT a.*, r.full_name AS relative_name
      FROM allergies a LEFT JOIN relatives r ON a.relative_id = r.id
      WHERE a.user_id=$1 ORDER BY a.created_at DESC
    `, [userId]);

    res.setHeader('Content-Disposition', `attachment; filename="medical_data_${userId}.json"`);
    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    res.json({ exported_at: new Date().toISOString(), user, relatives, diagnoses, allergies });
  } catch (err) {
    console.error('JSON export error:', err);
    res.status(500).json({ error: 'Ошибка экспорта' });
  }
});

router.get('/pdf', async (req, res) => {
  const userId = req.userId;
  try {
    const { rows: [user] } = await pool.query(
      'SELECT id, email, full_name, birth_date, gender FROM users WHERE id = $1', [userId]
    );
    const { rows: relatives } = await pool.query(
      'SELECT * FROM relatives WHERE user_id=$1 ORDER BY created_at ASC', [userId]
    );
    const { rows: diagnoses } = await pool.query(`
      SELECT d.*, r.full_name AS relative_name
      FROM diagnoses d LEFT JOIN relatives r ON d.relative_id = r.id
      WHERE d.user_id=$1 ORDER BY d.diagnosed_at DESC NULLS LAST, d.created_at DESC
    `, [userId]);
    const { rows: allergies } = await pool.query(`
      SELECT a.*, r.full_name AS relative_name
      FROM allergies a LEFT JOIN relatives r ON a.relative_id = r.id
      WHERE a.user_id=$1 ORDER BY a.created_at DESC
    `, [userId]);

    const pdfBuffer = await generatePdf({ user, relatives, diagnoses, allergies });
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="medical_report_${userId}.pdf"`);
    res.send(pdfBuffer);
  } catch (err) {
    console.error('PDF generation error:', err);
    res.status(500).json({ error: 'Ошибка генерации PDF' });
  }
});

module.exports = router;
