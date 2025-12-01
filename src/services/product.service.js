const db = require("../config/db");

class ProductService {
    /**
     * Validate danh sách items từ request.
     * 1. Check tồn tại variant.
     * 2. Check tồn kho (stock).
     * 3. Lấy giá chuẩn từ DB (Tránh client gửi giá fake).
     * @param {Array} items - Danh sách item từ request [{variant_id, quantity}]
     * @returns {Promise<Array>} - Danh sách item đã validate với đầy đủ thông tin giá, tên
     */
    async validateAndGetProducts(items) {
        const validatedItems = [];

        for (const item of items) {
            // SỬA LỖI Ở ĐÂY:
            // Đổi v.price -> p.price (vì giá nằm ở bảng products)
            // SQL Schema: products(price), productvariants(không có price)
            const [rows] = await db.query(`
                SELECT v.variant_id, v.product_id, v.stock, p.price, p.name 
                FROM productvariants v
                JOIN products p ON v.product_id = p.product_id
                WHERE v.variant_id = ?
            `, [item.variant_id]);

            if (rows.length === 0) {
                throw new Error(`Sản phẩm (Variant ID: ${item.variant_id}) không tồn tại.`);
            }

            const productData = rows[0];

            // Validate tồn kho
            if (productData.stock < item.quantity) {
                throw new Error(`Sản phẩm "${productData.name}" không đủ hàng (Tồn: ${productData.stock}, Yêu cầu: ${item.quantity}).`);
            }

            // Push vào danh sách đã validate
            validatedItems.push({
                variant_id: productData.variant_id,
                product_id: productData.product_id,
                name: productData.name,
                price: Number(productData.price), // Quan trọng: Giá lấy từ bảng products
                quantity: item.quantity
            });
        }

        return validatedItems;
    }
}

module.exports = new ProductService();