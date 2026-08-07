const express = require('express');
const { register, login, me } = require('../controllers/auth.controller');
const { registerValidators, loginValidators } = require('../validators/auth.validators');
const validate = require('../middleware/validate.middleware');
const verifyJwt = require('../middleware/auth.middleware');

const router = express.Router();

router.post('/register', registerValidators, validate, register);
router.post('/login', loginValidators, validate, login);
router.get('/me', verifyJwt, me);

module.exports = router;
