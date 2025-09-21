const CategoryOffer = require('../models/categoryoffer');

// Function to get active category offer for a product
const getCategoryOfferForProduct = async (product) => {
    try {
        const currentDate = new Date();
        
        // Find active category offer for the product's category
        const categoryOffer = await CategoryOffer.findOne({
            categoryId: product.Category,
            isActive: true,
            startDate: { $lte: currentDate },
            endDate: { $gte: currentDate }
        });

        return categoryOffer;
    } catch (error) {
        console.error('Error fetching category offer:', error);
        return null;
    }
};

// Function to calculate discounted price
const calculateDiscountedPrice = (originalPrice, discountPercentage) => {
    const discountAmount = (originalPrice * discountPercentage) / 100;
    return Math.round(originalPrice - discountAmount);
};

// Function to get category offers for multiple products
const getCategoryOffersForProducts = async (products) => {
    try {
        const currentDate = new Date();
        
        // Get all active category offers
        const categoryOffers = await CategoryOffer.find({
            isActive: true,
            startDate: { $lte: currentDate },
            endDate: { $gte: currentDate }
        });

        // Create a map for quick lookup
        const offerMap = new Map();
        categoryOffers.forEach(offer => {
            offerMap.set(offer.categoryId.toString(), offer);
        });

        // Add offer information to each product
        const productsWithOffers = products.map(product => {
            const offer = offerMap.get(product.Category.toString());
            if (offer) {
                const discountedPrice = calculateDiscountedPrice(product.Price, offer.discountPercentage);
                return {
                    ...product.toObject(),
                    categoryOffer: offer,
                    discountedPrice: discountedPrice,
                    hasCategoryOffer: true
                };
            }
            return {
                ...product.toObject(),
                categoryOffer: null,
                discountedPrice: product.Price,
                hasCategoryOffer: false
            };
        });

        return productsWithOffers;
    } catch (error) {
        console.error('Error fetching category offers for products:', error);
        return products.map(product => ({
            ...product.toObject(),
            categoryOffer: null,
            discountedPrice: product.Price,
            hasCategoryOffer: false
        }));
    }
};

module.exports = {
    getCategoryOfferForProduct,
    calculateDiscountedPrice,
    getCategoryOffersForProducts
};
