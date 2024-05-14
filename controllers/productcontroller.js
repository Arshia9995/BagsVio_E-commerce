
const productModel = require("../models/productSchema")
const brandModel = require("../models/brandSchema")
const categoryModel = require("../models/categorySchema")
const cropImage = require("../utility/imageCrop")



module.exports = {
  getProductPage: async (req, res) => {
    try {

      const page = parseInt(req.query.page) || 1; 
        const perPage = 10; 
        const productsCount = await productModel.countDocuments(); 
        const totalPages = Math.ceil(productsCount / perPage);

        const products = await productModel
        .find({})
        .populate('BrandName')
        .populate('Category')
        .skip((page - 1) * perPage) 
        .limit(perPage); 

    
     
      res.render('./admin/adminproduct', { products, title: 'Admin Product Page', currentPage: page, totalPages ,perPage})

    } catch (error) {
      console.error(`Error fetching categories: ${error.message}`);
      res.status(500).send('Internal Server Error');

    }
  },

  getaddProduct: async (req, res) => {
    try {
      const categories = await categoryModel.find()
      const brands = await brandModel.find()

      res.render('./admin/addproduct', { categories, brands, title:"Admin AddProduct" })
    } catch (error) {
      console.log(error);
    }
  },
  addProduct: async (req, res) => {
    try {
      res.render('./admin/addproduct')

    } catch (error) {

    }
  },




  postaddProduct: async (req, res) => {
    try {
      const images = [];
      const category = await categoryModel.findOne({ categoryName: req.body.Category });
      const brand = await brandModel.findOne({ brandName: req.body.BrandName });
      const isnewarrival = req.body.isNewArrival==='on'
      const isnewtrends = req.body.isNewTrends==='on'

      for (let i = 1; i <= 3; i++) {
        const fieldName = `image${i}`;
        if (req.files[fieldName] && req.files[fieldName][0]) {
          images.push(req.files[fieldName][0].filename);
        }
      }

      let status;
      if (req.body.AvailableQuantity <= 0) {
        status = 'Out of Stock';
      } else {
        status = 'In Stock';
      }

    
      const newProduct = new productModel({
        ProductName: req.body.ProductName,
        Price: req.body.Price,
        Description: req.body.Description,
        BrandName: brand._id,
        AvailableQuantity: req.body.AvailableQuantity,
        Category: category._id,
        Status: status,
        Display: 'Active',
        DiscountAmount: req.body.DiscountAmount,
        images: images,
        isNewArrival:isnewarrival,
        isNewTrends:isnewtrends
      });


     
    
      await newProduct.save();

      req.flash('success', 'Product added successfully.');
      res.redirect('/admin/adminproduct');
    } catch (error) {
      req.flash('error', `Error adding product: ${error.message}`);
      res.redirect('/admin/adminproduct'); 
      console.error(error);
    }
  },

  BlockProduct: async (req, res) => {
    const productId = req.params.productId;
    console.log('Blocking product:', productId);

    try {
     
       await productModel.findByIdAndUpdate(productId, { isBlocked: true });
    

      res.redirect('/admin/adminproduct');
    } catch (error) {
      console.error('Error blocking product:', error);
      res.status(500).json({ success: false, message: 'Internal Server Error' });
    }
  },
  UnblockProduct: async (req, res) => {
    const productId = req.params.productId;

    try {
    
     await productModel.findByIdAndUpdate(productId, { isBlocked: false });

      res.redirect('/admin/adminproduct')
    } catch (error) {
      console.error('Error unblocking product:', error);
      res.status(500).json({ success: false, message: 'Internal Server Error' });
    }
  },
  editProduct: async (req, res) => {
    try {
      const productId = req.params.id;
      const product = await productModel.findById(productId).populate('BrandName').populate('Category');
     
      const categories = await categoryModel.find();
      const brands = await brandModel.find();

      res.render('./admin/editproduct', { product, categories, brands , title:"Admin EditProduct"});
    } catch (error) {
      console.error(`Error fetching product details: ${error.message}`);
      res.status(500).send('Internal Server Error');
    }
  },
  postEditProduct: async (req, res) => {
    try {
      const productId = req.params.id;
    

      const product = await productModel.findOne({_id: productId});

      if (!product) {
        req.flash('error', 'Product not found.');
        return res.redirect('/admin/adminproduct');
      }

      const { ProductName,
        Description, 
         Price,
          DiscountAmount,
          AvailableQuantity, 
          Category,
          BrandName } = req.body
   
     
      const brand = await brandModel.findOne({ brandName: req.body.BrandName });
      const category = await categoryModel.findOne({ categoryName: req.body.Category });
   
      const update = {
        ProductName: ProductName,
        Price: Price,
        Description: Description,
        BrandName: BrandName,
        AvailableQuantity: AvailableQuantity,
        Category:  Category,
        DiscountAmount: DiscountAmount
      };
  
      if (req.files) {
     
        update.images = [];
      
        for (let i = 1; i <= 3; i++) { 
          const fileKey = `image${i}`;
          const existingImage = product.images[i - 1]; 
      
          if (req.files[fileKey]) {
            update.images.push(req.files[fileKey][0].filename);
            
          
          } else {
            update.images.push(existingImage);
          }
        }
        // cropImage(update.images)
      }
  
      
      const updatedProduct = await productModel.updateOne({ _id: productId }, { $set: update });
      req.flash('success', 'Product updated successfully.');
      res.redirect('/admin/adminproduct');
    } catch (error) {
      req.flash('error', `Error updating product: ${error.message}`);
      res.redirect(`/admin/editproduct/${req.params.id}`);
      console.log(error)
    }
  },


}

