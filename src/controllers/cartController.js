const cartModel = require('../models/cartModel')
const { userModel } = require('../models/userModel')
const productModel = require('../models/productModel')

const { isValidObjectId, isValid, isValidRequestBody } = require('../utils/validator')


// ============== POST / Create Cart =======================//


// const createCart = async (req, res) => {
//     try {

//         let data = JSON.parse(JSON.stringify(req.body));
//         if (!(isValidRequestBody(data)))
//             return res.status(400).send({ status: false, message: "Body cannot be empty" });

//         let userId = req.params.userId
//         if (!isValidObjectId(userId))
//             return res.status(400).send({ status: false, message: "Invalid userId ID" })  

//         let { productId, cartId, quantity } = data
//         if (!(isValid(productId)))
//             return res.status(400).send({ status: false, message: "product required" })

//         if (!quantity) {
//             quantity = 1
//         }
//         quantity = Number(quantity)
//         if (typeof quantity !== 'number')
//             return res.status(400).send({ status: false, message: "quantity is number" })
//         if (quantity < 1)
//             return res.status(400).send({ status: false, message: "quantity cannot be less then 1" })
//         if (!isValidObjectId(productId))
//             return res.status(400).send({ status: false, message: "Invalid product ID" })

//         if (cartId) {
//             if (!isValidObjectId(cartId))
//                 return res.status(400).send({ status: false, message: "Invalid cart ID" })
//         }

//         //checking for valid user
//         let validUser = await userModel.findOne({ _id: userId })
//         if (!validUser) return res.status(404).send({ status: false, message: "User does not exists" })

// if (cartId) {
//     var findCart = await cartModel.findOne({ _id: cartId })
//     if (!findCart)
//         return res.status(404).send({ status: false, message: "Cart does not exists" })
// }

//         // user authorization    
//         if (userId != req.userId)
//             return res.status(403).send({ status: false, message: "Unauthorized access" });

// //searching for product    
// let validProduct = await productModel.findOne({ _id: productId, isDeleted: false })
// if (validProduct) return res.status(404).send({ status: false, message: "No products found or product has been deleted" })

//         let checkCartExist = await cartModel.findOne({ userId: userId })
//         if (!checkCartExist && findCart) {
//             return res.status(403).send({ status: false, message: `Cart does not belong to ${validUser.fname} ${validUser.lname}` })
//         }
//         if (checkCartExist) {
// if (cartId) {
//     if (checkCartExist._id.toString() != cartId)
//         return res.status(403).send({ status: false, message: `Cart does not belong to ${validUser.fname} ${validUser.lname}` })
//             }
// let productidincart = checkCartExist.items
// let uptotal = checkCartExist.totalPrice + (validProduct.price * Number(quantity))
// let proId = validProduct._id.toString()
// for (let i = 0; i < productidincart.length; i++) {
//     let productfromitem = productidincart[i].productId.toString()

//     //updates old product i.e QUANTITY
//     if (proId == productfromitem) {
//         let oldQuant = productidincart[i].quantity
//         let newquant = oldQuant + quantity
//         productidincart[i].quantity = Number(newquant)
//         checkCartExist.totalPrice = Number(uptotal)
//         await checkCartExist.save();
//         return res.status(201).send({ status: true, message: 'Success', data: checkCartExist })
//     }
// }
// //adds new product
// checkCartExist.items.push({ productId: productId, quantity: Number(quantity) })
// let total = checkCartExist.totalPrice + (validProduct.price * Number(quantity))
// checkCartExist.totalPrice = Number(total)
// let count = checkCartExist.totalItems
// checkCartExist.totalItems = count + 1
// await checkCartExist.save()
// return res.status(201).send({ status: true, message: 'Success', data: checkCartExist })
//         }

