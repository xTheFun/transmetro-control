const router = require('express').Router();
const ctrl = require('../controllers/pilotosController');
const { autenticar, autorizar } = require('../middleware/auth');

router.get('/',    autenticar, ctrl.listar);
router.get('/:id', autenticar, ctrl.obtener);
router.post('/',   autenticar, autorizar('administrador','supervisor'), ctrl.crear);
router.put('/:id', autenticar, autorizar('administrador','supervisor'), ctrl.actualizar);
router.delete('/:id', autenticar, autorizar('administrador'), ctrl.eliminar);
router.post('/:id/historial', autenticar, autorizar('administrador','supervisor'), ctrl.agregarHistorial);
router.delete('/:id/historial/:idHistorial', autenticar, autorizar('administrador'), ctrl.eliminarHistorial);

module.exports = router;
