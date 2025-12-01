const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Đảm bảo thư mục 'uploads' tồn tại
const uploadDir = 'uploads/';
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir);
}

// Cấu hình lưu trữ trên ổ đĩa (DiskStorage)
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadDir); // Lưu file vào thư mục 'uploads/'
  },
  filename: function (req, file, cb) {
    // Đặt tên file duy nhất: timestamp + random + extension
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

// Bộ lọc file (Chỉ chấp nhận ảnh)
const fileFilter = (req, file, cb) => {
  if (file.mimetype.startsWith('image/')) {
    cb(null, true);
  } else {
    cb(new Error('Chỉ chấp nhận file ảnh!'), false);
  }
};

const upload = multer({ 
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024 // Giới hạn 5MB
  },
  fileFilter: fileFilter
});

module.exports = upload;