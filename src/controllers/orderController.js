<<<<<<< HEAD
const orderService = require("../services/order.service");
const { successResponse, errorResponse } = require("../utils/response");

// CREATE ORDER
exports.createOrder = async (req, res) => {
    // 1. Lấy User ID
    const userId = req.user?.userId || req.body.user_id;
=======
const db = require('../config/db');

// Lấy danh sách đơn hàng của người dùng
// exports.getUserOrders = async (req, res) => {
//     const userId = req.user.userId; // Lấy userId từ token JWT
//     try {
//         const [results] = await db.query('SELECT * FROM orders WHERE user_id = ?', [userId]);
//         res.json({ data: results });
//     } catch (err) {
//         console.error("Lỗi khi lấy danh sách đơn hàng:", err);
//         res.status(500).json({ error: 'Lỗi truy vấn database' });
//     }
// };


// exports.getUserOrders = async (req, res) => {
//     const userId = req.user.userId; // Lấy userId từ token JWT
//     try {
//         const [results] = await db.query('SELECT * FROM orders WHERE user_id = ?', [userId]);
//         res.json({ data: results });
//     } catch (err) {
//         console.error("Lỗi khi lấy danh sách đơn hàng:", err);
//         res.status(500).json({ error: 'Lỗi truy vấn database' });
//     }
// };


exports.getUserOrders = async (req, res) => {
    const userId = req.user.userId;

    const userId = req.user.userId;

    try {
        const [results] = await db.query(
            `SELECT 
                o.order_id,
                o.user_id,
                o.total_price,
                o.status,
                o.created_at,
                p.name AS product_name,
                pv.size,
                pv.color,
                od.quantity,
                od.price,
                p.image,
                p.brand
            FROM orders o
            JOIN orderdetails od ON o.order_id = od.order_id
            JOIN productvariants pv ON od.variant_id = pv.variant_id
            JOIN products p ON pv.product_id = p.product_id
            WHERE o.user_id = ?`,
            [userId]
        );

        // ---- Grouping ----
        const ordersMap = {};

        results.forEach(row => {
            const orderId = row.order_id;

            if (!ordersMap[orderId]) {
                ordersMap[orderId] = {
                    order_id: row.order_id,
                    user_id: row.user_id,
                    total_price: row.total_price,
                    status: row.status,
                    created_at: row.created_at,
                    items: []
                };
            }

            ordersMap[orderId].items.push({
                product_name: row.product_name,
                size: row.size,
                color: row.color,
                quantity: row.quantity,
                price: row.price,
                image: row.image,
                brand: row.brand
            });
        });

        res.json({ data: Object.values(ordersMap) });

        const [results] = await db.query(
            `SELECT 
                o.order_id,
                o.user_id,
                o.total_price,
                o.status,
                o.created_at,
                p.name AS product_name,
                pv.size,
                pv.color,
                od.quantity,
                od.price,
                p.image,
                p.brand
            FROM orders o
            JOIN orderdetails od ON o.order_id = od.order_id
            JOIN productvariants pv ON od.variant_id = pv.variant_id
            JOIN products p ON pv.product_id = p.product_id
            WHERE o.user_id = ?`,
            [userId]
        );

        // ---- Grouping ----
        const ordersMap = {};

        results.forEach(row => {
            const orderId = row.order_id;

            if (!ordersMap[orderId]) {
                ordersMap[orderId] = {
                    order_id: row.order_id,
                    user_id: row.user_id,
                    total_price: row.total_price,
                    status: row.status,
                    created_at: row.created_at,
                    items: []
                };
            }

            ordersMap[orderId].items.push({
                product_name: row.product_name,
                size: row.size,
                color: row.color,
                quantity: row.quantity,
                price: row.price,
                image: row.image,
                brand: row.brand
            });
        });

        res.json({ data: Object.values(ordersMap) });

    } catch (err) {
        console.error("Lỗi khi lấy danh sách đơn hàng:", err);
        res.status(500).json({ error: 'Lỗi truy vấn database' });
    }
};









exports.createOrder = async (req, res) => {
  const userId = req.user?.userId;
  const { total_price, items, payment_method, payment_method } = req.body;
>>>>>>> 489487e32b106b85fcd0647276a92ca4fbf809c8

    // 2. Lấy dữ liệu input
    // type: STANDARD, VIP, SUMMER_COMBO
    // payment_method: COD, BANK_TRANSFER, ...
    const { items, payment_method, type, quantity } = req.body;

<<<<<<< HEAD
    // 3. Validate đầu vào cơ bản
    if (type !== 'SUMMER_COMBO' && (!items || !Array.isArray(items) || !items.length)) {
         return errorResponse(res, "Danh sách sản phẩm không hợp lệ", 400);
    }
=======
  const conn = await db.getConnection();
  await conn.beginTransaction();

  const conn = await db.getConnection();
  await conn.beginTransaction();

  try {
    // Tạo đơn hàng
    const [orderResult] = await conn.query(
      "INSERT INTO orders (user_id, total_price, status) VALUES (?, ?, ?)",
      [userId, total_price, "pending"]
    const [orderResult] = await conn.query(
      "INSERT INTO orders (user_id, total_price, status) VALUES (?, ?, ?)",
      [userId, total_price, "pending"]
    );
    const orderId = orderResult.insertId;
    const orderId = orderResult.insertId;

    // Insert vào orderdetails
    const orderDetails = items.map(item => [
    // Insert vào orderdetails
    const orderDetails = items.map(item => [
      orderId,
      item.variant_id,
      item.variant_id,
      item.quantity,
      item.price,
    ]);

    await conn.query(
      `INSERT INTO orderdetails (order_id, variant_id, quantity, price)
       VALUES ?`,
      [orderDetails]
    );


    // Nếu có thanh toán
    if (payment_method) {
      await conn.query(
        `INSERT INTO payments (order_id, payment_method, payment_status)
         VALUES (?, ?, ?)`,
        [orderId, payment_method, "pending"]
      );
    }

      const variantIds = items.map(item => item.variant_id);
    await conn.query(
      `DELETE FROM cart WHERE user_id = ? AND variant_id IN (?)`,
      [userId, variantIds]
    );

    // Hoàn tất transaction
    await conn.commit();
    ]);

    await conn.query(
      `INSERT INTO orderdetails (order_id, variant_id, quantity, price)
       VALUES ?`,
      [orderDetails]
    );


    // Nếu có thanh toán
    if (payment_method) {
      await conn.query(
        `INSERT INTO payments (order_id, payment_method, payment_status)
         VALUES (?, ?, ?)`,
        [orderId, payment_method, "pending"]
      );
    }

      const variantIds = items.map(item => item.variant_id);
    await conn.query(
      `DELETE FROM cart WHERE user_id = ? AND variant_id IN (?)`,
      [userId, variantIds]
    );

    // Hoàn tất transaction
    await conn.commit();

    res.status(201).json({
      message: "Tạo đơn hàng thành công",
      data: {
    orderId: orderId,
     amount: total_price
  }
    });

    res.status(201).json({
      message: "Tạo đơn hàng thành công",
      data: {
    orderId: orderId,
     amount: total_price
  }
    });

  } catch (err) {
    // Có lỗi → rollback
    await conn.rollback();
    // Có lỗi → rollback
    await conn.rollback();
    console.error("Lỗi khi tạo đơn hàng:", err);
    res.status(500).json({ error: "Lỗi khi tạo đơn hàng" });
  } finally {
    conn.release();
  } finally {
    conn.release();
  }
};

// Lấy chi tiết đơn hàng
exports.getOrder = async (req, res) => {
    const orderId = req.params.id;
    const userId = req.user.userId; // Lấy user từ token
    console.log("🛠️ Debug: orderId =", orderId, "userId =", userId);

    const query = `
        SELECT o.order_id, o.total_price, o.created_at, 
               od.variant_id, od.quantity, od.price, 
               p.name AS product_name, p.brand 
        FROM orders o
        JOIN orderdetails od ON o.order_id = od.order_id
        JOIN productvariants pv ON od.variant_id = pv.variant_id
        JOIN products p ON pv.product_id = p.product_id
        WHERE o.order_id = ? AND o.user_id = ?;
    `;
>>>>>>> 489487e32b106b85fcd0647276a92ca4fbf809c8

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
<<<<<<< HEAD

        return successResponse(res, responseData, "Tạo đơn hàng thành công", 201);

=======
       res.json({data:order});
>>>>>>> 489487e32b106b85fcd0647276a92ca4fbf809c8
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
        const orders = await orderService.getUserOrders(userId);
        return successResponse(res, orders , "Lấy lịch sử đơn hàng thành công");
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
<<<<<<< HEAD
        const orders = await orderService.getOrdersByStatus(userId, req.params.status);
        return successResponse(res, { orders }, "Lấy danh sách theo trạng thái thành công");
=======
        const [results] = await db.query("SELECT * FROM orders WHERE user_id = ? AND status = ?", [userId, status]);
        res.json({ data: results });
>>>>>>> 489487e32b106b85fcd0647276a92ca4fbf809c8
    } catch (err) {
        return errorResponse(res, err.message);
    }
};

// GET ALL (ADMIN)
exports.getAllOrders = async (req, res) => {
    try {
<<<<<<< HEAD
        const orders = await orderService.getAllOrders();
        return successResponse(res, orders, "Lấy tất cả đơn hàng thành công");
=======
        const [results] = await db.query(`
            SELECT o.order_id, o.total_price, o.created_at, o.status,
                   u.username, u.email
            FROM orders o
            JOIN users u ON o.user_id = u.user_id
            ORDER BY o.created_at DESC
        `);
        res.json({ data: results });
>>>>>>> 489487e32b106b85fcd0647276a92ca4fbf809c8
    } catch (err) {
        return errorResponse(res, err.message);
    }
};