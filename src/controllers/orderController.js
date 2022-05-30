const orderModel=require("../models/orderModel")
const userModel=require("../models/userModel")
const productModel=require("../models/productModel")
const { isValidObjectId, isValid, isValidRequestBody }=require("../utils/validator")

//----------------------------------------create Order---------------------------------------
const createOrder = async function (req, res) {
    try {
        
    }   
    catch (error) {
        res.status(500).send({ status: false, msg: error.message })
    }
}

//---------------------------------------------update Order------------------------------------------
const updateOrder = async (req, res) => {
    try {
             
    }
    catch (error) {
        res.status(500).send({ status: false, msg: error.message })
    }
}


module.exports = { createOrder,updateOrder }