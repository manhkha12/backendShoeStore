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


exports.getUserOrders = async (req, res) => {
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

    } catch (err) {
        console.error("Lỗi khi lấy danh sách đơn hàng:", err);
        res.status(500).json({ error: 'Lỗi truy vấn database' });
    }
};





exports.createOrder = async (req, res) => {
  const userId = req.user?.userId;
  const { total_price, items, payment_method } = req.body;

  if (!items || !Array.isArray(items) || items.length === 0 || !total_price) {
    return res.status(400).json({ error: "Thiếu thông tin đơn hàng hoặc danh sách sản phẩm" });
  }

  const conn = await db.getConnection();
  await conn.beginTransaction();

  try {
    // Tạo đơn hàng
    const [orderResult] = await conn.query(
      "INSERT INTO orders (user_id, total_price, status) VALUES (?, ?, ?)",
      [userId, total_price, "pending"]
    );
    const orderId = orderResult.insertId;

    // Insert vào orderdetails
    const orderDetails = items.map(item => [
      orderId,
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
    console.error("Lỗi khi tạo đơn hàng:", err);
    res.status(500).json({ error: "Lỗi khi tạo đơn hàng" });
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

    try {
        const [results] = await db.query(query, [orderId, userId]);

        if (results.length === 0) {
            return res.status(404).json({ error: "Đơn hàng không tồn tại" });
        }

        console.log("✅ Debug: Kết quả trả về =", results);

        const order = {
            order_id: results[0].order_id,
            total_price: results[0].total_price,
            created_at: results[0].created_at,
            items: results.map(row => ({
                variant_id: row.variant_id,
                product_name: row.product_name,
                brand: row.brand,
                quantity: row.quantity,
                price: row.price,
            }))
        };
       res.json({data:order});
    } catch (err) {
        console.error("Lỗi khi lấy đơn hàng:", err);
        res.status(500).json({ error: "Lỗi khi lấy đơn hàng" });
    }
};

// Cập nhật trạng thái đơn hàng
exports.updateOrderStatus = async (req, res) => {
    const orderId = req.params.id;
    const { status } = req.body;

    try {
        const [results] = await db.query('UPDATE orders SET status = ? WHERE order_id = ?', [status, orderId]);
        if (results.affectedRows === 0) {
            return res.status(404).json({ message: "Đơn hàng không tồn tại" });
        }
        res.json({ message: 'Cập nhật trạng thái đơn hàng thành công' });
    } catch (err) {
        console.error("Lỗi khi cập nhật trạng thái đơn hàng:", err);
        res.status(500).json({ error: err.message });
    }
};

// Xóa đơn hàng nếu chưa xác nhận
exports.deleteOrder = async (req, res) => {
    const orderId = req.params.id;

    try {
        const [results] = await db.query('DELETE FROM orders WHERE order_id = ? AND status = "pending"', [orderId]);
        if (results.affectedRows > 0) {
            res.json({ message: 'Đơn hàng đã được xóa' });
        } else {
            res.status(400).json({ error: 'Chỉ có thể xóa đơn hàng chưa xác nhận' });
        }
    } catch (err) {
        console.error("Lỗi khi xóa đơn hàng:", err);
        res.status(500).json({ error: err.message });
    }
};

// Lấy danh sách đơn hàng theo trạng thái
exports.getOrdersByStatus = async (req, res) => {
    const userId = req.user.userId;
    const status = req.params.status;

    try {
        const [results] = await db.query("SELECT * FROM orders WHERE user_id = ? AND status = ?", [userId, status]);
        res.json({ data: results });
    } catch (err) {
        console.error("Lỗi khi lấy đơn hàng theo trạng thái:", err);
        res.status(500).json({ error: "Lỗi truy vấn database" });
    }
};

// Lấy tất cả đơn hàng
exports.getAllOrders = async (req, res) => {
    try {
        const [results] = await db.query(`
            SELECT o.order_id, o.total_price, o.created_at, o.status,
                   u.username, u.email
            FROM orders o
            JOIN users u ON o.user_id = u.user_id
            ORDER BY o.created_at DESC
        `);
        res.json({ data: results });
    } catch (err) {
        console.error("Lỗi khi lấy danh sách tất cả đơn hàng:", err);
        res.status(500).json({ error: "Lỗi khi lấy danh sách đơn hàng" });
    }
};
