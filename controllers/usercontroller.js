const user = require('../models/user')
const Product = require('../models/productSchema');
const category = require('../models/categorySchema');
const Address=require('../models/address')
const bcrypt = require('bcryptjs');
const sendOTP = require('./otpcontroller');
const Otp=require('../models/otpSchema');
const Users = require('../models/user');
const flash=require('express-flash')
const Wallet=require('../models/wallet');
const session = require('express-session');
const Orders = require('../models/order')
const invoice = require("../utility/invoice");
const Banner = require("../models/banner")
const Review = require("../models/review")
const generateOtp =  require('../utility/generateOtp')
const Brands = require("../models/brandSchema")
const PDFDocument = require("pdfkit");

module.exports = 
{
  
    showHomePage: async(req, res) => {
        try {
        
        const categories=await category.find({})
        const products=await Product.find({})
            res.render('user/home',{categories})
        } catch (e) {
            console.log(e)
        }
    },
    showLoginPage: async(req, res) => {
       const categories = await category.find();
        try {
            if(req.session.userIsLoged != null){
                  res.redirect('/userhome')
              }else{
                  res.render('user/userlog',{categories})
              }
        } catch (e) {
            console.log(e)
        }
    },
    showUserHomeafterLogin: (req, res) => {
        try {

            res.render('user/userhomeafterlogin')
        } catch (e) {
            console.log(e)
        }
    },
    showUserProductList:async (req, res) => {
        try {
            const categories = await category.find({});
            const brands = await Brands.find();
            const selectedCategoryName = req.params.categoryName;
      
            const selectedCategory = await category.findOne({ categoryName: selectedCategoryName });
        
            if (!selectedCategory) {
              
              return res.status(404).send('Category not found');
            }


           
    const page = parseInt(req.query.page) || 1; 
    const perPage = 6; 
    const skip = (page - 1) * perPage; 
    const totalProducts = await Product.countDocuments({ Category: selectedCategory._id, isBlocked: false });
    const totalPages = Math.ceil(totalProducts / perPage); 


            let sortOption = {};
           
            if (req.query.sortOptions) {
                switch (req.query.sortOptions) {
                    case 'priceAsc':
                        sortOption = { Price: 1 };
                        break;
                    case 'priceDesc':
                        sortOption = { Price: -1 };
                        break;
                }
            }
           

    const selectedBrands = req.query.brands ? req.query.brands.split(',') : [];

   
    let filterOptions = { Category: selectedCategory._id, isBlocked: false };
    if (selectedBrands.length > 0) {
      filterOptions.BrandName = { $in: selectedBrands };
    }

    
           
            const products = await Product.find(filterOptions).sort(sortOption).skip(skip).limit(perPage);
           
           
        
            res.render('user/productlist', { categories, products, selectedCategory: selectedCategoryName,brands,totalPages, currentPage: page });
          } catch (e) {
            console.error(e);
            res.status(500).send('Internal Server Error');
          }
        },
        showAllProducts: async (req,res)=> {
          const categories = await category.find();
          const brands = await Brands.find();

          let sortOption = {};
        

          if (req.query.sortOptions) {
              switch (req.query.sortOptions) {
                  case 'priceAsc':
                      sortOption = { Price: 1 };
                      break;
                  case 'priceDesc':
                      sortOption = { Price: -1 };
                      break;
              }
          }
        

          const selectedBrands = req.query.brands ? req.query.brands.split(',') : [];

          let filterOptions = {  isBlocked: false };
          if (selectedBrands.length > 0) {
          filterOptions.BrandName = { $in: selectedBrands };
        } 

          const PAGE_SIZE = 6;
          const currentPage = parseInt(req.query.page) || 1;

          const totalProductsCount = await Product.countDocuments(filterOptions);
          const totalPages = Math.ceil(totalProductsCount / PAGE_SIZE);


          const products = await Product.find(filterOptions)
          .sort(sortOption)
          .skip((currentPage - 1) * PAGE_SIZE)
          .limit(PAGE_SIZE)
          .populate('Category')
          .populate('BrandName');

          
 res.render('user/seeallproducts', {
            categories,
            brands,
            products,
            totalPages,
            currentPage,
            sortOptions: req.query.sortOptions, 
            brandsQuery: req.query.brands 
            
        })
        },

    showUserProductDetails:async (req, res) => {
        try {
         
            const productId=req.params.productId
          
          
            const categories = await category.find({});
            const products= await Product.findOne({_id:productId}).populate('BrandName').populate('Category')
          
            const productReviews = await Review.find({productId: productId})
         
            res.render('user/productdetails',{categories,products,productReviews})
        } catch (e) {
            console.log(e)
        }
    },
    sortOrder:async (req, res) => {
      const sortOrder = req.params.order; 
      try {
      
        const sortedProducts = await Product.find().sort({ Price: sortOrder });
        res.json(sortedProducts);
      } catch (error) {
        console.error('Error fetching sorted products:', error);
        res.status(500).json({ error: 'Internal Server Error' });
      }
    },



    filterProductsByBrand : async (req, res) => {
      const selectedBrands = req.query.brands.split(','); 
      try {
       
        const filteredProducts = await Product.find({ BrandName: { $in: selectedBrands } });
       
    
        
        res.json(filteredProducts);
      } catch (error) {
        console.error('Error filtering products:', error);
        res.status(500).json({ error: 'Internal Server Error' });
      }
    },
  


  searchResults: async (req, res) => {
    try {
        const query = req.query.q; 
        const categories = await category.find({});
        const brands = await Brands.find();

       
        let sortOption = {};
        if (req.query.sortOptions) {
            switch (req.query.sortOptions) {
                case 'priceAsc':
                    sortOption = { Price: 1 };
                    break;
                case 'priceDesc':
                    sortOption = { Price: -1 };
                    break;
            }
        }

       
        const selectedBrands = req.query.brands ? req.query.brands.split(',') : [];
        
      
        let filterOptions = { 
            isBlocked: false
        };

        
        if (query) {
            filterOptions.ProductName = { $regex: new RegExp(query, 'i') };
        }

       
        if (selectedBrands.length > 0) {
            filterOptions.BrandName = { $in: selectedBrands };
        }

        
        const products = await Product.find(filterOptions)
            .sort(sortOption)
            .populate('Category')
            .populate('BrandName');

        
        res.render('user/searchresults', { products, query, categories, brands });

    } catch (error) {
        console.error('Error searching for products:', error);
        res.status(500).send('Internal Server Error');
    }
},

   
   
    showSignupPage: async(req, res) => {
      
      const categories = await category.find();
        res.render('user/usersignup', { messages: req.flash('error') ,categories});
    },
    showForgetPassword: async(req, res) => {
      const categories = await category.find({});
        res.render('user/forgetpassword',{categories})
    },
    showReqOtpPage:(req,res)=>{
      res.render('user/reqotp')
    },
    requestOtp:async(req,res)=>{
      try {

          
        const {email} =req.body;
        const userExist = await Users.findOne({email:email})


        if(!userExist){
          res.render('user/usersignup',{err:"user not found"})
       }

       const createdOTP= await sendOTP(email);
     
       req.session.email=email;
       res.render('user/reqotp')
        
      } catch (error) {
        
      }
    },
    validatereqOtp:async(req,res)=>{

      try {
      const email=req.session.email
      const { otp1, otp2, otp3, otp4 } = req.body;
      const enteredOtp = otp1 + otp2 + otp3 + otp4;

    
      const createdOTPrecord = await Otp.findOne({ email, otp: enteredOtp });

      if (!createdOTPrecord) {
        
        return res.render('user/reqotp', { error: 'Invalid OTP' });
      }
       

       res.render('user/resetpassword')
        
      } catch (error) {
       
        res.status(500).json({ error: 'Internal Server Error' });
        
      }

      


    },

    resendOTP: async (req, res) => {
      try {
       
          const { email } = req.session.signupDetails; 
       
          
        
          delete req.session.signupDetails.otp;
  
     
          const newOtp = generateOtp();
          
         
          req.session.signupDetails.otp = newOtp;
  
         
          await sendOTP(email, newOtp);
  
          console.log('resend otp send ')
        
          res.json({success:true})
      } catch (error) {
          console.error('Error resending OTP:', error);
          res.status(500).json({ error: 'Internal Server Error' });
      }
  },

    showResetPassword:(req,res)=>{
    
      res.render('user/resetpassword')
    },


    resetPassword:async(req,res)=>{
      try {
        const email=req.session.email ;
        const{newPassword, confirmPassword}=req.body
        const categories = await category.find();

        const hashedPassword = await bcrypt.hash(newPassword, 10);

        const user = await Users.findOneAndUpdate({ email },{ $set: { password: hashedPassword } },{ new: true });
      
       const error=''
        
       
        return res.render('user/userlog',{error,categories})

      } catch (error) {
        
      }
     },
     showChangePassword:async(req,res)=>{
      
        const categories=await category.find()
        const email = req.session.email; 

        const user = await Users.findOne({ email: email }); 
         res.render('user/changepassword',{categories,user})
        
      
     },

     postChangePassword:async (req, res) => {
    
      const { currentPassword, newPassword, confirmPassword } = req.body;
      console.log(req.body,"qqqqqqqqqq")
      const user = req.session.user
      console.log(user.password);
      console.log(user,"uuuuuuu");
      const categories = await category.find()
     

      const isPasswordValid = await bcrypt.compare(currentPassword, user.password);
      if (!isPasswordValid) {
        return res.render('user/changepassword',{err:'Current password is incorrect',categories});
    }
  
     
      if (newPassword !== confirmPassword) {
          return res.render('user/changepassword',{err:'New password and confirm password do not match',categories});
      }
      try {
       
        const hashedPassword = await bcrypt.hash(newPassword, 10);

       
        await Users.findByIdAndUpdate(user._id, { password: hashedPassword });

       
        res.redirect('/profile'); 
    } catch (err) {
        console.error('Error updating password:', err);
        return res.status(500).send('An error occurred while updating the password');
    }
  },
  
     
    showUserHomePage:async (req, res) => {
     
      

        const banners = await Banner.find().sort({ createdAt: 1 }).populate('category');;
        const categories=await category.find()
        const newarrival = await Product.find({ isNewArrival: true, isBlocked: false })
        const newtrends = await Product.find({ isNewTrends: true, isBlocked: false })
        
        
        res.render('user/userhome',{categories,newarrival,newtrends,banners})
    },

    getUserSignupWithReferralCode: async (req, res) => {
      try {
        const _id = req.params._id;
        req.session.refid = _id
      
        res.redirect("/signup");
      } catch (error) {
        console.log(error);
      }
    },


    signupPost: async (req,res)=>{

        try{
            
          
        const {name,email,password,confirmPassword} =req.body;
        const userExist = await user.findOne({email:email})
        const categories = await category.find()
       
         

         if(userExist){
            res.render('user/usersignup',{err:"user already exist",categories})
         }
       
        const hashedPassword = await bcrypt.hash(password, 10);
         req.session.signupDetails={name,email,password}
         console.log('this is the signupdetails',req.session.signupDetails)
        
        const createdOTP= await sendOTP(email);
        console.log(createdOTP,'otp created');

       

         res.redirect('/otp')

        
        }catch(error){
            console.log(error)
            if(error.code === 11000){
                console.log('error unique');
               
            }
           
        }
     },

     getOtpPage:(req,res)=>{
      console.log('getotp page called')
      res.render('user/otp')
     },

     userLogin: async (req, res) => {
        try {
        
          const { email, password } = req.body;
          const categories = await category.find()
          const userfound = await user.findOne({ email: email });
          console.log(email)
     
          if (!userfound) {
            return res.render('user/userlog', { err: 'User not found',categories });
          }
      
          if (userfound.isBlocked) {
            return res.render('user/userlog', { err: 'User is blocked. Contact the administrator.' ,categories});
          }
      
          const passwordMatch = await bcrypt.compare(password, userfound.password);
        
      
          if (!passwordMatch) {
            return res.render('user/userlog', { err: 'Invalid Credentials',categories });
          }
      
          req.session.userLogged = true;
          req.session.email = email;
          req.session.user= userfound;
          req.session.userIsLoged = email;
          req.session.userId=userfound
          console.log( 'gfdgsgdgdgdfg',req.session.email )
         
      
          res.redirect('/userhome');
        } catch (error) {
          console.log(error);
          res.send('Error occurred while login');
        }
      }
      ,

     validateOtp: async (req, res) => {
        try {
      
        
        console.log(req.session.refid,'======')
        let referrerUsedUser;
    



          const categories = await category.find({});
          console.log('verifying otp..');
          const { otp1, otp2, otp3, otp4 } = req.body;
          const enteredOtp = otp1 + otp2 + otp3 + otp4;
          console.log('signupdetails>>>>>>>>>>>>>>>>>><<<<<<,',req.session.signupDetails)
          const {name, email, password }=req.session.signupDetails

          // req.session.email = email
          // req.session.userLogged = true
          // req.session.save()
         
          console.log('Email', email);
          console.log("entered otp", enteredOtp);
          const createdOTPrecord = await Otp.findOne({ email, otp: enteredOtp });
          const banners = await Banner.find().sort({ createdAt: 1 }).populate('category');;
          const newarrival = await Product.find({ isNewArrival: true, isBlocked: false })
          const newtrends = await Product.find({ isNewTrends: true, isBlocked: false })
    
          if (!createdOTPrecord) {
            console.log('Invalid OTP Rendering user/Otp...')
            return res.render('user/otp', { error: 'Invalid OTP' });
          }

          const hashedPassword = await bcrypt.hash(password, 10);
           const newUser = new user({
            name:name,
            email:email,
            password:hashedPassword,
            
        })
       
        const savedUser= await newUser.save()
        referrerUsedUser = savedUser._id
      
      const newWallet = new Wallet({
      userId: savedUser._id, 
      balance: 0, 
      transactions: [], 
    });

     
      await newWallet.save();
      if(req.session.refid){
        let userId = req.session.refid
        const incremented = await Wallet.findOneAndUpdate(
          { userId }, 
          {
            $inc: { balance: 100 }, 
            $push: {
              transactions: {
                transactionType: 'referral',
                amount: 100,
                from: referrerUsedUser
              }
            }
          },
          { new: true })
       
      }
      req.session.refid = null;
      req.session.userLogged = true;
      req.session.email = email;
      req.session.user= savedUser;
      req.session.userIsLoged = email;
      req.session.userId=savedUser
        req.session.userLogged=savedUser
          return res.render('user/userhome', {  categories,newarrival,newtrends,banners });
        }
        catch (error) {
          console.error('Error in OTP verification:', error);
          res.status(500).json({ error: 'Internal Server Error' });
        }
      },

      getProfilePage:async(req,res)=>{
        try{
        const categories=await category.find()
        const userEmail = req.session.email; 

        const user = await Users.findOne({ email: userEmail }); 


        if (user) {
        
          res.render('user/profile', { user,categories });
          req.session.email=userEmail;
        } else {
          
          res.status(404).send('User not found');
        }
      } catch (err) {
       
        console.error('Error fetching user details:', err);
        res.status(500).send('Internal Server Error');
      
    
       
      }
    },
    updateUserProfile: async (req, res) => {
      const {  lastName, phoneNumber } = req.body;
      const email=req.session.email
   
  
      try {
       
        const updatedUser = await user.findOneAndUpdate(
          { email: email },
          { $set: { lastName: lastName, phoneNumber: phoneNumber } },
          { new: true }
        );
    
        if (!updatedUser) {
          return res.status(404).json({ message: 'User not found' });
        }
       
        return res.status(200).json({ message: 'User details updated successfully', user: updatedUser });
        
      } catch (error) {
        return res.status(500).json({ message: 'Error updating user details', error: error.message });
      }
    },

      getAddressPage:async(req,res)=>{

      const categories=await category.find()
      const email = req.session.email; 
      const user = await Users.findOne({ email: email }).populate('addresses');
    
     

      res.render('user/addressbook',{categories,addresses: user.addresses})
      },
      postaddAddress: async (req, res) => {
        try {
            const { name, addressline, pincode, street, city, state, mobile } = req.body;
            const userData = await Users.findOne({ email: req.session.email });
            
            if (!userData) {
                return res.status(404).json({ error: 'User not found' });
            }
    
            const userId = userData._id;
            let addressFound = await Address.findOne({ userId });
    
            const userAddress = {
                name,
                addressline,
                pincode,
                street,
                city,
                state,
                mobile
            };
    
            if (addressFound) {
                addressFound.addresses.push(userAddress);
                await addressFound.save();
            } else {
                addressFound = await Address.create({ userId, addresses: [userAddress] });
            }
    
            userData.addresses = addressFound._id
            await userData.save();
    
            req.flash("success", "Address added successfully");
            res.redirect('/addressbook');
        } catch (err) {
            console.error(err);
            res.status(500).json({ error: 'Failed to add address' });
        }
    },
    
getAddress:async(req,res)=>{
 
  const addressId = req.params.addressId;
 
  const userData = await Users.findOne({email:req.session.email})
  const userId = userData._id

  const userAddress = await Address.findOne({userId:userId})

  const userFirstAddress = userAddress.addresses.find(data => data._id.toString() === addressId.toString())
 

  if(userFirstAddress){
    return res.status(200).json({success:true,userFirstAddress})

  }else{
    return res.status(400).json({success:false})
  }

  
  
},
editAddress:async(req,res)=>{
  const userId=req.session.userId
  try {
   
    const {  name, addressline, pincode, street, city, state, mobile } = req.body;
    const categories=await category.find()


  
   
    const address = await Address.findOne({userId:userId});

    if (!address) {
      return res.status(404).json({ error: 'Address not found' });
    }

    
    address.addresses[0].name = name;
    address.addresses[0].addressline=addressline;
    address.addresses[0].pincode = pincode;
    address.addresses[0].street = street;
    address.addresses[0].city = city;
    address.addresses[0].state = state;
    address.addresses[0].mobile = mobile;
    
    const newaddress =await address.save();

   
    
    req.flash('success','address edited Successfully')
    res.redirect('/addressbook')
  } catch (error) {
    console.error('Error updating address:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
},

 deleteAddress:async(req, res)=> {
  const addressId = req.params.addressId;

  try {
    const user = await Users.findOne({ email: req.session.email });
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const userId = user._id;

    const deletedAddress = await Address.findOneAndUpdate(
      { userId: userId },
      { $pull: { addresses: { _id: addressId } } },
      { new: true }
    );

    if (!deletedAddress) {
      return res.status(404).json({ message: 'Address not found' });
    }

   
    await user.save();

    return res.status(200).json({ message: 'Address removed successfully' });
  } catch (error) {
    console.error('Error removing address:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
},
Logout: (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      console.error('Error destroying session:', err);
      res.status(500).send('Internal Server Error');
    } else {
      res.redirect('/login');
    }
  }); 
},
// downloadInvoice: async (req, res) => {
//   try {

//     const orderId = req.body.orderId;
//     const orderData = await Orders.findById(orderId)
//     .populate("userId") 
//     .populate("products.productId"); 

   
//     const filePath = await invoice.order(orderData);
    
//     res.json({ orderId });
//   } catch (error) {
//     console.error("Error in downloadInvoice:", error);
//     res.status(500).json({ error: "Internal Server Error" });
//   }
// },
// downloadfile: async (req, res) => {
//   const id = req.params._id;
//   // const filePath = `C:/Users/arshi/OneDrive/Desktop/project week1/public/pdf/${id}.pdf`;
//   const filePath = `/home/ubuntu/BagsVio_E-commerce/public/pdf/${id}.pdf`;
//   res.download(filePath, `invoice.pdf`);
// },


downloadInvoice: async (req, res) => {
    try {
      const orderId = req.params.id;

      // Fetch order details
      const orderData = await Orders.findById(orderId)
        .populate("userId")
        .populate("products.productId");

      if (!orderData) {
        return res.status(404).json({ error: "Order not found" });
      }

      // Set headers for PDF download
      res.setHeader("Content-Type", "application/pdf");
      res.setHeader(
        "Content-Disposition",
        `attachment; filename=invoice-${orderId}.pdf`
      );

      const doc = new PDFDocument({ margin: 50 });
      doc.pipe(res);

      // ---- HEADER ----
      doc
        .fontSize(20)
        .text("BagsVio E-Commerce", { align: "center" })
        .moveDown();

      doc.fontSize(12).text(`Invoice ID: INV-${orderId}`, { align: "right" });
      doc.text(`Date: ${orderData.orderDate.toLocaleDateString()}`, {
        align: "right",
      });
      doc.moveDown();

      // ---- ORDER INFO ----
      doc.fontSize(14).text("Order Information", { underline: true });
      doc.moveDown(0.5);
      doc.fontSize(12).text(`Order ID: ${orderData._id}`);
      doc.text(`Status: ${orderData.status}`);
      doc.text(`Payment Method: ${orderData.paymentMethod}`);
      doc.text(`Payment Status: ${orderData.paymentStatus}`);
      doc.moveDown();

      // ---- CUSTOMER INFO ----
      doc.fontSize(14).text("Shipping Address", { underline: true });
      doc.moveDown(0.5);
      const addr = orderData.shippingAddress;
      doc.fontSize(12).text(addr.name);
      doc.text(addr.addressline);
      doc.text(`${addr.street}, ${addr.city}`);
      doc.text(`${addr.state} - ${addr.pincode}`);
      doc.text(`Mobile: ${addr.mobile}`);
      doc.moveDown();

      // ---- PRODUCTS TABLE ----
      doc.fontSize(14).text("Products", { underline: true });
      doc.moveDown(0.5);

      // Table headers
      const tableTop = doc.y;
      const itemX = 50,
        qtyX = 280,
        priceX = 350,
        totalX = 450;

      doc.fontSize(12).text("Item", itemX, tableTop, { bold: true });
      doc.text("Qty", qtyX, tableTop);
      doc.text("Price", priceX, tableTop);
      doc.text("Total", totalX, tableTop);

      doc.moveDown(0.5);
      doc.moveTo(itemX, tableTop + 15).lineTo(550, tableTop + 15).stroke();

      // Table rows
      orderData.products.forEach((p, i) => {
        const y = tableTop + 25 + i * 20;
        doc.text(p.productId.ProductName, itemX, y);
        doc.text(p.quantity.toString(), qtyX, y);
        doc.text(`₹${p.price}`, priceX, y);
        doc.text(`₹${p.price * p.quantity}`, totalX, y);
      });

      doc.moveDown(2);

      // ---- TOTALS ----
      if (orderData.discount) {
        doc.fontSize(12).text(`Discount: ₹${orderData.discount}`, {
          align: "right",
        });
      }
      doc.fontSize(14).text(`Grand Total: ₹${orderData.totalPrice}`, {
        align: "right",
        bold: true,
      });

      // ---- FOOTER ----
      doc.moveDown(3);
      doc
        .fontSize(10)
        .text(
          "Thank you for shopping with BagsVio! For support, contact support@bagsvio.com",
          { align: "center" }
        );

      doc.end();
    } catch (err) {
      console.error("Error generating invoice:", err);
      res.status(500).json({ error: "Failed to generate invoice" });
    }
  },

}
 

