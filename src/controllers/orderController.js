const { OrderService } = require("../services/order.service");
const db = require("../config/db");

const orderService = new OrderService(db);

// CREATE ORDER
exports.createOrder = async (req, res) => {
    const userId = req.user?.userId;
    const { total_price, items } = req.body;

    if (!total_price || !items || !Array.isArray(items) || !items.length) {
        return res.status(400).json({ error: "Thiếu thông tin đơn hàng hoặc danh sách sản phẩm" });
    }

    try {
        const orderId = await orderService.createOrder({ user_id: userId, total_price, items });
        res.status(201).json({ message: "Tạo đơn hàng thành công", orderId });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: err.message });
    }
};

// GET ORDER DETAIL
exports.getOrder = async (req, res) => {
    const orderId = req.params.id;
    try {
        const order = await orderService.getOrderDetail(orderId);
        if (!order) return res.status(404).json({ error: "Đơn hàng không tồn tại" });
        res.json(order);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: err.message });
    }
};

// GET USER ORDERS
exports.getUserOrders = async (req, res) => {
    const userId = req.user?.userId;
    try {
        const orders = await orderService.getUserOrders(userId);
        res.json({ orders });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: err.message });
    }
};

// UPDATE ORDER STATUS
exports.updateOrderStatus = async (req, res) => {
    const orderId = req.params.id;
    const { status } = req.body;

    try {
        await orderService.updateOrderStatus(orderId, status);
        res.json({ message: "Cập nhật trạng thái thành công" });
    } catch (err) {
        console.error(err);
        res.status(400).json({ error: err.message });
    }
};

// DELETE ORDER
exports.deleteOrder = async (req, res) => {
    const orderId = req.params.id;

    try {
        await orderService.deleteOrder(orderId);
        res.json({ message: "Xóa đơn hàng thành công" });
    } catch (err) {
        console.error(err);
        res.status(400).json({ error: err.message });
    }
};

// GET ORDERS BY STATUS
exports.getOrdersByStatus = async (req, res) => {
    const userId = req.user?.userId;
    const status = req.params.status;

    try {
        const orders = await orderService.getOrdersByStatus(userId, status);
        res.json({ orders });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: err.message });
    }
};

// GET ALL ORDERS
exports.getAllOrders = async (req, res) => {
    try {
        const orders = await orderService.getAllOrders();
        res.json({ orders });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: err.message });
    }
};
