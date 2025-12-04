// const db = require('../config/db');

// const util = require('util');

// const query = util.promisify(db.query).bind(db);

// const BASE_URL = "http://10.0.2.2:5000";


// exports.getAllProducts = async (req, res) => {
//   try {
//     const products = await query('SELECT * FROM products');
//     res.json({ success: true, data: products });
//   } catch (error) {
//     res.status(500).json({ success: false, error: error.message });
//   }
// };

// exports.getProductById = async (req, res) => {
//   try {
//     const products = await query('SELECT * FROM products WHERE product_id = ?', [req.params.id]);
//     const product = products[0]; 
//     if (products.length === 0) {
//       return res.status(404).json({ success: false, error: 'Không tìm thấy sản phẩm' });
//     }
//     const categories = await query('SELECT * FROM categories WHERE category_id = ?', [product.category_id]);
//     const category = categories.length > 0 ? categories[0] : null;
//     const variants = await query('SELECT * FROM productvariants WHERE product_id = ?', [product.product_id]);
//     res.json({ success: true, data: {product,category, variants }});
//   } catch (error) {
//     res.status(500).json({ success: false, error: error.message });
//   }
// };

// // exports.createProduct = (req, res) => {
// //   const { name,description, price,categogy_id,brand,stock, image } = req.body;
// //   if (!name || !price || !image) return res.status(400).json({ error: 'Thiếu thông tin sản phẩm' });

// //   db.query('INSERT INTO products (name,description, price,categogy_id,brand,stock, image) VALUES (?, ?, ?, ?,?,?,?)',
// //     [name,description, price,categogy_id,brand,stock, image],
// //     (err, results) => {
// //       if (err) return res.status(500).json({ error: err.message });
// //       res.status(201).json({ message: 'Sản phẩm đã được thêm', productId: results.insertId });
// //     }
// //   );
// // };
// exports.createProduct = async (req, res) => {
//   try {
//     const { name, description, price, category_id, brand, stock, image  } = req.body;
    

//     if (!name || !price) {
//       return res.status(400).json({ error: 'Thiếu thông tin sản phẩm' });
//     }



//     const result = await query(
//       'INSERT INTO products (name, description, price, category_id, brand, stock, image) VALUES (?, ?, ?, ?, ?, ?, ?)',
//       [name, description, price, category_id, brand, stock, image]
//     );

//     res.status(201).json({ message: 'Sản phẩm đã được thêm', productId: result.insertId});
//   } catch (error) {
//     res.status(500).json({ error: error.message });
//   }
// };


// // // Cập nhật sản phẩm
// // exports.updateProduct = (req, res) => {
// //   const { id } = req.params;
// //   const updates = req.body; // Chỉ lấy dữ liệu gửi lên

// //   if (!Object.keys(updates).length) {
// //     return res.status(400).json({ error: 'Không có dữ liệu để cập nhật' });
// //   }

// //   const fields = Object.keys(updates).map(field => `${field} = ?`).join(', ');
// //   const values = Object.values(updates);

// //   db.query(
// //     `UPDATE products SET ${fields} WHERE product_id = ?`,
// //     [...values, id],
// //     (err, results) => {
// //       if (err) return res.status(500).json({ error: err.message });
// //       if (results.affectedRows === 0) return res.status(404).json({ error: 'Không tìm thấy sản phẩm' });
// //       res.json({ message: 'Sản phẩm đã được cập nhật' });
// //     }
// //   );
// // };

// exports.updateProduct = async (req, res) => {
//   try {
//     const { id } = req.params;
//     const updates = req.body; 

//     if (!Object.keys(updates).length && !req.file) {
//       return res.status(400).json({ error: 'Không có dữ liệu để cập nhật' });
//     }

//     const fields = Object.keys(updates).map(field => `${field} = ?`).join(', ');
//     const values = Object.values(updates);

//     const result = await query(
//       `UPDATE products SET ${fields} WHERE product_id = ?`,
//       [...values, id]
//     );

//     if (result.affectedRows === 0) {
//       return res.status(404).json({ error: 'Không tìm thấy sản phẩm' });
//     }

//     res.json({ message: 'Sản phẩm đã được cập nhật'});
//   } catch (error) {
//     res.status(500).json({ error: error.message });
//   }
// };


// // Xóa sản phẩm
// exports.deleteProduct = (req, res) => {
//   const { id } = req.params;
  
//   db.query('DELETE FROM products WHERE product_id = ?', [id], (err, results) => {
//     if (err) return res.status(500).json({ error: err.message });
//     if (results.affectedRows === 0) return res.status(404).json({ error: 'Không tìm thấy sản phẩm' });
//     res.json({ message: 'Xóa sản phẩm thành công' });
//   });
// };
// exports.searchProducts = (req, res) => {
//   const searchQuery = req.query.query; // Lấy từ khóa tìm kiếm từ query string

//   if (!searchQuery) {
//       return res.status(400).json({ error: "Thiếu từ khóa tìm kiếm" });
//   }

//   const query = `
//       SELECT * FROM products 
//       WHERE name LIKE ? OR brand LIKE ? OR description LIKE ?
//   `;
//   const searchPattern = `%${searchQuery}%`; // Tìm kiếm gần đúng (LIKE %query%)
  
//   db.query(query, [searchPattern, searchPattern, searchPattern], (err, results) => {
//       if (err) return res.status(500).json({ error: "Lỗi khi tìm kiếm sản phẩm" });
//       res.json({ products: results });
//   });
// };

