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
        const userId = req.params.userId
        if (!isValidObjectId(userId)) return res.status(400).send({ status: false, msg: "Invalid User Id" })

        const checkUser = await userModel.findOne({ userId })
        if (!checkUser) return res.status(404).send({ status: false, msg: "User does not exist" })

        if (userId != req.userId) return res.status(401).send({ status: false, msg: "User not authorized to update details" })

        const requestBody = req.body;
        if (!isValidRequestBody(requestBody)) {
            return res.status(400).send({ status: false, msg: 'Please Enter details to Update.' })
        }

        const {orderId, status} = requestBody;
        if(!isValid(orderId)){
            return res.status(400).send({ status: false, msg: 'orderId is Required'})
        }
        if (!isValidObjectId(orderId)){
             return res.status(400).send({ status: false, msg: "Invalid orderId" })
        }

        const findOrder = await orderModel.findOne({_id: orderId, userId: userId})
        if (!findOrder){
             return res.status(404).send({ status: false, msg: "Order not Found" })
        }

        if(!["pending", "completed", "cancled"].includes(status)){
            return res.status(400).send({ status: false, msg: 'status must be pending/completed/cancled' })
        }

        if(findOrder.status == "completed"){
            return res.status(400).send({ status: false, msg: 'This order is already completed' })
        }

        if(findOrder.status == "cancled"){
            return res.status(400).send({ status: false, msg: 'This order is already cancelled' })
        }

        if(findOrder.cancellable == false && status == "cancled"){
            return res.status(400).send({ status: false, msg: 'You cannot cancel this order' })
        }

        const updateStatus = await orderModel.findOneAndUpdate({_id: orderId, isDeleted: false}, {status: status}, {new: true})
        return res.status(200).send({ status: true, msg: 'Order status updated Successfully', data: updateStatus })
    }
    catch (error) {
        res.status(500).send({ status: false, msg: error.message })
    }
}


module.exports = { createOrder,updateOrder }