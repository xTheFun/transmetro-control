const router = require('express').Router();
const ctrl = require('../controllers/lineasController');
const { autenticar, autorizar } = require('../middleware/auth');

router.get('/',    autenticar, ctrl.listar);
router.get('/:id', autenticar, ctrl.obtener);
router.get('/:id/validar', autenticar, ctrl.validarLinea);
router.post('/',   autenticar, autorizar('administrador','supervisor'), ctrl.crear);
router.put('/:id', autenticar, autorizar('administrador','supervisor'), ctrl.actualizar);
router.delete('/:id', autenticar, autorizar('administrador'), ctrl.eliminar);
router.post('/:id/estaciones', autenticar, autorizar('administrador','supervisor'), ctrl.agregarEstacion);
router.delete('/:id/estaciones/:idEstacion', autenticar, autorizar('administrador'), ctrl.quitarEstacion);

module.exports = router;
