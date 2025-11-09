const express = require('express');
const { getUserOrders,createOrder, getOrder, updateOrderStatus, deleteOrder ,getOrdersByStatus,getAllOrders} = require('../controllers/orderController');
const router = express.Router();
const authenticateToken = require("../middleware/authMiddleware"); // Import middleware
const checkAdmin = require('../middleware/adminMiddleware'); // ✅ Thêm middleware admin
// ✅ Bắt buộc phải có middleware này để lấy req.user
router.get('/user/:user_id', authenticateToken, getUserOrders);

// ✅ Cũng nên thêm middleware này cho các route cần userId
router.post('/', authenticateToken, createOrder);
router.get('/:id', authenticateToken, getOrder);
router.put('/:id', authenticateToken, updateOrderStatus);
router.delete('/:id', authenticateToken, deleteOrder);

router.get("/user/orders/:status", authenticateToken, getOrdersByStatus);
// Admin xem toàn bộ đơn hàng
router.get("/admin/orders", authenticateToken, checkAdmin, getAllOrders);
module.exports = router;