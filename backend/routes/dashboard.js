const router = require('express').Router();
const ctrl = require('../controllers/dashboardController');
const { autenticar } = require('../middleware/auth');
router.get('/', autenticar, ctrl.obtenerDashboard);
module.exports = router;
