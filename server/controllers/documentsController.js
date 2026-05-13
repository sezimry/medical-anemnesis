const pool = require('../db/database');
const fs   = require('fs');
const path = require('path');

const TYPE_LABELS = {
  discharge:    'Выписка из больницы',
  surgery:      'Выписка после операции',
  imaging:      'Лучевое обследование',
  prescription: 'Назначение врача',
  other:        'Другое',
};

async function getAll(req, res) {
  try {
    const { type } = req.query;
    let query = `SELECT * FROM documents WHERE user_id=$1`;
    const params = [req.userId];
    if (type) { query += ` AND type=$2`; params.push(type); }
    query += ` ORDER BY created_at DESC`;

    const { rows } = await pool.query(query, params);
    res.json(rows);
  } catch (err) {
    console.error('docs getAll:', err);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
}

async function getOne(req, res) {
  try {
    const { rows: [doc] } = await pool.query(
      'SELECT * FROM documents WHERE id=$1 AND user_id=$2',
      [req.params.id, req.userId]
    );
    if (!doc) return res.status(404).json({ error: 'Документ не найден' });
    res.json(doc);
  } catch (err) {
    res.status(500).json({ error: 'Ошибка сервера' });
  }
}

async function create(req, res) {
  const { title, type, doctor_name, institution, doc_date, description } = req.body;
  if (!title) return res.status(400).json({ error: 'Название обязательно' });

  let file_name = null, file_path_db = null, file_mime = null, file_size = null;

  if (req.file) {
    file_name    = req.file.originalname;
    file_path_db = req.file.filename;
    file_mime    = req.file.mimetype;
    file_size    = req.file.size;
  }

  try {
    const { rows: [doc] } = await pool.query(
      `INSERT INTO documents
         (user_id, title, type, doctor_name, institution, doc_date, description, file_name, file_path, file_mime, file_size)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11) RETURNING *`,
      [req.userId, title, type||'other', doctor_name||null, institution||null,
       doc_date||null, description||null, file_name, file_path_db, file_mime, file_size]
    );
    res.status(201).json(doc);
  } catch (err) {
    console.error('docs create:', err);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
}

async function update(req, res) {
  const { title, type, doctor_name, institution, doc_date, description } = req.body;
  if (!title) return res.status(400).json({ error: 'Название обязательно' });

  try {
    const { rows: [existing] } = await pool.query(
      'SELECT * FROM documents WHERE id=$1 AND user_id=$2',
      [req.params.id, req.userId]
    );
    if (!existing) return res.status(404).json({ error: 'Документ не найден' });

    let file_name    = existing.file_name;
    let file_path_db = existing.file_path;
    let file_mime    = existing.file_mime;
    let file_size    = existing.file_size;

    if (req.file) {
      // Удаляем старый файл
      if (existing.file_path) {
        const oldPath = path.join(__dirname, '../uploads', existing.file_path);
        if (fs.existsSync(oldPath)) fs.unlinkSync(oldPath);
      }
      file_name    = req.file.originalname;
      file_path_db = req.file.filename;
      file_mime    = req.file.mimetype;
      file_size    = req.file.size;
    }

    const { rows: [doc] } = await pool.query(
      `UPDATE documents
       SET title=$1, type=$2, doctor_name=$3, institution=$4, doc_date=$5,
           description=$6, file_name=$7, file_path=$8, file_mime=$9, file_size=$10
       WHERE id=$11 AND user_id=$12 RETURNING *`,
      [title, type||'other', doctor_name||null, institution||null, doc_date||null,
       description||null, file_name, file_path_db, file_mime, file_size, req.params.id, req.userId]
    );
    res.json(doc);
  } catch (err) {
    console.error('docs update:', err);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
}

async function remove(req, res) {
  try {
    const { rows: [doc] } = await pool.query(
      'SELECT * FROM documents WHERE id=$1 AND user_id=$2',
      [req.params.id, req.userId]
    );
    if (!doc) return res.status(404).json({ error: 'Документ не найден' });

    if (doc.file_path) {
      const filePath = path.join(__dirname, '../uploads', doc.file_path);
      if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
    }

    await pool.query('DELETE FROM documents WHERE id=$1 AND user_id=$2', [req.params.id, req.userId]);
    res.json({ message: 'Удалено' });
  } catch (err) {
    console.error('docs remove:', err);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
}

// Скачать/просмотреть файл
async function serveFile(req, res) {
  try {
    const { rows: [doc] } = await pool.query(
      'SELECT * FROM documents WHERE id=$1 AND user_id=$2',
      [req.params.id, req.userId]
    );
    if (!doc || !doc.file_path) return res.status(404).json({ error: 'Файл не найден' });

    const filePath = path.join(__dirname, '../uploads', doc.file_path);
    if (!fs.existsSync(filePath)) return res.status(404).json({ error: 'Файл не найден на сервере' });

    res.setHeader('Content-Type', doc.file_mime || 'application/octet-stream');
    res.setHeader('Content-Disposition', `inline; filename="${doc.file_name}"`);
    res.sendFile(filePath);
  } catch (err) {
    res.status(500).json({ error: 'Ошибка сервера' });
  }
}

module.exports = { getAll, getOne, create, update, remove, serveFile };
