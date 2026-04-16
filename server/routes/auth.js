const express = require('express');
const router = express.Router();
const { register, login } = require('../controllers/authController');

// POST /api/auth/register — создать нового пользователя
router.post('/register', register);

// POST /api/auth/login — войти, получить JWT-токен
router.post('/login', login);

module.exports = router;
