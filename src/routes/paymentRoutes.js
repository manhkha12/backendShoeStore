const express = require('express');
const { generateQRVNPay, handleVnpayReturn} = require( "../controllers/paymentController.js")
const router = express.Router();
router.post('/vnpay-qr', generateQRVNPay)
router.get('/vnpay-return', handleVnpayReturn)

module.exports = router;