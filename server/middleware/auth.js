const jwt = require('jsonwebtoken');

// Проверяет JWT-токен из заголовка Authorization: Bearer <token>
// При успехе добавляет req.userId и пропускает запрос дальше
// При ошибке возвращает 401
function authMiddleware(req, res, next) {
  const authHeader = req.headers['authorization'];

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Токен не предоставлен' });
  }

  const token = authHeader.split(' ')[1];

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    req.userId = payload.userId;
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Токен недействителен или истёк' });
  }
}

module.exports = authMiddleware;
