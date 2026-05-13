const express       = require('express');
const router        = express.Router();
const auth          = require('../middleware/auth');
const requireDoctor = require('../middleware/requireDoctor');
const {
  getPatients, getPatient,
  addDiagnosis, addAllergy,
  deleteDiagnosis, deleteAllergy,
} = require('../controllers/doctorController');

router.use(auth);
router.use(requireDoctor);

// Список всех пациентов
router.get('/patients', getPatients);

// Данные конкретного пациента
router.get('/patients/:id', getPatient);

// Добавить диагноз / аллергию пациенту
router.post('/patients/:id/diagnoses', addDiagnosis);
router.post('/patients/:id/allergies', addAllergy);

// Удалить диагноз / аллергию пациента
router.delete('/patients/:id/diagnoses/:diagId',  deleteDiagnosis);
router.delete('/patients/:id/allergies/:allergId', deleteAllergy);

module.exports = router;
