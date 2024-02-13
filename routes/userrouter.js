const express = require('express');
const router = express.Router();
const userController = require('../controllers/usercontroller');
const userAuth = require('../middleware/userAuth')
const nodemailer=require('nodemailer');
const usercontroller = require('../controllers/usercontroller');
const cartcontroller = require('../controllers/cartcontroller');
const ordercontroller = require('../controllers/ordercontroller');





// home before login
router.get('/',userAuth.userExist,userController.showUserHomePage)

//login
router.get('/login',userAuth.userExist,userController.showLoginPage);
router.post('/login',userController.userLogin)

//signup
router.get('/signup',userAuth.userExist,userController.showSignupPage);
router.post('/signup',userAuth.userExist,userController.signupPost)
router.get('/otp',userAuth.userExist,userController.getOtpPage)


router.get('/resetpassword', userController.showResetPassword);
router.get('/forgetpassword', userController.showForgetPassword);

//home afterlogin
router.get('/userhome', userController.showUserHomePage);

router.get('/userhomeafterlogin', userController.showUserHomeafterLogin);



router.get('/products/:categoryName', userController.showUserProductList);
// router.get('/userhome1', userController.showUserHomePage1);
// router.get('/productlist', userController.showUserProductList);
router.get('/productdetails/:productId', userController.showUserProductDetails);


router.post('/otpvalidate',userAuth.userExist, userController.validateOtp)

//profile

router.get('/profile',userAuth.verifyUser,userController.getProfilePage)
router.post('/updateProfile', userController.updateUserProfile);

//Address

router.get('/addressbook',userController.getAddressPage)
router.post('/addaddress',userController.postaddAddress)
router.get('/getaddress/:addressId', userController.getAddress);
router.post('/editaddress',userController.editAddress)
router.delete('/deleteaddress/:addressId',userController.deleteAddress)

//cart
router.get('/cart',cartcontroller.getCartPage)
router.post('/addToCart',cartcontroller.addToCart)
router.post('/removeFromCart',cartcontroller.removeFromCart)
router.post('/updateQuantity',cartcontroller.updateCartItemQuantity)


//checkout
router.get("/checkout",cartcontroller.getCheckOutPage)

router.get("/placeorder",cartcontroller.getPlaceOrderPage)
router.post("/placeorder",cartcontroller.continueCheckOut)

router.post('/confirmorder', ordercontroller.placeOrder);

router.get("/paymentsuccess",cartcontroller.getPaymentSuccessPage)

//orders
router.get("/orders",ordercontroller.showOrdersPage)
router.get('/orderdetails/:orderId',ordercontroller.showOrderDetailsPage)

router.post('/cancelorder/:orderId',ordercontroller.cancelOrder)


module.exports = {router};
