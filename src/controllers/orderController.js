const orderService = require("../services/order.service");
const { successResponse, errorResponse } = require("../utils/response");

// CREATE ORDER
exports.createOrder = async (req, res) => {
    // 1. Lấy User ID
    const userId = req.user?.userId || req.body.user_id;

    // 2. Lấy dữ liệu input
    // type: STANDARD, VIP, SUMMER_COMBO
    // payment_method: COD, BANK_TRANSFER, ...
    const { items, payment_method, type, quantity } = req.body;

    // 3. Validate đầu vào cơ bản
    if (type !== 'SUMMER_COMBO' && (!items || !Array.isArray(items) || !items.length)) {
         return errorResponse(res, "Danh sách sản phẩm không hợp lệ", 400);
    }

    try {
        // 4. Gọi Service (Orchestrator)
        const result = await orderService.createOrder(type, { 
            user_id: userId, 
            items, 
            payment_method,
            quantity 
        });

        // 5. Chuẩn bị response
        // Lưu ý: total_price trả về là giá cuối (sau khi +ship -discount)
        const responseData = {
            orderId: result.orderId,
            totalPrice: result.final_price,
            itemsCount: result.items.length,
            status: result.status,
            paymentMethod: result.payment_method // Trả về phương thức đã được map (vd: cash_on_delivery)
        };

        return successResponse(res, responseData, "Tạo đơn hàng thành công", 201);

    } catch (err) {
        console.error("Create Order Error:", err.message);
        return errorResponse(res, err.message, 400);
    }
};

// GET ORDER DETAIL
exports.getOrder = async (req, res) => {
    try {
        const order = await orderService.getOrderDetail(req.params.id);
        if (!order) {
            return errorResponse(res, "Đơn hàng không tồn tại", 404);
        }
        return successResponse(res, order, "Lấy chi tiết đơn hàng thành công");
    } catch (err) {
        return errorResponse(res, err.message);
    }
};

// GET USER ORDERS
exports.getUserOrders = async (req, res) => {
    const userId = req.user?.userId || req.query.user_id;
    try {
        const data = await orderService.getUserOrders(userId);
        return successResponse(res, data , "Lấy lịch sử đơn hàng thành công");
    } catch (err) {
        return errorResponse(res, err.message);
    }
};

// UPDATE STATUS
exports.updateOrderStatus = async (req, res) => {
    // Validate status theo Enum trong SQL
    const validStatuses = ['pending', 'processing', 'shipped', 'delivered', 'canceled'];
    if (!validStatuses.includes(req.body.status)) {
        return errorResponse(res, "Trạng thái không hợp lệ", 400);
    }

    try {
        await orderService.updateOrderStatus(req.params.id, req.body.status);
        return successResponse(res, null, "Cập nhật trạng thái thành công");
    } catch (err) {
        return errorResponse(res, err.message, 400);
    }
};

// DELETE ORDER
exports.deleteOrder = async (req, res) => {
    try {
        await orderService.deleteOrder(req.params.id);
        return successResponse(res, null, "Xóa đơn hàng thành công");
    } catch (err) {
        return errorResponse(res, err.message, 400);
    }
};

// GET BY STATUS
exports.getOrdersByStatus = async (req, res) => {
    const userId = req.user?.userId;
    try {
        const orders = await orderService.getOrdersByStatus(userId, req.params.status);
        return successResponse(res, { orders }, "Lấy danh sách theo trạng thái thành công");
    } catch (err) {
        return errorResponse(res, err.message);
    }
};

// GET ALL (ADMIN)
exports.getAllOrders = async (req, res) => {
    try {
        const orders = await orderService.getAllOrders();
        return successResponse(res, orders, "Lấy tất cả đơn hàng thành công");
    } catch (err) {
        return errorResponse(res, err.message);
    }
};