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
          console.log(req.session)
          console.log(userId,)
         
          const wishlistItems = await Wishlist.find({ userId: userId }).populate('items.productId'); 

          console.log(wishlistItems);
          
          res.render("user/wishlist1", { wishlistItems,categories });
        } catch (error) {
          console.error('Error fetching wishlist:', error);
         
          res.status(500).render('error', { message: 'Internal Server Error' });
        }
      },

      addToWishlist: async (req, res) => {
        try {
          const { productId } = req.body;
          
          // Find the user
          const user = await Users.findOne({ email: req.session.email });
          if (!user) {
            return res.status(401).json({ error: "Unauthorized" });
          }
      
          // Find the user's wishlist
          let wishlist = await Wishlist.findOne({ userId: user._id });
      
          // If user has no wishlist, create a new one
          if (!wishlist) {
            wishlist = new Wishlist({ userId: user._id, items: [] });
          }
      
          // Check if the product already exists in the wishlist
          if (wishlist.items.find(item => item.productId.toString() === productId)) {
            return res.status(400).json({ error: "Product already exists in the wishlist" });
          }
      
          // Add the product to the wishlist
          wishlist.items.push({ productId });
      
          // Save the updated or new wishlist
          await wishlist.save();
      
          // Send success response
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

               // Check if the item is already in the user's cart
           const userCart = await Cart.findOne({ userId: user._id, 'items.productId': productId });
             if (userCart) {
            // Item is already in the cart, return an error response
            return res.status(400).json({ error: 'Item is already in the cart' });
        }

            const wishlistItem = await Wishlist.findOne({ 'items.productId': productId });
            if (!wishlistItem) {
                return res.status(404).json({ error: 'Wishlist item not found' });
            }

            // Check if the product is in stock
        const product = await productModel.findById(productId);
        if (!product || product.AvailableQuantity <= 0) {
            return res.status(400).json({ error: 'Product is out of stock' });
        }
            const userId = user._id
            const quantity = 1;
    
           
            // const cartItem = new Cart({
            //     userId: wishlistItem.userId,
            //     items: wishlistItem.items.map(item => ({
            //         productId: item.productId,
            //         quantity: 1 
            //     }))
            // });

            let cart = await Cart.findOne({ userId });
            if (!cart) {
              // If the user doesn't have a cart, create a new one
              cart = new Cart({ userId, items: [{ productId, quantity }] });
              await cart.save();
          } else {
              // If the user has a cart, update the existing one
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
  //   WishlistItemToCart:async (req, res) => {
  //     try {
  //         const { userId } = req.session; // Assuming you have the user's ID in the session
  
  //         const { productId } = req.params; // Get productId from the route parameter
  //         // const { quantity } = req.body;
  
  //         // Validate the request data
  //         if (!userId || !productId || !quantity || quantity <= 0) {
  //             return res.status(400).json({ error: 'Invalid request data' });
  //         }
  
  //         // Check if the user already has a cart
  //         let userCart = await Cart.findOne({ userId });
  
          // if (!userCart) {
          //     // If the user doesn't have a cart, create a new one
          //     userCart = new Cart({ userId, items: [{ productId, quantity }] });
          //     await userCart.save();
          // } else {
          //     // If the user has a cart, update the existing one
          //     const existingItem = userCart.items.find(item => item.productId.toString() === productId);
  
          //     if (existingItem) {
          //         existingItem.quantity += quantity;
          //     } else {
          //         userCart.items.push({ productId, quantity });
          //     }
  
          //     await userCart.save();
          // }
  
  //         // Remove the product from the wishlist after adding it to the cart
  //         await Wishlist.findOneAndUpdate(
  //             { userId },
  //             { $pull: { products: { productId } } },
  //             { new: true }
  //         );
  
  //         res.status(200).json({ message: 'Product added to cart from wishlist successfully.' });
  //     } catch (err) {
  //         console.error(err);
  //         res.status(500).json({ error: 'Internal server error' });
  //     }
  // },

  getDeleteWishlist:async (req, res) => {

    const user = await Users.findOne({ email: req.session.email });
    const userId = user._id
    const productId = req.params.id

    const updatedWishlist = await Wishlist.findOneAndUpdate(
      { userId },
      { $pull: { items: { productId } } }, // Remove the item with matching productId
      { new: true } // To return the updated document after update
  );

  res.redirect('/wishlist')
  }

}