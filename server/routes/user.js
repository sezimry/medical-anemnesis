const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/auth');
const { getMe, updateMe, changePassword, deleteMe } = require('../controllers/userController');

// Все маршруты требуют валидного JWT-токена
router.use(authMiddleware);

// GET    /api/user/me            — получить свой профиль
router.get('/me', getMe);

// PUT    /api/user/me            — обновить ФИО / дату рождения / пол
router.put('/me', updateMe);

// PUT    /api/user/me/password   — сменить пароль
router.put('/me/password', changePassword);

// DELETE /api/user/me            — удалить аккаунт
router.delete('/me', deleteMe);

module.exports = router;
