require("dotenv").config();
const express = require("express");
const cors = require("cors");
const path = require("path");
const app = express();

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const PORT = process.env.PORT || 5001;

// Import routes
const authRoutes = require("./routes/authRoutes");
const productRoutes = require("./routes/productRoutes");
const cartRoutes = require("./routes/cartRoutes");
const orderRoutes = require("./routes/orderRoutes");
const imageRoutes = require("./routes/imageRoutes");
const reviewRoutes = require("./routes/reviewRoutes");
const paymentRoutes = require("./routes/paymentRoutes");
// Dùng routes
app.use("/api/auth", authRoutes);
app.use("/api/products", productRoutes);
app.use("/api/cart", cartRoutes);
app.use("/api/order", orderRoutes);
app.use("/api/images", imageRoutes); // Gắn route ảnh
app.use("/api/review", reviewRoutes); // Gắn route đánh giá
app.use("/api/payment", paymentRoutes);
// Cấu hình để truy cập ảnh qua HTTP
app.use("/uploads", express.static(path.join(__dirname, "../uploads")));
console.log("STATIC PATH:", path.join(__dirname, "../uploads"));


app.listen(PORT, () => {
  console.log(`Server chạy tại http://localhost:${PORT}`);
});
app.get("/", (req, res) => {
  res.send("Server đang chạy thành công!");
});
