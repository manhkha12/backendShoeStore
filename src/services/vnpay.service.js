const crypto = require("crypto");
const QRCode = require("qrcode");
const moment = require("moment");
const qs = require("qs");

class VNPayService {
  constructor() {
    if (VNPayService.instance) return VNPayService.instance;

    this.vnp_TmnCode = process.env.vnp_TmnCode;
    this.vnp_HashSecret = process.env.vnp_HashSecret;
    this.vnp_Url = "https://sandbox.vnpayment.vn/paymentv2/vpcpay.html";
    this.vnp_ReturnUrl = "http://localhost:5173/payment-return";

    VNPayService.instance = this;
  }

  generatePaymentUrl(orderId, amount, ipAddr) {
    const createDate = moment().format("YYYYMMDDHHmmss");
    const expireDate = moment().add(2, "minutes").format("YYYYMMDDHHmmss");

    const params = {
      vnp_Version: "2.1.0",
      vnp_Command: "pay",
      vnp_TmnCode: this.vnp_TmnCode,
      vnp_Locale: "vn",
      vnp_CurrCode: "VND",
      vnp_TxnRef: orderId,
      vnp_OrderInfo: `Thanh toán đơn hàng ${orderId}`,
      vnp_OrderType: "other",
      vnp_Amount: amount * 100,
      vnp_ReturnUrl: this.vnp_ReturnUrl,
      vnp_CreateDate: createDate,
      vnp_ExpireDate: expireDate,
    };

    if (ipAddr) params.vnp_IpAddr = ipAddr;

    const sortedParams = this._sortParams(params);
    const queryString = new URLSearchParams(sortedParams).toString();

    const hmac = crypto.createHmac("sha512", this.vnp_HashSecret);
    const secureHash = hmac.update(Buffer.from(queryString, "utf-8")).digest("hex");

    return `${this.vnp_Url}?${queryString}&vnp_SecureHash=${secureHash}`;
  }

  async generateQR(orderId, amount, ipAddr) {
    const url = this.generatePaymentUrl(orderId, amount, ipAddr);
    const qrCode = await QRCode.toDataURL(url);
    return { url, qrCode };
  }

  validateReturn(query) {
    const secureHash = query["vnp_SecureHash"];
    delete query["vnp_SecureHash"];
    delete query["vnp_SecureHashType"];

    const sorted = this._sortParams(query);
    const signData = qs.stringify(sorted, { encode: false });

    const signed = crypto
      .createHmac("sha512", this.vnp_HashSecret)
      .update(signData, "utf-8")
      .digest("hex");

    return secureHash === signed;
  }

  _sortParams(obj) {
    return Object.keys(obj)
      .sort()
      .reduce((acc, key) => {
        acc[key] = obj[key];
        return acc;
      }, {});
  }
}

module.exports = new VNPayService();
