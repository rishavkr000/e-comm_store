const orderModel=require("../models/orderModel")
const cartModel=require("../models/cartModel")
const productModel=require("../models/productModel")
const { isValidObjectId, isValid, isValidRequestBody }=require("../utils/validator")

//----------------------------------------create Order---------------------------------------
const createOrder = async function (req, res) {
    try {
        let userId = req.params.userId
        if (!isValidObjectId(userId)) return res.status(400).send({ status: false, msg: 'Invalid User Id' })
        if (userId != req.userId) return res.status(401).send({ status: false, msg: "User not authorized" })


        let order = JSON.parse(JSON.stringify(req.body))

        if (!isValidRequestBody(order)) return res.status(400).send({ status: false, msg: 'Enter order details.' })
        if (!isValid(order.userId)) return res.status(400).send({ status: false, msg: 'Enter userId.' })
        if (!isValidObjectId(order.userId)) return res.status(400).send({ status: false, msg: 'Enter valid User Id.' })
        if (!Object.keys(order.items).length > 0) return res.status(400).send({ status: false, msg: 'Enter order Detail.' })

        order.items = JSON.parse(order.items)
        //data.totalPrice=JSON.parse(data.totalPrice)
        //data.totalItems=JSON.parse(data.totalItems)

        if (!isValid(order.items.productId)) return res.status(400).send({ status: false, msg: 'Enter productId.' })
        if (!isValidObjectId(order.items.productId)) return res.status(400).send({ status: false, msg: 'Enter valid Product Id.' })
        if (!order.items.quantity > 0) return res.status(400).send({ status: false, msg: 'quantity must be minimum 1.' })
        if (!isValid(order.totalPrice)) return res.status(400).send({ status: false, msg: 'Enter totalPrice' })
        if (!isValid(order.totalItems)) return res.status(400).send({ status: false, msg: 'Enter totalItems' })
        if (!isValid(order.totalQuantity)) return res.status(400).send({ status: false, msg: 'Enter total Quantity' })
        if (!isValid(order.cancellable)) return res.status(400).send({ status: false, msg: 'Enter cancellable value' })
        if (!isValid(order.status)) return res.status(400).send({ status: false, msg: 'Enter Status' })

        let existingCart = await cartModel.findOne({ _id: order.cartId})
        if (!existingCart) return res.status(404).send({ status: false, msg: 'Product Not found.' })

        
        let existingOrder = await orderModel.findOne({ userId: userId })
        if (existingOrder) {
            existingOrder.items.push(order.items)
            existingOrder.totalPrice += JSON.parse(order.totalPrice)
            existingOrder.totalItems += JSON.parse(order.totalItems)
            existingOrder.totalQuantity += JSON.parse(order.totalQuantity)
            existingOrder.cancellable += JSON.parse(order.cancellable)
            existingOrder.status += JSON.parse(order.status)

            existingOrder.save()
            res.status(200).send({ status: true, msg: 'Order Successfully completed', data: existingOrder })
        }

        //if cart doesn't exist make a new cart.......................
        console.log(order)
        let newOrder = await cartModel.create(order)
        res.status(201).send({ status: true, msg: 'Order is Sucecessfully Created', data: newOrder })
        
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