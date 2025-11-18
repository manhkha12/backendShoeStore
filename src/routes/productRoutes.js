const express = require('express');
const { getAllProducts, getProductById,createProduct,updateProduct,deleteProduct,searchProducts,getTopRatedProducts } = require('../controllers/productController');
const upload = require('../middleware/uploadMiddleware');

const router = express.Router();

router.get('/', getAllProducts);
router.get('/search', searchProducts); // Thêm API tìm kiếm
router.get('/:id', getProductById);

router.get('/get_top_rate/top_rated', getTopRatedProducts);

router.post('/', upload.single('image'), createProduct); // Upload ảnh khi tạo sản phẩm
router.put('/:id', upload.single('image'), updateProduct); // Upload ảnh khi cập nhật sản phẩm

// router.post('/', createProduct);
// router.put('/:id', updateProduct);
router.delete('/:id', deleteProduct);


module.exports = router;
