
const productModel = require("../models/productSchema")
const brandModel = require("../models/brandSchema")
const categoryModel = require("../models/categorySchema")
const cropImage = require("../utility/imageCrop")



module.exports = {
  getProductPage: async (req, res) => {
    try {

      const page = parseInt(req.query.page) || 1; // Current page number
        const perPage = 10; // Number of products per page
        const productsCount = await productModel.countDocuments(); // Total number of products
        const totalPages = Math.ceil(productsCount / perPage);

        const products = await productModel
        .find({})
        .populate('BrandName')
        .populate('Category')
        .skip((page - 1) * perPage) // Skip products for previous pages
        .limit(perPage); // Limit products for the current page

      console.log('products are>>>>>>', products);
      // console.log(products[9].BrandName,'products.BrandName');
      // console.log(products[9].Category,'category');
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



  // postaddProduct: async (req, res) => {
  //   try {
  //     const images = []
  //     const category = await categoryModel.findOne({ categoryName: req.body.Category });
  //     console.log(category);
  //     const BrandName = await brandModel.findOne({  brandName: req.body.BrandName });
  //      console.log(req.body,'this is body');
  //     for (let i = 1; i <= 3; i++) {
  //       const fieldName = `image${i}`;
  //       if (req.files[fieldName] && req.files[fieldName][0]) {
  //         images.push(req.files[fieldName][0].filename);
  //       }
  //     }
  //     let Status
  //     if (req.body.AvailableQuantity <= 0) {
  //       Status = "Out of Stock";
  //     } else {
  //       Status = "In Stock";
  //     }


  // validating datas
  // const newProduct = new productModel({
  //   ProductName: req.body.ProductName,
  //   Price: req.body.Price,
  //   Description: req.body.Description,
  //   BrandName: BrandName._id,
  //   AvailableQuantity: req.body.AvailableQuantity,
  //   Category: category._id,
  //   Status: Status,
  //   Display: "Active",
  //   Specification1: req.body.Specification1,
  //   DiscountAmount: req.body.DiscountAmount,
  //   images: images,
  // });





  // const updatedData = {
  //   ProductName: req.body.ProductName,
  //   Price: req.body.Price,
  //   Description: req.body.Description,
  //   BrandName: await findBrandByName(req.body.BrandName),
  //   AvailableQuantity: req.body.AvailableQuantity,
  //   Category: await findCategoryByName(req.body.Category),
  //   Status: req.body.AvailableQuantity <= 0 ? 'Out of Stock' : 'In Stock',
  //   DiscountAmount: req.body.DiscountAmount,
  // };

  // const updatedProduct = await updateProduct(productId, updatedData);

  // Wait for the product to be saved
  // await newProduct.save()
  // .then((result)=>{
  //   console.log(result,'result');

  // });

  // Redirect to the appropriate route after successfully adding the product
  //         req.flash('success', 'Product updated successfully.');
  //     res.redirect('/admin/adminproduct');
  //   } catch (error) {
  //     req.flash('error', error.message);
  //     res.redirect(`/admin/editproduct/${req.params.id}`);
  //     console.error(error);
  //   }
  // },

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

      // cropImage(images)

      // Create a new product instance
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


     
      // Save the new product
      await newProduct.save();

      req.flash('success', 'Product added successfully.');
      res.redirect('/admin/adminproduct');
    } catch (error) {
      req.flash('error', `Error adding product: ${error.message}`);
      res.redirect('/admin/adminproduct'); // Redirect to the appropriate route
      console.error(error);
    }
  },









  BlockProduct: async (req, res) => {
    const productId = req.params.productId;
    console.log('Blocking product:', productId);

    try {
      // Find the product by ID and update the isBlocked property to true
       await productModel.findByIdAndUpdate(productId, { isBlocked: true });
      console.log('Product blocked successfully:');

      res.redirect('/admin/adminproduct');
    } catch (error) {
      console.error('Error blocking product:', error);
      res.status(500).json({ success: false, message: 'Internal Server Error' });
    }
  },
  UnblockProduct: async (req, res) => {
    const productId = req.params.productId;

    try {
      // Find the product by ID and update the isBlocked property to false
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
      console.log('product is', product)
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
      // console.log(productId,"ppppppppppp");

      const product = await productModel.findOne({_id: productId});

      // Check if the product exists
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
      console.log(req.body.ProductName + "0000000000000000000000000000000000")
      console.log(req.files);
      const brand = await brandModel.findOne({ brandName: req.body.BrandName });
      const category = await categoryModel.findOne({ categoryName: req.body.Category });
   
      // const update = await productModel.updateOne({ _id: productId },
      //   {
      //     $set: {
      //       ProductName: ProductName,
      //       Price: Price,
      //       Description: productDescription,
      //       BrandName: brand._id,
      //       AvailableQuantity: AvailableQuantity,
      //       Category:category._id,
      //       DiscountAmount: DiscountAmount,
            
      //     }
      //   }
      // )
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
        // Assuming you have image inputs named image1, image2, image3 in your form
        update.images = [];
      
        for (let i = 1; i <= 3; i++) { // Change the loop range based on your actual number of images
          const fileKey = `image${i}`;
          const existingImage = product.images[i - 1]; // Assuming product.images is an array
      
          if (req.files[fileKey]) {
            update.images.push(req.files[fileKey][0].filename);
            
          
          } else {
            update.images.push(existingImage);
          }
        }
        cropImage(update.images)
      }
  
      // Update the product in the database
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

