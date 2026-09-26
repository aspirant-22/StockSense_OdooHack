const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth.middleware');
const { getDashboardKPIs } = require('../controllers/dashboard.controller');

router.use(protect);
router.get('/kpis', getDashboardKPIs);

module.exports = router;
