const productModel = require("../models/productModel")
const {uploadFile} = require('../utils/aws')
const {isValid,isValidRequestBody, isValidObjectId} = require("../utils/validator")




const createProduct = async function (req, res) {
    try {
        let data = req.body
        if (!isValidRequestBody(data)) return res.status(400).send({ status: false, msg: 'Enter details for user creation.' })

        let files = req.files
        let uploadedFileURL
        if (files && files.length > 0) {
            uploadedFileURL = await uploadFile(files[0])
        }
        else {
            res.status(400).send({ msg: "Provide Product Image" })
        }
        // data.productImage = uploadedFileURL
        const productImageUrl = await uploadFile(files[0])
        let { 
            title,
            description,
            price,
            currencyId,
            currencyFormat,
            isFreeShipping,
            style,
            availableSizes,
            installments
        } = data

        if (!isValid(title)) return res.status(400).send({ status: false, msg: "Enter Title" })
        let usedTitle = await productModel.findOne({ title: title })
        if (usedTitle) return res.status(400).send({ status: false, msg: "Title already Present" })
        if (!isValid(description)) return res.status(400).send({ status: false, msg: "Enter description" })
        if (!isValid(price)) return res.status(400).send({ status: false, msg: "Enter Price" })
        if (price < 0) return res.status(400).send({ status: false, msg: "Bad Price" })
        if (!(/INR/.test(currencyId))) return res.status(400).send({ status: false, msg: "Bad CurrencyId" })
        if (!(/₹/.test(currencyFormat))) return res.status(400).send({ status: false, msg: "Bad CurrencyFormat" })
        if (availableSizes <= 0) return res.status(400).send({ status: false, msg: "Add Sizes" })
        if (installments < 0) return res.status(400).send({ status: false, msg: "Bad Installments Field" })

        let result = {
            title,
            description,
            price,
            currencyId,
            currencyFormat,
            isFreeShipping,
            style,
            availableSizes,
            installments,
            productImage: productImageUrl
        }
        
        let created = await productModel.create(result)
        res.status(201).send({ status: true, msg: "Success", data: created })

    } 
    catch (err) {
        res.status(500).send({ status: false, msg: err.message })
    }
}

// const getProduct = async function (req, res) {
//     try {

//     }
//     catch (err) {
//         res.status(500).send({ status: false, msg: err.message })
//     }
// }

const getProduct = async (req, res) => {
    try {
        let filterfilter = req.filter;
        let filter = { isDeleted: false }
        let { size, name, priceGreaterThan, priceLessThan, priceSort } = filterfilter;
        if (size || name || priceGreaterThan || priceLessThan || priceSort) {
            

            if (size) {
                filter['availableSizes'] = size
            }
            if (name) {
                filter['title'] = { $regex: name }
            }
            if (priceGreaterThan) {
                filter['price'] = { $gt: priceGreaterThan }
            }
            if (priceLessThan) {
                filter['price'] = { $lt: priceLessThan }
            }
            if (priceGreaterThan && priceLessThan) {
                filter['price'] = { '$gt': priceGreaterThan, '$lt': priceLessThan }
            }
            if (priceSort) {
                if (!(priceSort == -1 || priceSort == 1)) {
                    return res.status(400).send({ status: false, message: "You Can Only Use 1 For Ascending And -1 For Descending Sorting" })
                }
            }

            let getAllProduct = await productModel.find(filter).sort({ price: priceSort })
            const found = getAllProduct.length
            if (!(found > 0)) {
                return res.status(404).send({ status: false, msg: "Currently Their Are No Product" })
            }
            return res.status(200).send({ status: true, message: `Success`, data: getAllProduct });
        }
    } catch (error) {
        console.log(error)
        return res.status(500).send({ status: false, msg: error.message })

    }
}

const getProductById = async function (req, res) {
    try {
        const productId = req.params.productId

        if (!isValidObjectId(productId)) {
            return res.status(400).send({ status: false, msg: "Please enter a valid productId" })
        }

        const findProduct = await productModel.findOne({_id: productId, isDeleted: false})

        if(!findProduct) return res.status(404).send({ status: false, msg: "Product not found" })
        res.status(200).send({ status: true, data: findProduct })

    }
    catch (err) {
        res.status(500).send({ status: false, msg: err.message })
    }
}


const updateProduct = async function (req, res) {
    try {

    }
    catch (err) {
        res.status(500).send({ status: false, msg: err.message })
    }
}


const deleteProductById = async function (req, res) {
    try {
        const productId = req.params.productId

        if (!isValidObjectId(productId)) {
            return res.status(400).send({ status: false, msg: "Please enter a valid productId" })
        }

        const findProduct = await productModel.findOne({_id: productId, isDeleted: false})
        if(!findProduct) return res.status(404).send({status: false, msg : "Product not found"})

        let deletedProduct = await productModel.findOneAndUpdate({_id:productId}, {$set:{isDeleted:true, deletedAt: new Date()}},{new:true})
        res.status(200).send({ status: true, message: " Product Deleted Successfully", data: deletedProduct })

    }
    catch (err) {
        res.status(500).send({ status: false, msg: err.message })
    }
}


module.exports = {createProduct, getProduct, getProductById, updateProduct, deleteProductById}