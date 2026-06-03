const router = require('express').Router();
const ctrl = require('../controllers/estacionesController');
const { autenticar, autorizar } = require('../middleware/auth');

router.get('/',    autenticar, ctrl.listar);
router.get('/:id', autenticar, ctrl.obtener);
router.post('/',   autenticar, autorizar('administrador','supervisor'), ctrl.crear);
router.put('/:id', autenticar, autorizar('administrador','supervisor'), ctrl.actualizar);
router.delete('/:id', autenticar, autorizar('administrador'), ctrl.eliminar);
router.post('/:id/accesos', autenticar, autorizar('administrador','supervisor'), ctrl.crearAcceso);
router.post('/:id/guardias', autenticar, autorizar('administrador','supervisor'), ctrl.crearGuardia);

module.exports = router;
