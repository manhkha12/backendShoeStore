const path = require("path");
const fs = require("fs");
const db = require("../config/db");

const BASE_URL = "http://10.0.2.2:5001"; // Cấu hình URL backend (thay đổi nếu cần)

const getProductImage = async (req, res) => {
  try {
    const { filename } = req.params;
    const imagePath = path.join(__dirname, "../../uploads", filename);
    console.log("IMAGE PATH:", imagePath);


    if (!fs.existsSync(imagePath)) {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy ảnh",
      });
    }

    const ext = path.extname(filename).toLowerCase();
    const mimeTypes = {
      ".jpg": "image/jpeg",
      ".jpeg": "image/jpeg",
      ".png": "image/png",
      ".gif": "image/gif",
    };

    // Set kiểu nội dung dựa trên đuôi file
    res.setHeader("Content-Type", mimeTypes[ext] || "application/octet-stream");
    res.sendFile(imagePath);
  } catch (error) {
    console.error("Error serving image:", error);
    res.status(500).json({
      success: false,
      message: "Không thể tải ảnh",
    });
  }
};

const uploadProductImage = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: "Không có file được tải lên",
      });
    }

    const filename = req.file.filename;
    const productId = req.body.productId;

    // Kiểm tra định dạng file ảnh
    const ext = path.extname(filename).toLowerCase();
    const allowedMimeTypes = [".jpg", ".jpeg", ".png", ".gif"];

    if (!allowedMimeTypes.includes(ext)) {
      return res.status(400).json({
        success: false,
        message: "Tệp tải lên không phải là ảnh hợp lệ",
      });
    }

    // Cập nhật đường dẫn ảnh trong cơ sở dữ liệu
     await db.query(
      "UPDATE products SET image = ? WHERE product_id = ?",
      [`${BASE_URL}/uploads/${filename}`, productId]
    );

    

    res.json({
      success: true,
      message: "Tải ảnh lên thành công",
      data: {
        filename: `${BASE_URL}/uploads/${filename}`,
        path: `/uploads/${filename}`,
        
      },
    });
  } catch (error) {
    console.error("Lỗi ngoài:", error);
    res.status(500).json({
      success: false,
      message: "Lỗi máy chủ",
    });
  }
};

module.exports = {
  getProductImage,
  uploadProductImage,
};
