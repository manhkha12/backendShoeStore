const db = require("../config/db");

// ======================
// ORDER ITEM
// ======================
class OrderItem {
    constructor({ variant_id, quantity, price }) {
        this.variant_id = variant_id;
        this.quantity = quantity;
        this.price = price;
    }
}

// ======================
// ORDER BUILDER
// ======================
class OrderBuilder {
    constructor() {
        this.order = {
            user_id: null,
            total_price: 0,
            status: "pending",
            items: []
        };
    }

    setUserId(userId) {
        this.order.user_id = userId;
        return this;
    }

    setTotalPrice(totalPrice) {
        this.order.total_price = totalPrice;
        return this;
    }

    setStatus(status) {
        this.order.status = status;
        return this;
    }

    addItem(itemData) {
        this.order.items.push(new OrderItem(itemData));
        return this;
    }

    addItems(itemsList) {
        itemsList.forEach(item => this.addItem(item));
        return this;
    }

    build() {
        if (!this.order.user_id) throw new Error("UserId is required");
        if (!this.order.items.length) throw new Error("Order must have at least one item");
        return this.order;
    }
}

// ======================
// ORDER SERVICE
// ======================
class OrderService {
    constructor(db) {
        this.db = db;
    }

    // CREATE ORDER + INSERT ORDERDETAILS
    async createOrder({ user_id, total_price, items }) {
        const order = new OrderBuilder()
            .setUserId(user_id)
            .setTotalPrice(total_price)
            .addItems(items)
            .build();

        // Insert vào orders
        const [orderResult] = await this.db.query(
            "INSERT INTO orders (user_id, total_price, status) VALUES (?, ?, ?)",
            [order.user_id, order.total_price, order.status]
        );
        const orderId = orderResult.insertId;

        // Insert vào orderdetails
        const values = order.items.map(item => [
            orderId,
            item.variant_id,
            item.quantity,
            item.price
        ]);

        if (values.length > 0) {
            await this.db.query(
                "INSERT INTO orderdetails (order_id, variant_id, quantity, price) VALUES ?",
                [values]
            );
        }

        return orderId;
    }

    // GET ORDER DETAIL
    async getOrderDetail(orderId) {
        const [orders] = await this.db.query(
            "SELECT * FROM orders WHERE order_id = ?",
            [orderId]
        );
        if (!orders.length) return null;

        const order = orders[0];
        const [items] = await this.db.query(
            "SELECT * FROM orderdetails WHERE order_id = ?",
            [orderId]
        );

        return { ...order, items };
    }

    // GET USER ORDERS
    async getUserOrders(userId) {
        const [rows] = await this.db.query(
            "SELECT * FROM orders WHERE user_id = ? ORDER BY created_at DESC",
            [userId]
        );
        return rows;
    }

    // UPDATE ORDER STATUS
    async updateOrderStatus(orderId, status) {
        const [result] = await this.db.query(
            "UPDATE orders SET status = ? WHERE order_id = ?",
            [status, orderId]
        );
        if (result.affectedRows === 0) {
            throw new Error("Đơn hàng không tồn tại");
        }
        return true;
    }

    // DELETE ORDER (if pending)
    async deleteOrder(orderId) {
        const [result] = await this.db.query(
            'DELETE FROM orders WHERE order_id = ? AND status = "pending"',
            [orderId]
        );
        if (result.affectedRows === 0) {
            throw new Error("Chỉ có thể xóa đơn hàng chưa xác nhận hoặc đơn hàng không tồn tại");
        }
        return true;
    }

    // GET ORDERS BY STATUS
    async getOrdersByStatus(userId, status) {
        const [rows] = await this.db.query(
            "SELECT * FROM orders WHERE user_id = ? AND status = ? ORDER BY created_at DESC",
            [userId, status]
        );
        return rows;
    }

    // GET ALL ORDERS
    async getAllOrders() {
        const [rows] = await this.db.query(`
            SELECT o.order_id, o.total_price, o.created_at, o.status,
                   u.username, u.email
            FROM orders o
            JOIN users u ON o.user_id = u.user_id
            ORDER BY o.created_at DESC
        `);
        return rows;
    }
}

// ======================
// EXPORT
// ======================
module.exports = {
    OrderItem,
    OrderBuilder,
    OrderService
};
