const Relative = require('../models/Relative');

async function getAll(req, res) {
  try {
    res.json(await Relative.findAll(req.userId));
  } catch (err) {
    res.status(500).json({ error: 'Ошибка сервера' });
  }
}

async function getOne(req, res) {
  try {
    const relative = await Relative.findOne(req.params.id, req.userId);
    if (!relative) return res.status(404).json({ error: 'Родственник не найден' });
    res.json(relative);
  } catch (err) {
    res.status(500).json({ error: 'Ошибка сервера' });
  }
}

async function create(req, res) {
  const { full_name, birth_date, gender, relation_type, parent_relative_id, notes } = req.body;
  if (!full_name || !relation_type)
    return res.status(400).json({ error: 'ФИО и тип связи обязательны' });
  try {
    const id      = await Relative.create({ user_id: req.userId, full_name, birth_date, gender, relation_type, parent_relative_id, notes });
    const created = await Relative.findOne(id, req.userId);
    res.status(201).json(created);
  } catch (err) {
    res.status(500).json({ error: 'Ошибка сервера' });
  }
}

async function update(req, res) {
  const { full_name, birth_date, gender, relation_type, parent_relative_id, notes } = req.body;
  if (!full_name || !relation_type)
    return res.status(400).json({ error: 'ФИО и тип связи обязательны' });
  try {
    const info = await Relative.update(req.params.id, req.userId, { full_name, birth_date, gender, relation_type, parent_relative_id, notes });
    if (info.changes === 0) return res.status(404).json({ error: 'Родственник не найден' });
    res.json(await Relative.findOne(req.params.id, req.userId));
  } catch (err) {
    res.status(500).json({ error: 'Ошибка сервера' });
  }
}

async function remove(req, res) {
  try {
    const info = await Relative.delete(req.params.id, req.userId);
    if (info.changes === 0) return res.status(404).json({ error: 'Родственник не найден' });
    res.json({ message: 'Удалено' });
  } catch (err) {
    res.status(500).json({ error: 'Ошибка сервера' });
  }
}

module.exports = { getAll, getOne, create, update, remove };
