const db = require('../config/db');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

exports.register = async (req, res) => {
  

  try {
    const { username, email, password } = req.body;
    // Kiểm tra email và username đã tồn tại chưa trong một truy vấn duy nhất
    const [existingUser] = await db.query(
      "SELECT * FROM users WHERE email = ? OR username = ?",
      [email, username]
    );

    if (existingUser.length > 0) {
      return res.status(400).json({ message: "Email hoặc tên người dùng đã tồn tại" });
    }

    // Mã hóa mật khẩu và tạo tài khoản
    const hashedPassword = await bcrypt.hash(password, 10);
    await db.query(
      "INSERT INTO users (username, email, password,role) VALUES (?, ?, ?,'customer')",
      [username, email, hashedPassword]
    );

    res.status(201).json({
      success: true,
      message: "Đăng ký tài khoản thành công",
      data: {
        id: result.insertId,
        email,
        fullName,
        role: "user",
      },
    });
  } catch (error) {
    console.error("Lỗi khi đăng ký:", error);
    res.status(500).json({ error: "Lỗi server" });
  }
};

// Hàm đăng nhập người dùng
exports.login = async (req, res) => {


  try {
    const { email, password } = req.body;
    // Kiểm tra email và password
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: "Vui lòng nhập đầy đủ thông tin",
      });
    }
    const [results] = await db.query('SELECT * FROM users WHERE email = ?', [email]);
    if (results.length === 0) return res.status(401).json({ error: 'Email không tồn tại' });

    const user = results[0];
    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) return res.status(401).json({ error: 'Mật khẩu sai' });

    // Tạo token với role của user
    const accessToken = jwt.sign(
      { userId: user.user_id, email: user.email ,role: user.role },  // Thêm role vào JWT
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
      
    );
    
    // Tạo refresh token (thời gian sống 7 ngày)
    const refreshToken = jwt.sign(
      { userId: user.user_id },
      process.env.REFRESH_TOKEN_SECRET,
      { expiresIn: '7d' }
    );

    res.json({
      success: true,
      message: "Đăng nhập thành công",
      data: {
        accessToken,
        refreshToken,
        user: {
          user_id: user.user_id,
          username: user.username,
          full_name: user.full_name,
          email: user.email,
          role: user.role,
        },
      },
    });
  } catch (error) {
    console.error("Lỗi khi đăng nhập:", error);
    res.status(500).json({ error: "Lỗi server" });
  }
};

// Lấy thông tin người dùng
exports.getUserProfile = async (req, res) => {
  const userId = req.user.userId;

  try {
    const [results] = await db.query("SELECT user_id, username, email FROM users WHERE user_id = ?", [userId]);
    if (results.length === 0) return res.status(404).json({ message: "User không tồn tại" });

    res.json(results[0]);
  } catch (error) {
    console.error("Lỗi khi lấy thông tin người dùng:", error);
    res.status(500).json({ error: "Lỗi server" });
  }
};

// Cập nhật thông tin người dùng
exports.updateUserProfile = async (req, res) => {
  const userId = req.user.userId;
  const { username, email } = req.body;

  try {
    const [result] = await db.query("UPDATE users SET username = ?, email = ? WHERE user_id = ?", [username, email, userId]);
    if (result.affectedRows === 0) {
      return res.status(404).json({ message: "User không tồn tại" });
    }

    res.json({ message: "Profile cập nhật thành công" });
  } catch (error) {
    console.error("Lỗi khi cập nhật thông tin người dùng:", error);
    res.status(500).json({ error: "Lỗi server" });
  }
};

// Xóa tài khoản
exports.deleteUserAccount = async (req, res) => {
  const userId = req.user.userId;

  try {
    const [result] = await db.query("DELETE FROM users WHERE user_id = ?", [userId]);
    if (result.affectedRows === 0) {
      return res.status(404).json({ message: "User không tồn tại" });
    }

    res.json({ message: "Tài khoản đã được xóa thành công" });
  } catch (error) {
    console.error("Lỗi khi xóa tài khoản:", error);
    res.status(500).json({ error: "Lỗi server" });
  }
};


exports.verifyAuthToken = async (req, res) => {
  const { token } = req.headers; // Lấy access token từ header

  if (!token) {
    return res.status(401).json({ message: "Token không tồn tại" });
  }

  try {
    // Giải mã token để lấy thông tin người dùng
    jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
      if (err) {
        // Token hết hạn hoặc không hợp lệ, yêu cầu làm mới token
        return res.status(401).json({ message: "Token hết hạn hoặc không hợp lệ" });
      }

      req.user = decoded;
      return res.status(200).json({ message: "Token hợp lệ", user: decoded });
    });
  } catch (error) {
    console.error("Lỗi khi xác minh token:", error);
    res.status(500).json({ error: "Lỗi server" });
  }
};

// Hàm làm mới access token
exports.refreshToken = async (req, res) => {
  // Lấy token từ header: Authorization: Bearer <refresh_token>
  const authHeader = req.headers['authorization'];
  const refreshToken = authHeader && authHeader.split(' ')[1];

  if (!refreshToken) {
    return res.status(400).json({ error: "Refresh token is required" });
  }

  try {
    jwt.verify(refreshToken, process.env.REFRESH_TOKEN_SECRET, async (err, decoded) => {
      if (err) {
        return res.status(403).json({ error: "Refresh token không hợp lệ" });
      }

      const [results] = await db.query('SELECT * FROM users WHERE user_id = ?', [decoded.userId]);
      if (results.length === 0) {
        return res.status(404).json({ error: "User không tồn tại" });
      }

      const user = results[0];

      const accessToken = jwt.sign(
        { userId: user.user_id, email: user.email, role: user.role },
        process.env.JWT_SECRET,
        { expiresIn: '1h' }
      );
      // Tạo refresh token (thời gian sống 7 ngày)
    const refreshToken = jwt.sign(
      { userId: user.user_id },
      process.env.REFRESH_TOKEN_SECRET,
      { expiresIn: '7d' }
    );

      res.json({
        success: true,
        data: {
          accessToken,
          refreshToken:refreshToken,
          user: {
            user_id:user.user_id,
            email: user.email,
            username: user.username,
            role: user.role,
            userName: user.userName,
          },
        },
      });
    });
  } catch (error) {
    console.error("Lỗi khi làm mới token:", error);
    res.status(500).json({ error: "Lỗi server" });
  }
};



exports.updatePasswordByUserId = async (req, res) => {
  const { id } = req.params;
  const { oldPassword, newPassword } = req.body;

  if (!newPassword || !oldPassword) {
    return res.status(400).json({ error: "Thiếu mật khẩu cũ hoặc mật khẩu mới" });
  }

  try {
    // Kiểm tra mật khẩu cũ
    const [userResults] = await db.query("SELECT * FROM users WHERE user_id = ?", [id]);
    if (userResults.length === 0) {
      return res.status(404).json({ error: "User không tồn tại" });
    }

    const user = userResults[0];
    const isMatch = await bcrypt.compare(oldPassword, user.password);
    if (!isMatch) return res.status(401).json({ error: "Mật khẩu cũ không chính xác" });

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    await db.query("UPDATE users SET password = ? WHERE user_id = ?", [hashedPassword, id]);

    res.json({ message: "Cập nhật mật khẩu thành công" });
  } catch (error) {
    console.error("Lỗi khi cập nhật mật khẩu:", error);
    res.status(500).json({ error: "Lỗi server" });
  }
};
