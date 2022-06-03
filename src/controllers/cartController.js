const cartModel = require('../models/cartModel')
const {userModel} = require('../models/userModel')
const productModel = require('../models/productModel')

const { isValidObjectId, isValid, isValidRequestBody } = require('../utils/validator')


// ============== POST / Create Cart =======================//



const createCart = async (req, res) => {
    try {
        let userId = req.params.userId;
        let data = req.body;
        if (!(isValidRequestBody(data)))
            return res.status(400).send({ status: false, message: "Body cannot be empty" });

            if (!isValidObjectId(userId)) {
                return res.status(400).send({ status: false, msg: "Invalid User Id" })
            }
  
        if (userId != req.userId) return res.status(401).send({ status: false, msg: "User not authorized" })

        let { productId, cartId, quantity } = data
        if (!(isValid(productId)))
            return res.status(400).send({ status: false, message: "product required" })

        if (!quantity) {
            quantity = 1
        }
        quantity = Number(quantity)
        if (typeof quantity !== 'number')
            return res.status(400).send({ status: false, message: "quantity is number" })
        if (quantity < 1)
            return res.status(400).send({ status: false, message: "quantity cannot be less then 1" })
        if (!isValidObjectId(productId))
            return res.status(400).send({ status: false, message: "Invalid product ID" })
        if (cartId) {
            if (!isValidObjectId(cartId))
                return res.status(400).send({ status: false, message: "Invalid cart ID" })
        }

        //checking for valid user
        let validUser = await userModel.findOne({ _id: userId })
        if (!validUser) return res.status(404).send({ status: false, message: "User does not exists" })

        if (cartId) {
            var findCart = await cartModel.findOne({ _id: cartId })
            if (!findCart)
                return res.status(404).send({ status: false, message: "Cart does not exists" })
        }


        //searching for product    
        let validProduct = await productModel.findOne({ _id: productId, isDeleted: false })
        if (!validProduct) return res.status(404).send({ status: false, message: "No products found or product has been deleted" })

        let validCart = await cartModel.findOne({ userId: userId })
        if (!validCart && findCart) {
            return res.status(403).send({ status: false, message: `Cart does not belong to ${validUser.fname} ${validUser.lname}` })
        }
        if (validCart) {
            if (cartId) {
                if (validCart._id.toString() != cartId)
                    return res.status(403).send({ status: false, message: `Cart does not belong to ${validUser.fname} ${validUser.lname}` })
            }
            let productidincart = validCart.items
            let uptotal = validCart.totalPrice + (validProduct.price * Number(quantity))
            let proId = validProduct._id.toString()
            for (let i = 0; i < productidincart.length; i++) {
                let productfromitem = productidincart[i].productId.toString()

                //updates old product i.e QUANTITY
                if (proId == productfromitem) {
                    let oldQuant = productidincart[i].quantity
                    let newquant = oldQuant + quantity
                    productidincart[i].quantity = newquant
                    validCart.totalPrice = uptotal
                    await validCart.save();
                    // let result = await cartModel.findOne({ _id: userId }).select({ "items._id": 0, __v: 0 })
                    return res.status(201).send({ status: true, message: 'Success', data: validCart })
                }
            }
            //adds new product
            validCart.items.push({ productId: productId, quantity: Number(quantity) })
            let total = validCart.totalPrice + (validProduct.price * Number(quantity))
            validCart.totalPrice = total
            let count = validCart.totalItems
            validCart.totalItems = count + 1
            await validCart.save()
            //let result = await cartModel.findOne({ _id: userId }).select({ "items._id": 0, __v: 0 })
            return res.status(201).send({ status: true, message: 'Success', data: validCart })
        }

        // 1st time cart
        let calprice = validProduct.price * Number(quantity)
        let obj = {
            userId: userId,
            items: [{
                productId: productId,
                quantity: quantity
            }],
            totalPrice: calprice,
        }
        obj['totalItems'] = obj.items.length
        let result = await cartModel.create(obj)
        // let result = await cartModel.findOne({ _id: cartId }).select({ "items._id": 0, __v: 0 })
        return res.status(201).send({ status: true, message: 'Success', data: result })
    }
    catch (err) {
        return res.status(500).send({ status: false, err: err.message });
    }
}



// const createCart = async function (req, res) {
//     try {
//         const userId = req.params.userId;
//         let requestBody = req.body;

