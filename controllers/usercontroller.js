const user = require('../models/user')
const Product = require('../models/productSchema');
const category = require('../models/categorySchema');
const Address=require('../models/address')
const bcrypt = require('bcryptjs');
const sendOTP = require('./otpcontroller');
const Otp=require('../models/otpSchema');
const Users = require('../models/user');
const flash=require('express-flash')

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
    showLoginPage: (req, res) => {
       
        try {
            if(req.session.userIsLoged != null){
                  res.redirect('/userhome')
              }else{
                  res.render('user/userlog')
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
            const selectedCategoryName = req.params.categoryName;
        
            // Find the Category ObjectId for the selected category name
            const selectedCategory = await category.findOne({ categoryName: selectedCategoryName });
        
            if (!selectedCategory) {
              // Handle the case where the category is not found
              return res.status(404).send('Category not found');
            }
        
            // Use the found Category ObjectId to query products
            const products = await Product.find({ Category: selectedCategory._id ,isBlocked:false});
            // console.log('products>>>>>new',products)
        
            res.render('user/productlist', { categories, products, selectedCategory: selectedCategoryName });
          } catch (e) {
            console.error(e);
            res.status(500).send('Internal Server Error');
          }
        },
    showUserProductDetails:async (req, res) => {
        try {
            const productId=req.params.productId
          
            const categories = await category.find({});
            const products= await Product.findOne({_id:productId}).populate('BrandName').populate('Category')
            // console.log(products);
            res.render('user/productdetails',{categories,products})
        } catch (e) {
            console.log(e)
        }
    },




    

   
    showSignupPage: (req, res) => {
      console.log('user session in signuop page',req.session)
        res.render('user/usersignup', { messages: req.flash('error') });
    },
    showForgetPassword: (req, res) => {
        res.render('user/forgetpassword')
    },
    showResetPassword:(req,res)=>{

     
        res.render('user/resetpassword')
    },
    showUserHomePage:async (req, res) => {
        // console.log('email of the user',req.session.email)
        console.log('user home reached')
        const categories=await category.find()
        const newarrival = await Product.find({ isNewArrival: true, isBlocked: false })
        const newtrends = await Product.find({ isNewTrends: true, isBlocked: false })
        // console.log(categories+"00000000000000000000000")
        res.render('user/userhome',{categories,newarrival,newtrends})
    },
    signupPost: async (req,res)=>{

        try{
            
          
        const {name,email,password,confirmPassword} =req.body;
        const userExist = await user.findOne({email:email})
        // const categories=await category.find()

        // const newarrival = await Product.find({ isNewArrival: true, isBlocked: false })
        // const newtrends = await Product.find({ isNewTrends: true, isBlocked: false })
         

         if(userExist){
            res.render('user/usersignup',{err:"user already exist"})
         }
        // Hash the password before saving
        const hashedPassword = await bcrypt.hash(password, 10);
         req.session.signupDetails={name,email,password}
        // const newUser = new user({
        //     name:name,
        //     email:email,
        //     password:hashedPassword,
        //     confirmPassword:confirmPassword
        // })
   

        // await newUser.save()
//         .then((result)=>{
//             console.log(result);
//         })
//  console.log(newUser,'newwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwww');
        //send OTP
        const createdOTP= await sendOTP(email);
        console.log(createdOTP,'otp created');

        //Redirect to the OTP page

         res.redirect('/otp')

        // res.render('user/userhome', {  categories,newarrival,newtrends });
        //res.status(200).redirect('/userhome')
        }catch(error){
            console.log(error)
            if(error.code === 11000){
                console.log('error unique');
                // req.flash('error','user already exist')
                // res.redirect('/signup')
            }
           
        }
     },

     getOtpPage:(req,res)=>{
      console.log('getotp page called')
      res.render('user/otp')
     },

     userLogin: async (req, res) => {
        try {
          console.log(req.body)
          const { email, password } = req.body;
          const userfound = await user.findOne({ email: email });
          console.log(email)
      
          if (!userfound) {
            return res.render('user/userlog', { err: 'User not found' });
          }
      
          if (userfound.isBlocked) {
            return res.render('user/userlog', { err: 'User is blocked. Contact the administrator.' });
          }
      
          const passwordMatch = await bcrypt.compare(password, userfound.password);
      
          if (!passwordMatch) {
            return res.render('user/userlog', { err: 'Invalid Credentials' });
          }
      
          req.session.userLogged = true;
          req.session.email = email;
          req.session.user= userfound;
          req.session.userIsLoged = email;
          req.session.userId=userfound
          console.log( 'gfdgsgdgdgdfg',req.session.email )
          // You may choose to store only essential user information in the session
          // req.session.user = { userId: userfound._id, name: userfound.name, email: userfound.email };
      
          res.redirect('/userhome');
        } catch (error) {
          console.log(error);
          res.send('Error occurred while login');
        }
      }
      ,

     validateOtp: async (req, res) => {
        try {
        //   const brands = await Brands.find({});
          const categories = await category.find({});
          console.log('verifying otp..');
          const { otp1, otp2, otp3, otp4 } = req.body;
          const enteredOtp = otp1 + otp2 + otp3 + otp4;
          console.log('signupdetails>>>>>>>>>>>>>>>>>><<<<<<,',req.session.signupDetails)
          const {name, email, password }=req.session.signupDetails

          req.session.email = email
          req.session.userLogged = true
          req.session.save()
         
          console.log('Email', email);
          console.log("entered otp", enteredOtp);
          const createdOTPrecord = await Otp.findOne({ email, otp: enteredOtp });

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
        req.session.userLogged=savedUser
          return res.render('user/userhome', {  categories,newarrival,newtrends });
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
    console.log(req.body,"reqbodyyyyyyyyyyyyyyyy")
    console.log(email)
      try {
        console.log("entered.......")
        const updatedUser = await user.findOneAndUpdate(
          { email: email },
          { $set: { lastName: lastName, phoneNumber: phoneNumber } },
          { new: true }
        );
    
        if (!updatedUser) {
          return res.status(404).json({ message: 'User not found' });
        }
        console.log(updatedUser);
        return res.status(200).json({ message: 'User details updated successfully', user: updatedUser });
        
      } catch (error) {
        return res.status(500).json({ message: 'Error updating user details', error: error.message });
      }
    },

      getAddressPage:async(req,res)=>{

      const categories=await category.find()
      const email = req.session.email; 
      const user = await Users.findOne({ email: email }).populate('addresses');
      console.log(user.addresses.addresses,'////////////////////////////')
     

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
  console.log('backend reached bro')
  const addressId = req.params.addressId;
  console.log(addressId,'kkkkkkkkkkkkkkkkkkkk')
  const userData = await Users.findOne({email:req.session.email})
  const userId = userData._id

  const userAddress = await Address.findOne({userId:userId})

  const userFirstAddress = userAddress.addresses.find(data => data._id.toString() === addressId.toString())
  console.log(userFirstAddress)

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


  
    console.log('jscode is herer');
    // Find the address document in the database by ID
    const address = await Address.findOne({userId:userId});

    if (!address) {
      return res.status(404).json({ error: 'Address not found' });
    }

    // Update the address document with the new details
    address.addresses[0].name = name;
    address.addresses[0].addressline=addressline;
    address.addresses[0].pincode = pincode;
    address.addresses[0].street = street;
    address.addresses[0].city = city;
    address.addresses[0].state = state;
    address.addresses[0].mobile = mobile;
    // Save the updated address document
    const newaddress =await address.save();

    console.log('no2 address',newaddress);
    //res.status(200).json({ success: true, message: 'Address updated successfully' });
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

    // Save the user object, not userAddress
    await user.save();

    return res.status(200).json({ message: 'Address removed successfully' });
  } catch (error) {
    console.error('Error removing address:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}


}
 

// module.exports = userContoller;