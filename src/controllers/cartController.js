const cartModel = require('../models/cartModel')
const userModel = require('../models/userModel')
const productModel = require('../models/productModel')

const { isValidObjectId, isValid, isValidRequestBody } = require('../utils/validator')


// ============== POST / Create Cart =======================//


const createCart = async function (req, res) {
    try {
        let userId = req.params.userId
        if (!isValidObjectId(userId)) return res.status(400).send({ status: false, msg: 'Enter valid User Id.' })
        if (userId != req.userId) return res.status(401).send({ status: false, msg: "User not authorized to update details" })


        let data = JSON.parse(JSON.stringify(req.body))

        if (!isValidRequestBody(data)) return res.status(400).send({ status: false, msg: 'Enter cart details.' })
        if (!isValid(data.userId)) return res.status(400).send({ status: false, msg: 'Enter userId.' })
        if (!isValidObjectId(data.userId)) return res.status(400).send({ status: false, msg: 'Enter valid User Id.' })
        if (!Object.keys(data.items).length > 0) return res.status(400).send({ status: false, msg: 'Enter items.' })

        data.items = JSON.parse(data.items)
        //data.totalPrice=JSON.parse(data.totalPrice)
        //data.totalItems=JSON.parse(data.totalItems)

        if (!isValid(data.items.productId)) return res.status(400).send({ status: false, msg: 'Enter productId.' })
        if (!isValidObjectId(data.items.productId)) return res.status(400).send({ status: false, msg: 'Enter valid Product Id.' })
        if (!data.items.quantity > 0) return res.status(400).send({ status: false, msg: 'quantity must be minimum 1.' })
        if (!isValid(data.totalPrice)) return res.status(400).send({ status: false, msg: 'Enter totalPrice.' })
        if (!isValid(data.totalItems)) return res.status(400).send({ status: false, msg: 'Enter totalItems.' })

        let existingProduct = await productModel.findOne({ _id: data.items.productId, isDeleted: false })
        if (!existingProduct) return res.status(404).send({ status: false, msg: 'Product Not found.' })

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
        let newCart = await cartModel.create(data)
        res.status(201).send({ status: true, msg: 'Cart Created Successfully', data: newCart })

    }
    catch (error) {
        res.status(500).send({ status: false, msg: error.message })
    }
}

// ============== PUT / Update Cart =======================//

const updateCart = async (req, res) => {
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

        const { productId, cartId, removeProduct } = requestBody;

        if (!isValidObjectId(productId)) {
            return res.status(400).send({ status: false, msg: 'productId is inValid' })
        }

        const findProduct = await productModel.findById(productId);
        if (!findProduct) {
            return res.status(404).send({ status: false, msg: "No Poduct Found" })
        }

        if (findProduct.isDeleted == true) {
            return res.status(400).send({ status: false, msg: "Poduct is Already Deleted" })
        }

        if (!isValidObjectId(cartId)) {
            return res.status(400).send({ status: false, msg: 'productId is inValid' })
        }

        const findCart = await cartModel.findOne({ userId: userId, _id: cartId });
        if (!findCart) {
            return res.status(404).send({ status: false, msg: "No Cart Found" })
        }

        if (findCart.items.length == 0) {
            return res.status(400).send({ status: false, msg: "Cart of this user is already empty" })
        }

        if (!(removeProduct == 0 || removeProduct == 1)) {
            return res.status(400).send({ status: false, msg: "removePoduct value should be 0 or 1" })
        }
        if (removeProduct == 1) {
            for (let i = 0; i < findCart.length; i++) {
                if (productId == findCart.items[i].productId) {
                    let totalPrice = findCart.totalPrice - findProduct.price
                    if (findCart.items[i].quantity > 1) {
                        findCart.items[i].quantity -= 1
                        let updateCart = await cartModel.findOneAndUpdate({ _id: cartId }, { items: findCart.items, totalPrice: totalPrice }, { new: true })
                        return res.status(200).send({ status: true, msg: "Cart Update Successfully", data: updateCart})
                    }else{
                        let totalItem = findCart.totalItems - 1
                        findCart.items.splice(i, 1)
                        let updateCart = await cartModel.findOneAndUpdate({ _id: cartId }, { items: findCart.items, totalPrice: totalPrice, totalItems: totalItem }, { new: true })
                        return res.status(200).send({ status: true, msg: "Cart Update Successfully", data: updateCart})
                    }
                }
            }
        }

        if (removeProduct == 1) {
            for (let i = 0; i < findCart.length; i++) {
                if (productId == findCart.items[i].productId) {
                    let totalPrice = findCart.totalPrice - (findProduct.price * findCart.items[i].quantity)
                    let totalItem = findCart.totalItems - 1
                    findCart.items.splice(i, 1)
                        let updateCart = await cartModel.findOneAndUpdate({ _id: cartId }, { items: findCart.items, totalPrice: totalPrice, totalItems: totalItem }, { new: true })
                        return res.status(200).send({ status: true, msg: "Cart Update Successfully", data: updateCart})  
                }
            }
        }          
    }
    catch (error) {
        res.status(500).send({ status: false, msg: error.message })
    }
}

// ============== GET / Get Cart =======================//

const getCart = async (req, res) => {
    try {
        const userId = req.params.userId
        if (!isValidObjectId(userId)) return res.status(400).send({ status: false, msg: "Invalid User Id" })
        
        const checkUser = await userModel.findOne({ _id: userId })
        if (!checkUser) return res.status(400).send({ status: false, msg: "User does not exist" })
        
        if (userId != req.userId) return res.status(401).send({ status: false, msg: "User not authorized to update details" })

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
    try {
        const userId = req.params.userId
        if (!isValidObjectId(userId)) return res.status(400).send({ status: false, msg: "Invalid User Id" })

        const checkUser = await userModel.findOne({ userId })
        if (!checkUser) return res.status(404).send({ status: false, msg: "User does not exist" })

        if (userId != req.userId) return res.status(401).send({ status: false, msg: "User not authorized to update details" })

        const findCart = await cartModel.findOne(userId)
        if (!findCart) {
            return res.status(404).send({ status: false, msg: "No Cart Found" })
        }

        await cartModel.findOneAndUpdate({userId: userId},{item: [], totalPrice: 0, totalItems: 0})
        return res.status(204).send({ status: true, msg: "Cart deleted Successfully"})  
    }
    catch (error) {
        res.status(500).send({ status: false, msg: error.message })
    }
}



module.exports = { createCart, updateCart, getCart, deleteCart }