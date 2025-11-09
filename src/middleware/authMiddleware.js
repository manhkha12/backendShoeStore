const jwt = require("jsonwebtoken");
const dotenv = require("dotenv");

dotenv.config();

const verifyToken = (req, res, next) => {
  try {
    // Lấy token từ header
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({
      success: false,
      message: "Token không hợp lệ hoặc không tồn tại",
    });
  }

    // Kiểm tra format của token
    const token = authHeader.split(" ")[1];
    if (!token) {
      return res.status(401).json({
        success: false,
        message: "Token không đúng định dạng",
      });
    }

    // Xác thực token
    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET || "your_jwt_secret"
    );

    // Lưu thông tin user vào request
req.user = {
  userId: decoded.userId,
  email: decoded.email,
  role: decoded.role,
};

console.log("✅ Xác thực token thành công:", req.user);


    next();
  } catch (error) {
    console.error("Lỗi xác thực token:", error);

    if (error.name === "TokenExpiredError") {
      return res.status(401).json({
        success: false,
        message: "Token đã hết hạn",
      });
    }

    if (error.name === "JsonWebTokenError") {
      return res.status(401).json({
        success: false,
        message: "Token không hợp lệ",
      });
    }

    return res.status(401).json({
      success: false,
      message: "Xác thực thất bại",
      error: error.message,
    });
  }
};

module.exports = verifyToken;
