require('dotenv').config();

const express = require('express');
const cors    = require('cors');
const { runMigrations } = require('./db/migrations');

const authRoutes      = require('./routes/auth');
const userRoutes      = require('./routes/user');
const relativesRoutes = require('./routes/relatives');
const diagnosesRoutes = require('./routes/diagnoses');
const allergiesRoutes = require('./routes/allergies');
const exportRoutes    = require('./routes/export');
const doctorRoutes    = require('./routes/doctor');
const coursesRoutes   = require('./routes/courses');
const remindersRoutes  = require('./routes/reminders');
const documentsRoutes  = require('./routes/documents');

const app = express();

const corsOptions = {
  origin: (origin, cb) => cb(null, true),
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
};
app.use(cors(corsOptions));
app.options('*', cors(corsOptions));
app.use(express.json());

// Логирование всех запросов
app.use((req, _res, next) => {
  console.log(`${req.method} ${req.path}`);
  next();
});

app.use('/api/auth',      authRoutes);
app.use('/api/user',      userRoutes);
app.use('/api/relatives', relativesRoutes);
app.use('/api/diagnoses', diagnosesRoutes);
app.use('/api/allergies', allergiesRoutes);
app.use('/api/export',    exportRoutes);
app.use('/api/doctor',    doctorRoutes);
app.use('/api/courses',   coursesRoutes);
app.use('/api/reminders', remindersRoutes);
app.use('/api/documents', documentsRoutes);

app.get('/api/health', (_req, res) => res.json({ status: 'ok' }));
app.use((_req, res) => res.status(404).json({ error: 'Маршрут не найден' }));

async function start() {
  try {
    await runMigrations();
    const PORT = process.env.PORT || 5000;
    app.listen(PORT, () => console.log(`✓ Server running on http://localhost:${PORT}`));
  } catch (err) {
    console.error('Failed to start server:', err);
    process.exit(1);
  }
}

start();
