const express = require('express');
const router  = express.Router();
const multer  = require('multer');
const path    = require('path');
const jwt     = require('jsonwebtoken');
const auth    = require('../middleware/auth');
const { getAll, getOne, create, update, remove, serveFile } = require('../controllers/documentsController');

const storage = multer.diskStorage({
  destination: path.join(__dirname, '../uploads'),
  filename: (_req, file, cb) => {
    const ext  = path.extname(file.originalname);
    const name = `${Date.now()}-${Math.round(Math.random() * 1e9)}${ext}`;
    cb(null, name);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 20 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    const allowed = ['image/jpeg','image/png','image/webp','application/pdf'];
    cb(null, allowed.includes(file.mimetype));
  },
});

// Принимает токен из заголовка ИЛИ query-параметра
function authFile(req, res, next) {
  let token = null;
  const authHeader = req.headers['authorization'];
  if (authHeader?.startsWith('Bearer ')) {
    token = authHeader.split(' ')[1];
  } else if (req.query.token) {
    token = req.query.token;
  }
  if (!token) return res.status(401).json({ error: 'Токен не предоставлен' });
  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    req.userId   = payload.userId;
    req.userRole = payload.role || 'patient';
    next();
  } catch {
    return res.status(401).json({ error: 'Токен недействителен' });
  }
}

// Файл — без глобального auth, используем authFile
router.get('/:id/file', authFile, serveFile);

// Остальные роуты — с обычным auth
router.get('/',       auth, getAll);
router.get('/:id',    auth, getOne);
router.post('/',      auth, upload.single('file'), create);
router.put('/:id',    auth, upload.single('file'), update);
router.delete('/:id', auth, remove);

module.exports = router;
