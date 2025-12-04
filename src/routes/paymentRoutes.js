<<<<<<< HEAD
const express = require('express');
const { generateQRVNPay, handleVnpayReturn} = require( "../controllers/paymentController.js")
const router = express.Router();
router.post('/vnpay-qr', generateQRVNPay)
router.get('/vnpay-return', handleVnpayReturn)

module.exports = router;
=======
// routes/payment.route.js
const express = require("express");
const router = express.Router();
const paymentController = require("../controllers/paymentController.js");

// Route tạo QR VNPay
router.post("/vnpay/create-qr", paymentController.generateQRVNPay);

// Route callback VNPay trả về
router.get("/vnpay/return", paymentController.handleVnpayReturn);

module.exports = router;
>>>>>>> 489487e32b106b85fcd0647276a92ca4fbf809c8
// routes/payment.route.js
const express = require("express");
const router = express.Router();
const paymentController = require("../controllers/paymentController.js");

// Route tạo QR VNPay
router.post("/vnpay/create-qr", paymentController.generateQRVNPay);

// Route callback VNPay trả về
router.get("/vnpay/return", paymentController.handleVnpayReturn);

module.exports = router;