//         // 1st time cart
//     let calprice = validProduct.price * Number(quantity)
//     let obj = {
//         userId: userId,
//         items: [{
//             productId: productId,
//             quantity: quantity
//         }],
//         totalPrice: calprice,
//     }
//     obj['totalItems'] = obj.items.length
//     let result = await cartModel.create(obj)
//     //result = await cartModel.findOne({ _id: cartId }).select({ "items._id": 0, __v: 0 })
//     return res.status(201).send({ status: true, message: 'Success', data: result })
// }
//     catch (err) {
//         return res.status(500).send({ status: false, err: err.message });
//     }
// }

const createCart = async function (req, res) {
    try {
        const requestBody = req.body
        const userId = req.params.userId
        let { productId, cartId } = requestBody

        //  authroization
        if (userId != req.userId)
            return res.status(401).send({ status: false, msg: "User not authorized to update details" })

        if (!isValidObjectId(userId)) {
            return res.status(400).send({ status: true, message: "Invalid userId" })
        }
        if (!isValidRequestBody(requestBody)) {
            return res.status(400).send({ status: false, message: "Please provide cart details" })
        }

        if (cartId) {
            if (!isValid(cartId))
                return res.status(400).send({ status: true, message: "cartId is required in the request body" })

            if (!isValidObjectId(cartId))
                return res.status(400).send({ status: true, message: "cartId is invalid" })
        }

        if (!isValid(productId)) {
            return res.status(400).send({ status: true, message: "productId is required in the request body" })
        }

        if (!isValidObjectId(productId)) {
            return res.status(400).send({ status: true, message: "productId is invalid" })
        }

        const checkProduct = await productModel.findOne({ _id: productId, isDeleted: false })
        if (!checkProduct) {
            return res.status(404).send({ status: true, message: "product not exist or already deleted" })
        }

        const checkCartExist = await cartModel.findOne({ userId: userId })

        if (!checkCartExist) {
            if (cartId) return res.status(404).send({ status: false, message: "Cart not exist for this user" })
            let createCartObject = {
                userId: userId,
                items: [{ productId: productId, quantity: 1 }],
                totalPrice: checkProduct.price,
                totalItems: 1,
            }
            const createCart = await cartModel.create(createCartObject)
            return res.status(201).send({ status: true, message: "Success", data: createCart })
        }

        if (checkCartExist) {
            if (!cartId) return res.status(400).send({ status: true, message: "Cart id is required" })
            if (checkCartExist._id.toString() !== cartId)
                return res.status(404).send({ status: true, message: "Cart not found" })
        }
        let array = checkCartExist.items
        for (let i = 0; i < array.length; i++) {
            if (array[i].productId == productId) {
                array[i].quantity = array[i].quantity + 1
                const updateCart = await cartModel.findOneAndUpdate(
                    { userId: userId },
                    {
                        items: array,
                        totalPrice: checkCartExist.totalPrice + checkProduct.price,
                    },
                    { new: true }
                )
                
                return res.status(201).send({ status: true, message: "Success", data: updateCart })
            }
        }
        let updateCartObject = {
            $addToSet: { items: { productId: productId, quantity: 1 } },
            totalPrice: checkCartExist.totalPrice + checkProduct.price,
            totalItems: checkCartExist.totalItems + 1,
        }
        const updateCart = await cartModel.findOneAndUpdate({ userId: userId }, updateCartObject, { new: true })

        res.status(201).send({ status: true, message: "Success", data: updateCart })
    }
    catch (error) {
        res.status(500).send({ status: false, message: error.message })
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

        if (isValid(productId)) {
            if (!isValidObjectId(productId)) {
                return res.status(400).send({ status: false, msg: 'productId is inValid' })
            }
        }

        const findProduct = await productModel.findById(productId);
        if (!findProduct) {
            return res.status(404).send({ status: false, msg: "No Poduct Found" })
        }

        if (findProduct.isDeleted == true) {
            return res.status(400).send({ status: false, msg: "Product is already deleted" })
        }

        if (isValid(cartId)) {
            if (!isValidObjectId(cartId)) {
                return res.status(400).send({ status: false, msg: 'cartId is inValid' })
            }
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

        const isCart = await cartModel.findOne({ _id: cartId, "items.productId": productId })

        if (!isCart)
            return res.status(404).send({ status: false, message: "product is not available in cart or cartId doesn't exist" })
        if (removeProduct == 1) {
            for (let i = 0; i < findCart.items.length; i++) {
                if (productId == findCart.items[i].productId) {
                    let totalPrice = findCart.totalPrice - findProduct.price
                    if (findCart.items[i].quantity > 1) {
                        findCart.items[i].quantity -= 1
                        let updateCart = await cartModel.findOneAndUpdate({ _id: cartId }, { items: findCart.items, totalPrice: totalPrice }, { new: true })
                        return res.status(200).send({ status: true, msg: "Cart Update Successfully", data: updateCart })
                    } else {
                        let totalItem = findCart.totalItems - 1
                        findCart.items.splice(i, 1)
                        let updateCart = await cartModel.findOneAndUpdate({ _id: cartId }, { items: findCart.items, totalPrice: totalPrice, totalItems: totalItem }, { new: true })
                        return res.status(200).send({ status: true, msg: "Cart Update Successfully", data: updateCart })
                    }
                }
            }
        }

        if (removeProduct == 0) {
            for (let i = 0; i < findCart.items.length; i++) {
                if (productId == findCart.items[i].productId) {
                    let totalPrice = findCart.totalPrice - (findProduct.price * findCart.items[i].quantity)
                    let totalItem = findCart.totalItems - 1
                    findCart.items.splice(i, 1)
                    let updateCart = await cartModel.findOneAndUpdate({ _id: cartId }, { items: findCart.items, totalPrice: totalPrice, totalItems: totalItem }, { new: true })
                    return res.status(200).send({ status: true, msg: "Cart Update Successfully", data: updateCart })
                }
            }
        }
    }
    catch (error) {
        res.status(500).send({ status: false, msg: error.message })
    }
}

// // ============== GET / Get Cart =======================//

const getCart = async (req, res) => {
    try {
        const userId = req.params.userId
        if (!isValidObjectId(userId)) return res.status(400).send({ status: false, msg: "Invalid User Id" })

        const checkUser = await userModel.findOne({ _id: userId })
        if (!checkUser) return res.status(404).send({ status: false, msg: "User does not exist" })

        if (userId != req.userId) return res.status(401).send({ status: false, msg: "User not authorized" })

        checkCart = await cartModel.findOne({ userId: userId }).select({ __v: 0 })
        if (!checkCart) return res.status(404).send({ status: false, message: "Cart not found" })

        res.status(200).send({ status: true, data: checkCart })

    }
    catch (error) {
        res.status(500).send({ status: false, msg: error.message })
    }
}

// // ============== DELETE / Delete Cart =======================//

const deleteCart = async (req, res) => {
    try {
        const userId = req.params.userId
        if (!isValidObjectId(userId)) return res.status(400).send({ status: false, msg: "Invalid User Id" })

        const checkUser = await userModel.findOne({ userId })
        if (!checkUser) return res.status(404).send({ status: false, msg: "User does not exist" })

        if (userId != req.userId) return res.status(401).send({ status: false, msg: "User not authorized" })

        const findCart = await cartModel.findOne({ userId: userId })
        if (!findCart) {
            return res.status(404).send({ status: false, msg: "No Cart Found" })
        }

        await cartModel.findOneAndUpdate({ userId: userId }, { items: [], totalPrice: 0, totalItems: 0 })
        return res.status(204).send({ status: true, message: 'Success' })
    }
    catch (error) {
        res.status(500).send({ status: false, msg: error.message })
    }
}


module.exports = { createCart, updateCart, getCart, deleteCart }