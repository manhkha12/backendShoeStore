const VNPayService = require("../services/vnpay.service.js");
const OrderModel = require("../models/order.model.js");

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

    if (responseCode === "00") {
        try {
            await OrderModel.updateOne(
                { _id: orderId },
                {
                    $set: {
                        payment_status: "Success",
                        delivery_status: "OrderPaid",
                    },
                }
            );

            return res.redirect(
                `http://localhost:5173/payment-success?orderId=${orderId}`
            );
        } catch (err) {
            return res.redirect(
                `http://localhost:5173/payment-failed?orderId=${orderId}&error=update_failed`
            );
        }
    }

    return res.redirect(
        `http://localhost:5173/payment-failed?orderId=${orderId}&error=${responseCode}`
    );
}

module.exports = {
    generateQRVNPay,
    handleVnpayReturn,
};
