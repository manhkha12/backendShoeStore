const db = require('../config/db');

// // ✅ Lấy danh sách sản phẩm trong giỏ hàng của user
// exports.getCart = async (req, res) => {
//     const userId = req.params.userId;
//     try {
//         const [results] = await db.query(`
//             SELECT 
//                 c.cart_id, 
//                 c.quantity,
//                 c.created_at,
//                 pv.variant_id,
//                 pv.size, 
//                 pv.color, 
//                 p.product_id,
//                 p.name, 
//                 p.price, 
//                 p.image
//             FROM cart c
//             JOIN productvariants pv ON c.variant_id = pv.variant_id
//             JOIN products p ON pv.product_id = p.product_id
//             WHERE c.user_id = ?
//         `, [userId]);

//         res.json({succes :true,data:{results},});
//     } catch (err) {
//         console.error("Lỗi khi lấy danh sách sản phẩm trong giỏ hàng:", err);
//         res.status(500).json({ error: err.message });
//     }
// };

// ✅ Lấy danh sách sản phẩm trong giỏ hàng của user (gộp variant trùng)
exports.getCart = async (req, res) => {
    const userId = req.params.userId;
    try {
        const [results] = await db.query(`
            SELECT 
                MIN(c.cart_id) as cart_id, 
                SUM(c.quantity) as quantity, -- Gộp tổng quantity
                MIN(c.created_at) as created_at,
                pv.variant_id,
                pv.size, 
                pv.color, 
                p.product_id,
                p.name, 
                p.price, 
                p.image
            FROM cart c
            JOIN productvariants pv ON c.variant_id = pv.variant_id
            JOIN products p ON pv.product_id = p.product_id
            WHERE c.user_id = ?
            GROUP BY p.product_id, pv.variant_id, pv.size, pv.color, p.name, p.price, p.image
        `, [userId]);
        const fixedResults = results.map(item => ({
            ...item,
            quantity: Number(item.quantity)  // ép quantity thành int
        }));
        res.json({ success: true, data: fixedResults });
    } catch (err) {
        console.error("Lỗi khi lấy danh sách sản phẩm trong giỏ hàng:", err);
        res.status(500).json({ error: err.message });
    }
};

// ✅ Thêm sản phẩm vào giỏ hàng (theo variant_id)
exports.addToCart = async (req, res) => {
    const { user_id, variant_id, quantity } = req.body;
    try {
        await db.query(`
            INSERT INTO cart (user_id, variant_id, quantity)
            VALUES (?, ?, ?)
            ON DUPLICATE KEY UPDATE quantity = quantity + ?
        `, [user_id, variant_id, quantity, quantity]);

        res.json({ message: 'Thêm vào giỏ hàng thành công' });
    } catch (err) {
        console.error("Lỗi khi thêm vào giỏ hàng:", err);
        res.status(500).json({ error: err.message });
    }
};

// ✅ Cập nhật số lượng trong giỏ
exports.updateCart = async (req, res) => {
    const cartId = req.params.id;
    const { quantity } = req.body;
    try {
        const [results] = await db.query('UPDATE cart SET quantity = ? WHERE cart_id = ?', [quantity, cartId]);
        if (results.affectedRows === 0) {
            return res.status(404).json({ message: "Không tìm thấy sản phẩm trong giỏ" });
        }
        res.json({ message: 'Cập nhật thành công' });
    } catch (err) {
        console.error("Lỗi cập nhật giỏ hàng:", err);
        res.status(500).json({ error: err.message });
    }
};

// ✅ Xóa sản phẩm khỏi giỏ hàng
exports.deleteFromCart = async (req, res) => {
    const cartId = req.params.id;
    try {
        const [results] = await db.query('DELETE FROM cart WHERE cart_id = ?', [cartId]);
        if (results.affectedRows === 0) {
            return res.status(404).json({ message: "Không tìm thấy sản phẩm trong giỏ" });
        }
        res.json({ message: 'Xóa thành công' });
    } catch (err) {
        console.error("Lỗi khi xóa sản phẩm:", err);
        res.status(500).json({ error: err.message });
    }
};
