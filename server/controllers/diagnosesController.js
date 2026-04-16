const Diagnosis = require('../models/Diagnosis');

async function getAll(req, res) {
  try {
    res.json(await Diagnosis.findAll(req.userId));
  } catch (err) {
    res.status(500).json({ error: 'Ошибка сервера' });
  }
}

async function getOne(req, res) {
  try {
    const d = await Diagnosis.findOne(req.params.id, req.userId);
    if (!d) return res.status(404).json({ error: 'Диагноз не найден' });
    res.json(d);
  } catch (err) {
    res.status(500).json({ error: 'Ошибка сервера' });
  }
}

async function create(req, res) {
  const { relative_id, icd_code, title, description, diagnosed_at, is_chronic } = req.body;
  if (!title) return res.status(400).json({ error: 'Название диагноза обязательно' });
  try {
    const id = await Diagnosis.create({ user_id: req.userId, relative_id, icd_code, title, description, diagnosed_at, is_chronic });
    res.status(201).json(await Diagnosis.findOne(id, req.userId));
  } catch (err) {
    res.status(500).json({ error: 'Ошибка сервера' });
  }
}

async function update(req, res) {
  const { relative_id, icd_code, title, description, diagnosed_at, is_chronic } = req.body;
  if (!title) return res.status(400).json({ error: 'Название диагноза обязательно' });
  try {
    const info = await Diagnosis.update(req.params.id, req.userId, { relative_id, icd_code, title, description, diagnosed_at, is_chronic });
    if (info.changes === 0) return res.status(404).json({ error: 'Диагноз не найден' });
    res.json(await Diagnosis.findOne(req.params.id, req.userId));
  } catch (err) {
    res.status(500).json({ error: 'Ошибка сервера' });
  }
}

async function remove(req, res) {
  try {
    const info = await Diagnosis.delete(req.params.id, req.userId);
    if (info.changes === 0) return res.status(404).json({ error: 'Диагноз не найден' });
    res.json({ message: 'Удалено' });
  } catch (err) {
    res.status(500).json({ error: 'Ошибка сервера' });
  }
}

module.exports = { getAll, getOne, create, update, remove };
