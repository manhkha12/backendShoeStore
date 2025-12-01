const db = require("../config/db");
const productService = require("./product.service");

// ======================
// 1. ORDER ITEM
// ======================
class OrderItem {
    constructor(variantId, name, quantity, price) {
        this.variant_id = variantId;
        this.name = name;
        this.quantity = quantity;
        this.price = price;
        this.subtotal = this.price * this.quantity;
    }
}

// ======================
// 2. ORDER BUILDER
// ======================
class OrderBuilder {
    constructor() {
        this.reset();
    }

    reset() {
        this.order = {
            user_id: null,
            items: [],
            total_item_price: 0,
            shipping_fee: 0,
            discount_amount: 0,
            final_price: 0,
            payment_method: "cash_on_delivery",
            status: "pending",
            created_at: new Date()
        };
        return this;
    }

    setUserId(userId) {
        this.order.user_id = userId;
        return this;
    }

    setPaymentMethod(method) {
        const methodMap = {
            'COD': 'cash_on_delivery',
            'BANK_TRANSFER': 'bank_transfer',
            'CREDIT_CARD': 'credit_card',
            'PAYPAL': 'paypal'
        };
        this.order.payment_method = methodMap[method] || method || 'cash_on_delivery';
        return this;
    }

    addValidatedItems(validatedItems) {
        const newItems = validatedItems.map(item =>
            new OrderItem(item.variant_id, item.name, item.quantity, item.price)
        );
        this.order.items.push(...newItems);
        return this;
    }

    applyFlatDiscount(amount) {
        this.order.discount_amount += amount;
        return this;
    }

    applyPercentDiscount(percent) {
        const currentTotal = this.order.items.reduce((sum, i) => sum + i.subtotal, 0);
        this.order.discount_amount += currentTotal * (percent / 100);
        return this;
    }

    setShippingFee(fee) {
        this.order.shipping_fee = fee;
        return this;
    }

    calculateTotals() {
        this.order.total_item_price = this.order.items.reduce((sum, item) => sum + item.subtotal, 0);

        if (this.order.shipping_fee === 0 && this.order.total_item_price < 1000000) {
            this.order.shipping_fee = 30000;
        }
        if (this.order.total_item_price >= 1000000) {
            this.order.shipping_fee = 0;
        }

        this.order.final_price = (this.order.total_item_price + this.order.shipping_fee) - this.order.discount_amount;
        if (this.order.final_price < 0) this.order.final_price = 0;

        return this;
    }

    build() {
        if (!this.order.user_id) throw new Error("Chưa có thông tin User");
        if (!this.order.items.length) throw new Error("Đơn hàng rỗng");
        return this.order;
    }
}

// ======================
// 3. ORDER DIRECTOR
// ======================
class OrderDirector {
    constructor(builder) {
        this.builder = builder;
    }

    async makeStandardOrder(userId, items, paymentMethod) {
        const validatedItems = await productService.validateAndGetProducts(items);
        return this.builder.reset()
            .setUserId(userId)
            .addValidatedItems(validatedItems)
            .setPaymentMethod(paymentMethod)
            .calculateTotals()
            .build();
    }

    async makeVIPOrder(userId, items, paymentMethod) {
        const validatedItems = await productService.validateAndGetProducts(items);
        return this.builder.reset()
            .setUserId(userId)
            .addValidatedItems(validatedItems)
            .setPaymentMethod(paymentMethod)
            .applyPercentDiscount(10)
            .calculateTotals()
            .build();
    }

    async makeSummerComboOrder(userId, quantity, paymentMethod) {
        const comboItems = [
            { variant_id: 1, quantity: 1 * quantity },
            { variant_id: 2, quantity: 1 * quantity }
        ];
        const validatedItems = await productService.validateAndGetProducts(comboItems);
        return this.builder.reset()
            .setUserId(userId)
            .addValidatedItems(validatedItems)
            .setPaymentMethod(paymentMethod)
            .applyFlatDiscount(50000 * quantity)
            .setShippingFee(0)
            .calculateTotals()
            .build();
    }
}

// ======================
// 4. ORDER SERVICE
// ======================
class OrderService {
    constructor() {
        this.db = db;
    }

    async createOrder(type, payload) {
        const builder = new OrderBuilder();
        const director = new OrderDirector(builder);
        let orderData;

        switch (type) {
            case 'VIP':
                orderData = await director.makeVIPOrder(payload.user_id, payload.items, payload.payment_method);
                break;
            case 'SUMMER_COMBO':
                orderData = await director.makeSummerComboOrder(payload.user_id, payload.quantity, payload.payment_method);
                break;
            default:
                orderData = await director.makeStandardOrder(payload.user_id, payload.items, payload.payment_method);
                break;
        }

        return await this.saveOrderToDatabase(orderData);
    }

