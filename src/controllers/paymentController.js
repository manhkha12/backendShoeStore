const VNPayService = require("../services/vnpay.service.js");

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
};
