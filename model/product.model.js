const mongoose = require('mongoose')

const ProductModel = mongoose.model(
    'Products', 
    new mongoose.Schema({
        title: String,
        price: Number,
        stock: Number,
        category: String,
        image: String,
    })
)
 
module.exports = ProductModel