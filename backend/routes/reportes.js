const router = require('express').Router();
const ctrl = require('../controllers/reportesController');
const { autenticar } = require('../middleware/auth');

router.get('/ocupacion-por-estacion', autenticar, ctrl.ocupacionPorEstacion);
router.get('/estado-lineas',          autenticar, ctrl.estadoLineas);
router.get('/estado-flota',           autenticar, ctrl.estadoFlota);
router.get('/resumen',                autenticar, ctrl.resumen);
router.get('/buses-por-linea',        autenticar, ctrl.busesPorLinea);

module.exports = router;
