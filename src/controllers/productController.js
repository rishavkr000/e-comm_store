const productModel = require("../models/productModel")
const { uploadFile } = require('../utils/aws')
const { isValid, isValidRequestBody, isValidObjectId } = require("../utils/validator")


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


const getProduct = async function (req, res) {
    try {
        const queryParams = req.query;
        const filter = { isDeleted: false, deletedAt: null };
        // if (Object.keys(queryParams).length !== 0) {

        const { size, name, priceGreaterThan, priceLessThan } = queryParams

        if (isValid(size)) {
            if (Array.isArray(size) && size.length > 0) {
                for (let i = 0; i < size.length; i++) {
                    if (!["S", "XS", "M", "X", "L", "XXL", "XL"].includes(size[i])) {
                        res.status(400).send({ status: false, msg: 'Size should be: "S", "XS", "M", "X", "L", "XXL", "XL" ' })

                    }
                }
                filter.availableSizes = size
            } else {
                res.status(400).send({ status: false, msg: 'size should be in array like; ["S", "XS", "M", "X", "L", "XXL", "XL"] ' })

            }
        }
        if (isValid(name)) {
            filter.title = { $regex: name }
        }

        if (priceGreaterThan) {
            filter.price = { $gt: priceGreaterThan }
        }
        if (priceLessThan) {
            filter.price = { $lt: priceLessThan }
        }

        const getProductDetails = await productModel.find(filter).sort({ price: 1 })
        res.status(200).send({ status: true, msg: "Prodect Details Find Successsully", data: getProductDetails })
    }
    catch (err) {
        res.status(500).send({ status: false, msg: err.message })
    }
}



const getProductById = async function (req, res) {
    try {
        const productId = req.params.productId

        if (!isValidObjectId(productId)) {
            return res.status(400).send({ status: false, msg: "Please enter a valid productId" })
        }

        const findProduct = await productModel.findOne({ _id: productId, isDeleted: false })

        if (!findProduct) return res.status(404).send({ status: false, msg: "Product not found" })
        res.status(200).send({ status: true, data: findProduct })

    }
    catch (err) {
        res.status(500).send({ status: false, msg: err.message })
    }
}


const updateProduct = async function (req, res) {
    try {
        let productId = req.params.productId;

        if (!isValidObjectId(productId)) {
            return res.status(400).send({ status: false, msg: 'Invalid productId' })
        }
        const productDetails = await productModel.findById(productId)
        if (!productDetails) {
            return res.status(404).send({ status: false, msg: 'Product Not Found' })
        }
        if (productDetails.isDeleted == true) {
            return res.status(400).send({ status: false, msg: 'Product is already Deleted' })
        }

        let requestBody = req.body
        const files = req.files

        if (!isValidRequestBody(requestBody)) {
            return res.status(400).send({ status: false, msg: 'Enter atleast One detail to update' })
        }

        const { title, description, price, isFreeShipping, style, availableSizes, installments } = requestBody

        if (isValid(title)) {
            const usedTitle = await productModel.findOne({ title: title })
            if (usedTitle) return res.status(400).send({ status: false, msg: "Title already Present" })

            productDetails.title = title
        }

        if (isValid(description)) {
            productDetails.description = description
        }

        if (isValid(price)) {
            productDetails.price = price
        }

        if (isValid(isFreeShipping)) {
            productDetails.isFreeShipping = isFreeShipping
        }

        if (req.files) {
            if (files && req.files.length > 0) {
                let uploadedFileURL = await uploadFile(files[0])
                productDetails.productImage = uploadedFileURL
            }
        }

        if (isValid(style)) {
            productDetails.style = style
        }

        if (isValid(availableSizes)) {
            productDetails.availableSizes = availableSizes
        }

        if (isValid(installments)) {
            productDetails.installments = installments
        }

        await productDetails.save();
        return res.status(200).send({ status: true, message: "Product updated", data: productDetails })

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

        const findProduct = await productModel.findOne({ _id: productId, isDeleted: false })
        if (!findProduct) return res.status(404).send({ status: false, msg: "Product not found" })

        let deletedProduct = await productModel.findOneAndUpdate({ _id: productId }, { $set: { isDeleted: true, deletedAt: new Date() } }, { new: true })
        res.status(200).send({ status: true, message: " Product Deleted Successfully", data: deletedProduct })

    }
    catch (err) {
        res.status(500).send({ status: false, msg: err.message })
    }
}


module.exports = { createProduct, getProduct, getProductById, updateProduct, deleteProductById }
