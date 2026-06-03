const router = require('express').Router();
const ctrl = require('../controllers/busesController');
const { autenticar, autorizar } = require('../middleware/auth');

router.get('/parqueos', autenticar, ctrl.listarParqueos);
router.get('/',    autenticar, ctrl.listar);
router.get('/:id', autenticar, ctrl.obtener);
router.post('/',   autenticar, autorizar('administrador','supervisor'), ctrl.crear);
router.put('/:id', autenticar, autorizar('administrador','supervisor'), ctrl.actualizar);
router.delete('/:id', autenticar, autorizar('administrador'), ctrl.eliminar);

module.exports = router;
