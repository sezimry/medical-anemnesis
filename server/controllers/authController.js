const bcrypt = require('bcryptjs');
const jwt    = require('jsonwebtoken');
const User   = require('../models/User');

function generateToken(userId) {
  return jwt.sign({ userId }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  });
}

async function register(req, res) {
  const { email, password, full_name, birth_date, gender } = req.body;
  if (!email || !password || !full_name)
    return res.status(400).json({ error: 'Email, пароль и ФИО обязательны' });
  if (password.length < 6)
    return res.status(400).json({ error: 'Пароль должен быть не менее 6 символов' });

  try {
    const existing = await User.findByEmail(email);
    if (existing)
      return res.status(409).json({ error: 'Пользователь с таким email уже существует' });

    const hashedPassword = bcrypt.hashSync(password, 10);
    const newId = await User.create({ email, password: hashedPassword, full_name, birth_date, gender });
    const user  = await User.findById(newId);
    const token = generateToken(newId);
    return res.status(201).json({ token, user });
  } catch (err) {
    console.error('register error:', err);
    return res.status(500).json({ error: 'Ошибка сервера' });
  }
}

async function login(req, res) {
  const { email, password } = req.body;
  if (!email || !password)
    return res.status(400).json({ error: 'Email и пароль обязательны' });

  try {
    const user = await User.findByEmail(email);
    if (!user)
      return res.status(401).json({ error: 'Неверный email или пароль' });

    const passwordMatch = bcrypt.compareSync(password, user.password);
    if (!passwordMatch)
      return res.status(401).json({ error: 'Неверный email или пароль' });

    const token = generateToken(user.id);
    const { password: _pw, ...safeUser } = user;
    return res.json({ token, user: safeUser });
  } catch (err) {
    console.error('login error:', err);
    return res.status(500).json({ error: 'Ошибка сервера' });
  }
}

module.exports = { register, login };
