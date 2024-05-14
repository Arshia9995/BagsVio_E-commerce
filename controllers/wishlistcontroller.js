const productModel = require("../models/productSchema");
const userRouter = require('../routes/userrouter')
const Cart = require("../models/cartSchema");
const Users = require("../models/user");
const categoryModel = require("../models/categorySchema");
const Wishlist=require("../models/wishlist")



module.exports = {
  
    showWishlistPage:async (req, res) => {
      console.log('backend reached')
        try {

          const categories=await categoryModel.find()
          const { userId } = req.session;
       
         
          const wishlistItems = await Wishlist.find({ userId: userId }).populate('items.productId'); 

       
          res.render("user/wishlist1", { wishlistItems,categories });
        } catch (error) {
          console.error('Error fetching wishlist:', error);
         
          res.status(500).render('error', { message: 'Internal Server Error' });
        }
      },

      addToWishlist: async (req, res) => {
        try {
          const { productId } = req.body;
          
         
          const user = await Users.findOne({ email: req.session.email });
          if (!user) {
            return res.status(401).json({ error: "Unauthorized" });
          }
      
        
          let wishlist = await Wishlist.findOne({ userId: user._id });
      
          if (!wishlist) {
            wishlist = new Wishlist({ userId: user._id, items: [] });
          }
      
        
          if (wishlist.items.find(item => item.productId.toString() === productId)) {
            return res.status(400).json({ error: "Product already exists in the wishlist" });
          }
      
        
          wishlist.items.push({ productId });
      
         
          await wishlist.save();
      
         
          res.status(201).json({ success: true, message: "Product added to the wishlist successfully" });
        } catch (error) {
          console.error(error);
          res.status(500).json({ error: "Internal Server Error" });
        }
      },

      WishlistItemToCart:async (req, res) => {
        try {
          const user = await Users.findOne({ email: req.session.email });
            const productId = req.body.productId;

              
           const userCart = await Cart.findOne({ userId: user._id, 'items.productId': productId });
             if (userCart) {
           
            return res.status(400).json({ error: 'Item is already in the cart' });
        }

            const wishlistItem = await Wishlist.findOne({ 'items.productId': productId });
            if (!wishlistItem) {
                return res.status(404).json({ error: 'Wishlist item not found' });
            }

          
        const product = await productModel.findById(productId);
        if (!product || product.AvailableQuantity <= 0) {
            return res.status(400).json({ error: 'Product is out of stock' });
        }
            const userId = user._id
            const quantity = 1;
    
           
           

            let cart = await Cart.findOne({ userId });
            if (!cart) {
            
              cart = new Cart({ userId, items: [{ productId, quantity }] });
              await cart.save();
          } else {
             
              const existingItem = cart.items.find(item => item.productId.toString() === productId);
  
              if (existingItem) {
                  existingItem.quantity += quantity;
              } else {
                  cart.items.push({ productId, quantity });
              }
  
              await cart.save();
          }
    
            await Wishlist.findOneAndUpdate(
                { 'items.productId': productId },
                { $pull: { items: { productId: productId } } }
            );
    
            return res.status(200).json({ message: 'Wishlist item added to cart successfully' });
        } catch (error) {
            console.error('Error adding wishlist item to cart:', error);
            return res.status(500).json({ error: 'Internal server error' });
        }
    },
  

  getDeleteWishlist:async (req, res) => {

    const user = await Users.findOne({ email: req.session.email });
    const userId = user._id
    const productId = req.params.id

    const updatedWishlist = await Wishlist.findOneAndUpdate(
      { userId },
      { $pull: { items: { productId } } }, 
      { new: true } 
  );

  res.redirect('/wishlist')
  }

}