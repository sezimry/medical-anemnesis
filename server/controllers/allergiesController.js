const Allergy = require('../models/Allergy');

async function getAll(req, res) {
  try {
    res.json(await Allergy.findAll(req.userId));
  } catch (err) {
    res.status(500).json({ error: 'Ошибка сервера' });
  }
}

async function getOne(req, res) {
  try {
    const a = await Allergy.findOne(req.params.id, req.userId);
    if (!a) return res.status(404).json({ error: 'Аллергия не найдена' });
    res.json(a);
  } catch (err) {
    res.status(500).json({ error: 'Ошибка сервера' });
  }
}

async function create(req, res) {
  const { relative_id, allergen, reaction, severity } = req.body;
  if (!allergen) return res.status(400).json({ error: 'Аллерген обязателен' });
  try {
    const id = await Allergy.create({ user_id: req.userId, relative_id, allergen, reaction, severity });
    res.status(201).json(await Allergy.findOne(id, req.userId));
  } catch (err) {
    res.status(500).json({ error: 'Ошибка сервера' });
  }
}

async function update(req, res) {
  const { relative_id, allergen, reaction, severity } = req.body;
  if (!allergen) return res.status(400).json({ error: 'Аллерген обязателен' });
  try {
    const info = await Allergy.update(req.params.id, req.userId, { relative_id, allergen, reaction, severity });
    if (info.changes === 0) return res.status(404).json({ error: 'Аллергия не найдена' });
    res.json(await Allergy.findOne(req.params.id, req.userId));
  } catch (err) {
    res.status(500).json({ error: 'Ошибка сервера' });
  }
}

async function remove(req, res) {
  try {
    const info = await Allergy.delete(req.params.id, req.userId);
    if (info.changes === 0) return res.status(404).json({ error: 'Аллергия не найдена' });
    res.json({ message: 'Удалено' });
  } catch (err) {
    res.status(500).json({ error: 'Ошибка сервера' });
  }
}

module.exports = { getAll, getOne, create, update, remove };
