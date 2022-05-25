const productModel = require("../models/productModel")
const {uploadFile} = require('../utils/aws')
const {isValid,isValidRequestBody, isValidObjectId} = require("../utils/validator")




const postProducts = async function (req, res) {
    try {
        let data = JSON.parse(JSON.stringify(req.body))
        if (!isValidRequestBody(data)) return res.status(400).send({ status: false, msg: 'Enter details for user creation.' })

        let files = req.files
        let uploadedFileURL
        if (files && files.length > 0) {
            uploadedFileURL = await uploadFile(files[0])
        }
        else {
            res.status(400).send({ msg: "Provide Product Image" })
        }
        data.productImage = uploadedFileURL


        if (!isValid(data.title)) return res.status(400).send({ status: false, msg: "Enter Title" })
        let usedTitle = await productModel.findOne({ title: data.title })
        if (usedTitle) return res.status(400).send({ status: false, msg: "Title already Present" })
        if (!isValid(data.description)) return res.status(400).send({ status: false, msg: "Enter description" })
        if (data.price < 0) return res.status(400).send({ status: false, msg: "Bad Price" })
        if (!(/INR/.test(data.currencyId))) return res.status(400).send({ status: false, msg: "Bad CurrencyId" })
        if (!(/₹/.test(data.currencyFormat))) return res.status(400).send({ status: false, msg: "Bad CurrencyFormat" })
        if (data.availableSizes.length <= 0) return res.status(400).send({ status: false, msg: "Add Sizes" })
        if (data.installments < 0) return res.status(400).send({ status: false, msg: "Bad Installments Field" })


        let created = await productModel.create(data)
        res.status(201).send({ status: true, msg: "Success", data: created })


    } catch (err) {
        res.status(500).send({ status: false, msg: err.message })
    }
}

const getProduct = async function (req, res) {
    try {

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


module.exports = {postProducts, getProduct, getProductById, updateProduct, deleteProductById}