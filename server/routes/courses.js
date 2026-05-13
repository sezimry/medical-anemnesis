const express = require('express');
const router  = express.Router();
const auth    = require('../middleware/auth');
const {
  getAll, getOne, create, update, remove,
  getMedications, createMedication, updateMedication, removeMedication,
} = require('../controllers/coursesController');

router.use(auth);

// Курсы лечения
router.get('/',    getAll);
router.get('/:id', getOne);
router.post('/',   create);
router.put('/:id', update);
router.delete('/:id', remove);

// Лекарства внутри курса
router.get('/:id/medications',           getMedications);
router.post('/:id/medications',          createMedication);
router.put('/:id/medications/:medId',    updateMedication);
router.delete('/:id/medications/:medId', removeMedication);

module.exports = router;
