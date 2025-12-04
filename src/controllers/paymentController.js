const VNPayService = require("../services/vnpay.service.js");

<<<<<<< HEAD
<<<<<<< HEAD
async function generateQRVNPay(req, res) {
    const { orderId, amount } = req.body;

    const ipAddr =
        req.headers["x-forwarded-for"] ||
        req.connection?.remoteAddress ||
        req.socket?.remoteAddress ||
        req.connection?.socket?.remoteAddress;

    try {
        const { qrCode, url } = await VNPayService.generateQR(
            orderId,
            amount,
            ipAddr
        );

        return res.json({ qrCode, paymentUrl: url });
    } catch (e) {
        return res
            .status(500)
            .json({ error: "Lỗi tạo QR", details: e.message });
    }
}

async function handleVnpayReturn(req, res) {
    const query = req.query;

    if (!VNPayService.validateReturn(query)) {
        return res.redirect(
            "http://localhost:5173/payment-failed?error=invalid_signature"
        );
    }

    const orderId = query["vnp_TxnRef"];
    const responseCode = query["vnp_ResponseCode"];

    // Thanh toán thành công
    if (responseCode === "00") {
        try {
            // SSQL UPDATE
            await db.execute(
                "UPDATE orders SET status = ? WHERE order_id = ?",
                ["Success", orderId]
            );

            return res.redirect(
                `http://localhost:5173/payment-success?orderId=${orderId}`
            );
        } catch (err) {
            console.error("DB error:", err);
            return res.redirect(
                `http://localhost:5173/payment-failed?orderId=${orderId}&error=update_failed`
            );
        }
    }

    // Thanh toán thất bại
    try {
        await db.execute(
            "UPDATE orders SET status = ? WHERE id = ?",
            ["Failed", orderId]
        );
    } catch (err) {
        console.error("DB error:", err);
    }

    return res.redirect(
        `http://localhost:5173/payment-failed?orderId=${orderId}&error=${responseCode}`
    );
}

module.exports = {
    generateQRVNPay,
    handleVnpayReturn,
=======
=======
>>>>>>> 489487e32b106b85fcd0647276a92ca4fbf809c8
const db = require("../config/db.js");

async function generateQRVNPay(req, res) {
  const { orderId, amount } = req.body;

  const ipAddr =
    req.headers["x-forwarded-for"] ||
    req.connection?.remoteAddress ||
    req.socket?.remoteAddress ||
    req.connection?.socket?.remoteAddress;

  try {
    const { qrCode, url } = await VNPayService.generateQR(
      orderId,
      amount,
      ipAddr
    );

    return res.json({ success: true, data: { qrCode, paymentUrl: url } });
  } catch (e) {
    return res.status(500).json({ error: "Lỗi tạo QR", details: e.message });
  }
}

async function handleVnpayReturn(req, res) {
  const query = req.query;

  // Validate chữ ký
  if (!VNPayService.validateReturn(query)) {
    return res.redirect(
      "http://localhost:5173/payment-failed?error=invalid_signature"
    );
  }

  const orderId = query["vnp_TxnRef"];
  const responseCode = query["vnp_ResponseCode"];
  const transactionNo = query["vnp_TransactionNo"]; // Mã giao dịch VNPay

  // Nếu thanh toán thành công
  if (responseCode === "00") {
    try {
      const [details] = await db.query(
        `SELECT variant_id, quantity FROM orderdetails WHERE order_id=?`,
        [orderId]
      );

      for (const item of details) {
        await db.query(
          "UPDATE productvariants SET stock = stock - ? WHERE variant_id = ?",
          [item.quantity, item.variant_id]
        );
      }
      // 1️⃣ Cập nhật trạng thái đơn hàng
      await db.query("UPDATE orders SET status = ? WHERE order_id = ?", [
        "processing",
        orderId,
      ]);

      // 2️⃣ Ghi vào bảng PAYMENT
      await db.query(
        `INSERT INTO payments (order_id, payment_method, payment_status, transaction_id)
                 VALUES (?, ?, ?, ?)`,
        [orderId, "bank_transfer", "Success", transactionNo]
      );

      return res.redirect(
        `http://localhost:5173/payment-success?orderId=${orderId}`
      );
    } catch (err) {
      console.error("❌ Lỗi cập nhật MySQL:", err);
      return res.redirect(
        `http://localhost:5173/payment-failed?orderId=${orderId}&error=update_failed`
      );
    }
  }

  // ❌ Thanh toán thất bại
  return res.redirect(
    `http://localhost:5173/payment-failed?orderId=${orderId}&error=${responseCode}`
  );
}

module.exports = {
  generateQRVNPay,
  handleVnpayReturn,
<<<<<<< HEAD
>>>>>>> 489487e32b106b85fcd0647276a92ca4fbf809c8
=======
>>>>>>> 489487e32b106b85fcd0647276a92ca4fbf809c8
};
