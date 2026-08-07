const express = require('express');
const { getSummary } = require('../controllers/dashboard.controller');
const verifyJwt = require('../middleware/auth.middleware');

const router = express.Router();
router.use(verifyJwt);

router.get('/summary', getSummary);

module.exports = router;