    async saveOrderToDatabase(orderData) {
        const connection = await this.db.getConnection();
        await connection.beginTransaction();

        try {
            const [orderResult] = await connection.query(
                `INSERT INTO orders (user_id, total_price, status, created_at) 
                 VALUES (?, ?, ?, ?)`,
                [orderData.user_id, orderData.final_price, orderData.status, orderData.created_at]
            );
            const orderId = orderResult.insertId;

            const detailValues = orderData.items.map(item => [
                orderId, item.variant_id, item.quantity, item.price
            ]);
            if (detailValues.length > 0) {
                await connection.query(
                    "INSERT INTO orderdetails (order_id, variant_id, quantity, price) VALUES ?",
                    [detailValues]
                );
            }

            await connection.query(
                `INSERT INTO payments (order_id, payment_method, payment_status, created_at)
                 VALUES (?, ?, 'pending', ?)`,
                [orderId, orderData.payment_method, orderData.created_at]
            );

            for (const item of orderData.items) {
                await connection.query(
                    "UPDATE productvariants SET stock = stock - ? WHERE variant_id = ?",
                    [item.quantity, item.variant_id]
                );
            }

            await connection.commit();
            return { orderId, ...orderData };

        } catch (error) {
            await connection.rollback();
            throw error;
        } finally {
            connection.release();
        }
    }

    // --- CÁC HÀM GET / DELETE ---

    async getOrderDetail(orderId) {
        const [orders] = await this.db.query(`
            SELECT o.*, pay.payment_method, pay.payment_status 
            FROM orders o
            LEFT JOIN payments pay ON o.order_id = pay.order_id
            WHERE o.order_id = ?
        `, [orderId]);
        
        if (!orders.length) return null;

        const [items] = await this.db.query(
            `SELECT od.*, p.name as product_name, p.image, v.size, v.color
             FROM orderdetails od
             JOIN productvariants v ON od.variant_id = v.variant_id
             JOIN products p ON v.product_id = p.product_id
             WHERE od.order_id = ?`, 
            [orderId]
        );
        return { ...orders[0], items };
    }

    // 🔴 ĐÃ CẬP NHẬT: LẤY KÈM ITEMS
    async getUserOrders(userId) {
        // Bước 1: Lấy danh sách Order chính
        const [orders] = await this.db.query(`
            SELECT o.order_id, o.total_price, o.status, o.created_at,
                   pay.payment_method, pay.payment_status
            FROM orders o
            LEFT JOIN payments pay ON o.order_id = pay.order_id
            WHERE o.user_id = ? 
            ORDER BY o.created_at DESC
        `, [userId]);

        if (orders.length === 0) return [];

        // Bước 2: Lấy danh sách ID để query items
        const orderIds = orders.map(order => order.order_id);

        // Bước 3: Lấy Items cho tất cả các order trên (dùng IN)
        const [items] = await this.db.query(`
            SELECT od.order_id, od.variant_id, od.quantity, od.price,
                   p.name as product_name, p.image, v.size, v.color
            FROM orderdetails od
            JOIN productvariants v ON od.variant_id = v.variant_id
            JOIN products p ON v.product_id = p.product_id
            WHERE od.order_id IN (?)
        `, [orderIds]);

        // Bước 4: Map items vào đúng order của nó
        const result = orders.map(order => {
            return {
                ...order,
                items: items.filter(item => item.order_id === order.order_id)
            };
        });

        return result;
    }

    async updateOrderStatus(orderId, status) {
        const [result] = await this.db.query("UPDATE orders SET status = ? WHERE order_id = ?", [status, orderId]);
        if (result.affectedRows === 0) throw new Error("Đơn hàng không tồn tại");
        return true;
    }

    async deleteOrder(orderId) {
        const [result] = await this.db.query('DELETE FROM orders WHERE order_id = ? AND status = "pending"', [orderId]);
        if (result.affectedRows === 0) throw new Error("Chỉ có thể xóa đơn hàng chưa xác nhận");
        return true;
    }

    async getOrdersByStatus(userId, status) {
        // Cũng nên áp dụng logic lấy items tương tự nếu cần hiển thị chi tiết ở trang lọc status
        // Ở đây mình làm mẫu cho getUserOrders trước
        const [rows] = await this.db.query("SELECT * FROM orders WHERE user_id = ? AND status = ? ORDER BY created_at DESC", [userId, status]);
        return rows;
    }

    async getAllOrders() {
        const [rows] = await this.db.query(`
            SELECT o.order_id, o.total_price, o.created_at, o.status, 
                   u.username, u.email,
                   pay.payment_method
            FROM orders o 
            JOIN users u ON o.user_id = u.user_id
            LEFT JOIN payments pay ON o.order_id = pay.order_id
            ORDER BY o.created_at DESC
        `);
        return rows;
    }
}

module.exports = new OrderService();