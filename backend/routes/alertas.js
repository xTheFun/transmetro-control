const router = require('express').Router();
const ctrl = require('../controllers/alertasController');
const { autenticar, autorizar } = require('../middleware/auth');

router.get('/', autenticar, ctrl.listar);
router.put('/:id/atender', autenticar, autorizar('administrador','supervisor'), ctrl.atender);
router.put('/:id/apoyo',   autenticar, autorizar('administrador','supervisor'), ctrl.enviarApoyo);

module.exports = router;
