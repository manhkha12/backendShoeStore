// routes/payment.route.js
const express = require("express");
const router = express.Router();
const paymentController = require("../controllers/paymentController.js");

// Route tạo QR VNPay
router.post("/vnpay/create-qr", paymentController.generateQRVNPay);

// Route callback VNPay trả về
router.get("/vnpay/return", paymentController.handleVnpayReturn);

module.exports = router;