const db = require('../config/db'); // pool từ mysql2/promise
const cloudinary = require('cloudinary').v2;

<<<<<<< HEAD
// Cấu hình Cloudinary (Nên đặt trong file config riêng hoặc .env)
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});
const BASE_URL = "http://10.0.2.2:5000";
=======
const BASE_URL = "http://10.0.2.2:5001";
>>>>>>> 489487e32b106b85fcd0647276a92ca4fbf809c8

const uploadToCloudinary = async (file) => {
  try {
    // Upload file từ đường dẫn tạm (req.file.path)
    const result = await cloudinary.uploader.upload(file.path, {
      folder: 'shoe_store_products', // Tên thư mục trên Cloudinary
      use_filename: true,
    });
    return result.secure_url; // Trả về link ảnh online
  } catch (error) {
    console.error("Cloudinary upload error:", error);
    throw new Error('Lỗi khi upload ảnh');
  }
};
// Lấy tất cả sản phẩm
exports.getAllProducts = async (req, res) => {
  try {
    const [products] = await db.query(`
      SELECT 
        p.*,
        COALESCE(AVG(r.rating), 0) AS avg_rating,
        COALESCE(COUNT(r.review_id), 0) AS rating_count
      FROM products p
      LEFT JOIN reviews r ON p.product_id = r.product_id
      GROUP BY p.product_id
    `);
    res.json({ success: true, data: products });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// Lấy chi tiết sản phẩm
exports.getProductById = async (req, res) => {
  try {
    const [products] = await db.query('SELECT * FROM products WHERE product_id = ?', [req.params.id]);
    const product = products[0];
    if (!product) {
      return res.status(404).json({ success: false, error: 'Không tìm thấy sản phẩm' });
    }

    const [categories] = await db.query('SELECT * FROM categories WHERE category_id = ?', [product.category_id]);
    const category = categories.length ? categories[0] : null;

    const [variants] = await db.query('SELECT * FROM productvariants WHERE product_id = ?', [product.product_id]);

    res.json({ success: true, data: { product, category, variants } });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

exports.getTopRatedProducts = async (req, res) => {
  try {
    const [products] = await db.query(`
      SELECT 
          p.*,
          AVG(r.rating) AS avg_rating,
          COUNT(r.review_id) AS rating_count
      FROM products p
      LEFT JOIN reviews r ON p.product_id = r.product_id
      GROUP BY p.product_id
      ORDER BY avg_rating DESC, rating_count DESC
      LIMIT 4
    `);

    res.json({ success: true, data: products });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// Tạo sản phẩm mới
exports.createProduct = async (req, res) => {
  try {
    const { name, description, price, category_id, brand, stock } = req.body;
    let image = req.body.image; // Lấy link ảnh nếu gửi dạng text

    // Nếu có file upload, ưu tiên dùng file và up lên Cloudinary
    if (req.file) {
      image = await uploadToCloudinary(req.file);
    }

    if (!name || !price) {
      return res.status(400).json({ error: 'Thiếu thông tin sản phẩm (Tên, Giá)' });
    }

    const [result] = await db.query(
      'INSERT INTO products (name, description, price, category_id, brand, stock, image) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [name, description, price, category_id, brand, stock, image]
    );

    res.status(201).json({ 
      success: true,
      message: 'Sản phẩm đã được thêm', 
      productId: result.insertId,
      imageUrl: image // Trả về link ảnh để FE cập nhật
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// Cập nhật sản phẩm
exports.updateProduct = async (req, res) => {
  try {
    const { id } = req.params;
    const updates = { ...req.body }; // Copy body để xử lý

    // Xử lý upload ảnh mới nếu có
    if (req.file) {
      const imageUrl = await uploadToCloudinary(req.file);
      updates.image = imageUrl; // Cập nhật field image
    }

    if (Object.keys(updates).length === 0) {
      return res.status(400).json({ error: 'Không có dữ liệu để cập nhật' });
    }

    // Tạo câu query động
    const fields = Object.keys(updates).map(field => `${field} = ?`).join(', ');
    const values = Object.values(updates);

    const [result] = await db.query(
      `UPDATE products SET ${fields} WHERE product_id = ?`,
      [...values, id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ success: false, error: 'Không tìm thấy sản phẩm' });
    }

    res.json({ success: true, message: 'Sản phẩm đã được cập nhật' });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// Xóa sản phẩm
exports.deleteProduct = async (req, res) => {
  try {
    const { id } = req.params;
    const [result] = await db.query('DELETE FROM products WHERE product_id = ?', [id]);
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Không tìm thấy sản phẩm' });
    }
    res.json({ message: 'Xóa sản phẩm thành công' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Tìm kiếm sản phẩm
exports.searchProducts = async (req, res) => {
  try {
    const searchQuery = req.query.query;
    if (!searchQuery) {
      return res.status(400).json({ error: 'Thiếu từ khóa tìm kiếm' });
    }

    const searchPattern = `%${searchQuery}%`;

    const [results] = await db.query(`
      SELECT * FROM products 
      WHERE name LIKE ? OR brand LIKE ? OR description LIKE ?
    `, [searchPattern, searchPattern, searchPattern]);

    res.json({ data: results });
  } catch (error) {
    res.status(500).json({ error: 'Lỗi khi tìm kiếm sản phẩm' });
  }
};
