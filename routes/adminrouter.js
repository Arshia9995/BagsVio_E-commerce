const express = require('express');
const admin = express.Router();
const bcrypt = require('bcryptjs');
const adminContoller = require('../controllers/admincontroller');
const categorycontroller = require("../controllers/categorycontroller")
const brandcontroller = require("../controllers/brandcontroller")
const productcontroller = require("../controllers/productcontroller");
const customercontroller = require('../controllers/customercontroller');
const upload = require('../middleware/multer')
const adminAuth = require('../middleware/adminAuth');
const ordercontroller = require('../controllers/ordercontroller');
const couponcontroller = require("../controllers/couponcontroller")
const offercontroller = require("../controllers/offercontroller")
const bannerController = require("../controllers/bannercontroller");



admin.get('/',adminAuth.adminExist, adminContoller.toLogin);
admin.post('/adminlog',adminContoller.adminLogin);

admin.get('/admindashboard',adminAuth.verifyadmin, adminContoller.admindashboard);

// admin.get('/product', adminContoller.adminproduct);

// admin.get('/addproduct', adminContoller.addproduct);

//................................................category routes......................................................................

admin.get('/category',adminAuth.verifyadmin, categorycontroller.category);


admin.get('/addcategory',adminAuth.verifyadmin, categorycontroller.getaddcategory);
admin.post('/addcategory',adminAuth.verifyadmin,categorycontroller.postaddcategory)


admin.get('/editcategory/:id',adminAuth.verifyadmin,categorycontroller.editCategory)
admin.post('/editcategory/:id',adminAuth.verifyadmin,categorycontroller.editedCategory)


admin.get('/deletecategory/:id',adminAuth.verifyadmin,categorycontroller.deleteCategory)

admin.post('/blockcategory/:categoryId',adminAuth.verifyadmin,categorycontroller.BlockCategory)
admin.post('/unblockcategory/:categoryId',adminAuth.verifyadmin,categorycontroller.UnblockCategory)




//................................................... End of Category .........................................................................

// ....................................................brand routes.................................................................................

admin.get('/brand',adminAuth.verifyadmin,brandcontroller.Brand)

admin.get('/addbrand',adminAuth.verifyadmin,brandcontroller.getaddBrand)
admin.post('/addbrand',adminAuth.verifyadmin,brandcontroller.postaddBrand)

admin.get('/editbrand/:id',adminAuth.verifyadmin,brandcontroller.editBrand);
admin.post('/editbrand/:id',adminAuth.verifyadmin,brandcontroller.editedBrand);

admin.get('/deletebrand/:id',adminAuth.verifyadmin,brandcontroller.deleteBrand)


admin.post('/blockbrand/:brandId',adminAuth.verifyadmin,brandcontroller.Blockbrand)
admin.post('/unblockbrand/:brandId',adminAuth.verifyadmin,brandcontroller.Unblockbrand)


// ...................................................end of brand........................................................................

// ....................................................product route......................................................................
admin.get('/adminproduct',adminAuth.verifyadmin,productcontroller.getProductPage)

 admin.get('/addproduct', adminAuth.verifyadmin,productcontroller.getaddProduct);
 admin.post('/addproduct',adminAuth.verifyadmin,upload.fields([{name:'image1',maxCount:1},{name:'image2',maxCount:1},{name:'image3',maxCount:1},{name:'image4',maxCount:1}]),productcontroller.postaddProduct)



// admin.post('/blockproduct/:productId',productcontroller.Blockproduct)
// admin.post('/unblockproduct/:productId',productcontroller.Unblockproduct)

 admin.get('/editproduct/:id',adminAuth.verifyadmin,productcontroller.editProduct)
 admin.post('/editproduct/:id',adminAuth.verifyadmin,upload.fields([{name:'image1',maxCount:1},{name:'image2',maxCount:1},{name:'image3',maxCount:1}]),productcontroller.postEditProduct)

 
admin.post('/blockproduct/:productId',adminAuth.verifyadmin,productcontroller.BlockProduct)
admin.post('/unblockproduct/:productId',adminAuth.verifyadmin,productcontroller.UnblockProduct)




// .....................................................end of product..................................................................

// ......................................................customer route..................................................................

admin.get('/customers',adminAuth.verifyadmin,customercontroller.Customers)
admin.post('/block/:customerId',adminAuth.verifyadmin,customercontroller.BlockCustomer)
admin.post('/unblock/:customerId',adminAuth.verifyadmin,customercontroller.UnblockCustomer)


//order
admin.get('/order',ordercontroller.adminOrderPage)
admin.get('/orderview/:orderId',ordercontroller.adminOrderViewPage)

admin.post("/updateOrderStatus/:orderId",ordercontroller.updateOrderStatus)

//coupons

admin.get('/coupon',couponcontroller.getCouponPage)

admin.post('/addcoupon',couponcontroller.postAddCoupon)
admin.post("/editcoupon/:couponId",couponcontroller.postEditCoupon)

admin.delete("/deletecoupon/:couponId",couponcontroller.postdeletecoupon)

//offers

admin.get("/productoffer",offercontroller.getProductOfferPage)
admin.get("/products",offercontroller.getProduct)
admin.post("/addOffer",offercontroller.postProductOffer)


admin.post("/editoffer/:offerId",offercontroller.posteditProductOffer)

//sales

admin.get("/sales",adminContoller.getSalesPage)
admin.get('/count-orders-by-day',adminContoller.getCount)
admin.get('/count-orders-by-month',adminContoller.getCount)
admin.get('/count-orders-by-year',adminContoller.getCount)



admin.post('/download-sales-report',adminContoller.getDownloadSalesReport)

//banner

admin.get('/banner',bannerController.getBannerPage)
admin.post('/addbanner',  bannerController.addBanner);
admin.delete('/deletebanner/:bannerId', bannerController.deleteBanner);




module.exports = {admin};
