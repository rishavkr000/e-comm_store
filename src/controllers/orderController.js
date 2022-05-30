const orderModel=require("../models/orderModel")
const cartModel=require("../models/cartModel")

const { isValidObjectId, isValid, isValidRequestBody}=require("../utils/validator")

//----------------------------------------create Order---------------------------------------
const createOrder = async function (req, res) {
    try {
        let userId = req.params.userId;

    let findCart = await cartModel.findOne({ userId: userId });
    if(!findCart) return res.status(404).send({ status: false, message: `No cart found with this user-ID` })

    if (userId != req.userId) return res.status(401).send({ status: false, msg: "User not authorized" })

    if(findCart.items.length == 0) return res.status(400).send({ status: false, message: "Cart is already empty" });

    let data = req.body;

    if(!isValidRequestBody(data)) return res.status(400).send({ status: false, message: 'Data is required to place your order' });

    if(!isValid(data.cartId)) return res.status(400).send({ status: false, message: "CartId is required" })
    if(!isValidObjectId(data.cartId)) return res.status(400).send({ status: false, message: "Enter a valid cart-ID" })

    //checking if cartId is same or not
    if(findCart._id.toString() !== data.cartId) return res.status(400).send({ status: false, message: 'CartId not matched' });

    //checking cancellable value is present
    if(data.cancellable || typeof data.cancellable == 'string') {
      if(!data.cancellable) return res.status(400).send({ status: false, message: "Enter a valid value for is cancellable" })
      if(!isValid(data.cancellable)) return res.status(400).send({ status: false, message: "Enter a valid value for is cancellable" })
      if(typeof data.cancellable == 'string'){
        data.cancellable = data.cancellable.toLowerCase().trim();;
        if(data.cancellable == 'true' || data.cancellable == 'false') {
          //convert from string to boolean
          data.cancellable = JSON.parse(data.cancellable);
        }else {
          return res.status(400).send({ status: false, message: "Enter a valid value for cancellable" })
        }
      }
      if(typeof data.cancellable !== 'boolean') return res.status(400).send({ status: false, message: "Cancellable should be in boolean value" })
    }

    data.totalQuantity = 0
    findCart.items.map(x => {
      data.totalQuantity += x.quantity
    })

    data.userId = userId;
    data.items = findCart.items;
    data.totalPrice = findCart.totalPrice;
    data.totalItems = findCart.totalItems;

    let resData = await orderModel.create(data);
    await cartModel.updateOne(
      {_id: findCart._id},
      {items: [], totalPrice: 0, totalItems: 0}
    )
    res.status(201).send({ status: false, message: "Order created successfully", data: resData });
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