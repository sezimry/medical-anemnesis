const express = require('express');
const router  = express.Router();
const auth    = require('../middleware/auth');
const { getAll, create, update, toggle, remove } = require('../controllers/remindersController');

router.use(auth);

router.get('/',           getAll);
router.post('/',          create);
router.put('/:id',        update);
router.patch('/:id/toggle', toggle);
router.delete('/:id',     remove);

module.exports = router;
