const bcrypt = require('bcryptjs');
const pool   = require('../db/database');
const User   = require('../models/User');

async function getMe(req, res) {
  try {
    const user = await User.findById(req.userId);
    if (!user) return res.status(404).json({ error: 'Пользователь не найден' });
    return res.json(user);
  } catch (err) {
    return res.status(500).json({ error: 'Ошибка сервера' });
  }
}

async function updateMe(req, res) {
  const { full_name, birth_date, gender } = req.body;
  if (!full_name) return res.status(400).json({ error: 'ФИО обязательно' });

  try {
    await User.update(req.userId, { full_name, birth_date, gender });
    const updatedUser = await User.findById(req.userId);
    return res.json(updatedUser);
  } catch (err) {
    return res.status(500).json({ error: 'Ошибка сервера' });
  }
}

async function changePassword(req, res) {
  const { current_password, new_password } = req.body;
  if (!current_password || !new_password)
    return res.status(400).json({ error: 'Оба поля обязательны' });
  if (new_password.length < 6)
    return res.status(400).json({ error: 'Новый пароль должен быть не менее 6 символов' });

  try {
    const { rows } = await pool.query('SELECT * FROM users WHERE id=$1', [req.userId]);
    const userWithPassword = rows[0];
    if (!userWithPassword) return res.status(404).json({ error: 'Пользователь не найден' });

    const match = bcrypt.compareSync(current_password, userWithPassword.password);
    if (!match) return res.status(401).json({ error: 'Текущий пароль неверен' });

    const newHash = bcrypt.hashSync(new_password, 10);
    await User.updatePassword(req.userId, newHash);
    return res.json({ message: 'Пароль успешно изменён' });
  } catch (err) {
    return res.status(500).json({ error: 'Ошибка сервера' });
  }
}

async function deleteMe(req, res) {
  try {
    await User.delete(req.userId);
    return res.json({ message: 'Аккаунт удалён' });
  } catch (err) {
    return res.status(500).json({ error: 'Ошибка сервера' });
  }
}

module.exports = { getMe, updateMe, changePassword, deleteMe };
