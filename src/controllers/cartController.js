const cartModel = require('../models/cartModel')
const userModel = require('../models/userModel')
const productModel = require('../models/productModel')

const { isValidObjectId, isValid, isValidRequestBody } = require('../utils/validator')


// ============== POST / Create Cart =======================//


const createCart = async function (req, res) {
    try {
        let userId = req.params.userId
        if (!isValidObjectId(userId)) return res.status(400).send({ status: false, msg: 'Enter valid User Id.' })
       
        let data = JSON.parse(JSON.stringify(req.body))
        
        if(!isValidRequestBody(data))return res.status(400).send({ status: false, msg: 'Enter cart details.'})
        if(!isValid(data.userId))return res.status(400).send({ status: false, msg: 'Enter userId.'})
        if(!isValidObjectId(data.userId))return res.status(400).send({ status: false, msg: 'Enter valid User Id.' })
        if(!Object.keys(data.items).length>0)return res.status(400).send({ status: false, msg: 'Enter items.'})
        
        data.items=JSON.parse(data.items)
        //data.totalPrice=JSON.parse(data.totalPrice)
        //data.totalItems=JSON.parse(data.totalItems)
        
        if(!isValid(data.items.productId))return res.status(400).send({ status: false, msg: 'Enter productId.'})  
        if(!isValidObjectId(data.items.productId))return res.status(400).send({ status: false, msg: 'Enter valid Product Id.' })
        if (!data.items.quantity > 0) return res.status(400).send({ status: false, msg: 'quantity must be minimum 1.' })
        if(!isValid(data.totalPrice))return res.status(400).send({ status: false, msg: 'Enter totalPrice.'})
        if(!isValid(data.totalItems))return res.status(400).send({ status: false, msg: 'Enter totalItems.'})
        
        let existingProduct=await productModel.findOne({_id:data.items.productId,isDeleted:false})
        if(!existingProduct)return res.status(404).send({status:false,msg:'Product Not found.'})
       
        //if cart already exists............................ 
        let existingCart = await cartModel.findOne({ userId: userId })
        if (existingCart) {
            existingCart.items.push(data.items)
            existingCart.totalPrice += JSON.parse(data.totalPrice)
            existingCart.totalItems += JSON.parse(data.totalItems)
            existingCart.save()
            res.status(200).send({ status: true, msg: 'Item Successfully added to cart', data: existingCart })
        }


        //if cart doesn't exist make a new cart.......................
        console.log(data)
        let newCart=await cartModel.create(data)
        res.status(201).send({status:true,msg:'Cart Created Successfully',data:newCart})

    }
    catch (error) {
        res.status(500).send({ status: false, msg: error.message })
    }
}


// ============== PUT / Update Cart =======================//


const updateCart = async (req, res) => {
    try{

    }
    catch (error) {
        res.status(500).send({ status: false, msg: error.message })
    }
}


// ============== GET / Get Cart =======================//


const getCart = async (req, res) => {
    try{
        const userId = req.params.userId
        if(!isValidObjectId(userId)) return res.status(400).send({status: false, msg: "Invalid User Id"})

        const checkUser = await userModel.findOne({_id : userId})
        if(!checkUser) return res.status(400).send({status: false, msg: "User does not exist"})

        checkCart = await cartModel.findOne({ userId: userId }).select({ __v: 0 })
        if (!checkCart) return res.status(404).send({ status: false, message: "Cart not found" })

        res.status(200).send({ status: true, data: checkCart })

    }
    catch (error) {
        res.status(500).send({ status: false, msg: error.message })
    }
}



// ============== DELETE / Delete Cart =======================//



const deleteCart = async (req, res) => {
    try{

    }
    catch (error) {
        res.status(500).send({ status: false, msg: error.message })
    }
}



module.exports = { createCart, updateCart, getCart, deleteCart }