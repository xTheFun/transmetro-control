const router = require('express').Router();
const ctrl = require('../controllers/ocupacionController');
const { autenticar, autorizar } = require('../middleware/auth');

router.get('/operadores', autenticar, ctrl.listarOperadores);
router.get('/',  autenticar, ctrl.listar);
// RN-06 y RN-07 se ejecutan dentro de ctrl.registrar
router.post('/', autenticar, autorizar('administrador','supervisor','operador'), ctrl.registrar);

module.exports = router;