//         if (!isValidObjectId(userId)) {
//             return res.status(400).send({ status: false, msg: "Invalid User Id" })
//         }

//         const checkUser = await userModel.findById(userId)
//         if (!checkUser) return res.status(404).send({ status: false, msg: "User does not exist" })

//         if (userId != req.userId) return res.status(401).send({ status: false, msg: "User not authorized" })

//         if (!isValidRequestBody(requestBody)) {
//             return res.status(400).send({ status: false, msg: 'Please Provide cart details' })
//         }

//         const existingCart = await cartModel.findOne({ userId: userId })
//         if (!existingCart) {
//             const productId = req.body.items[0].productId;
            
//             if (!isValidObjectId(productId)) {
//                 return res.status(400).send({ status: false, msg: "Invalid productId" })
//             }

//             let product = await productModel.findOne({ _id: productId, isDeleted: false })
//             if (!product) {
//                 return res.status(404).send({ status: false, msg: 'Product not found.' })
//             }

//             if (req.body.items[0].quantity == 0) {
//                 return res.status(400).send({ status: false, msg: "Quantity should be >= 1" })
//             }

//             const totalItems = requestBody.items.length;
//             const totalPrice = product.price * requestBody.items[0].quantity;

//             const cart = {
//                 userId: userId,
//                 items: requestBody.items,
//                 totalPrice: totalPrice,
//                 totalItems: totalItems
//             }

//             const cartData = await cartModel.create(cart);
//             return res.status(201).send({ status: true, msg: "Cart created Successfully", data: cartData })
//         }


//         if (existingCart) {
//             const productId = req.body.items[0].productId;
//             if (!isValidObjectId(productId)) {
//                 return res.status(400).send({ status: false, msg: "Invalid productId" })
//             }

//             let product = await productModel.findOne({ _id: productId, isDeleted: false })
//             if (!product) {
//                 return res.status(404).send({ status: false, msg: 'Product not found.' })
//             }

//             if (req.body.items[0].quantity == 0) {
//                 return res.status(400).send({ status: false, msg: "Quantity should be >= 1" })
//             }

//             for (let i = 0; i < existingCart.items.length; i++) {
//                 if (productId == existingCart.items[i].productId) {
//                     const totalPrice = existingCart.totalPrice + (product.price * requestBody.items[0].quantity)
//                     existingCart.items[i].quantity = existingCart.items[i].quantity + requestBody.items[0].quantity

//                     const updatedCart = await cartModel.findOneAndUpdate({ userId: userId }, { items: existingCart.items, totalPrice: totalPrice }, { new: true })
//                     return res.status(200).send({ status: true, msg: "Cart created Successfully", data: updatedCart })
//                 }
//             }

//             const totalItems = requestBody.items.length + existingCart.totalItems;
//             const totalPrice = existingCart.totalPrice + (product.price * requestBody.items[0].quantity);

//             const updatedCart = await cartModel.findOneAndUpdate({ userId: userId }, { $addToSet: { items: { $each: requestBody.items } }, totalPrice: totalPrice, totalItems: totalItems }, { new: true })

//             return res.status(200).send({ status: true, msg: "Cart created Successfully", data: updatedCart })
//         }

//     } catch (error) {
//         res.status(500).send({ status: false, msg: error.message })
//     }
// }

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

        if (isValid(productId)){
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

        if (isValid(cartId)){
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

// ============== GET / Get Cart =======================//

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

// ============== DELETE / Delete Cart =======================//

const deleteCart = async (req, res) => {
    try {
        const userId = req.params.userId
        if (!isValidObjectId(userId)) return res.status(400).send({ status: false, msg: "Invalid User Id" })

        const checkUser = await userModel.findOne({ userId })
        if (!checkUser) return res.status(404).send({ status: false, msg: "User does not exist" })

        if (userId != req.userId) return res.status(401).send({ status: false, msg: "User not authorized" })

        const findCart = await cartModel.findOne({userId})
        if (!findCart) {
            return res.status(404).send({ status: false, msg: "No Cart Found" })
        }

        await cartModel.findOneAndUpdate({ userId: userId }, { item: [], totalPrice: 0, totalItems: 0 })
        return res.status(204).send({ status: true, msg: "Cart deleted Successfully" })
    }
    catch (error) {
        res.status(500).send({ status: false, msg: error.message })
    }
}



module.exports = { createCart, updateCart, getCart, deleteCart }