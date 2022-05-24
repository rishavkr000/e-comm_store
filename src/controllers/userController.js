const aws = require('aws-sdk')
const bcrypt = require('bcrypt');
const { json } = require('body-parser');
const userModel = require('../models/userModel')
const jwt = require ("jsonwebtoken")

const {isValid,isValidRequestBody,isValidObjectId} = require("../utils/validator")


//***********************************************************< AWS>*********************************************************//
aws.config.update({
    accessKeyId: "AKIAY3L35MCRUJ6WPO6J",
    secretAccessKey: "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",
    region: "ap-south-1"
})

let uploadFile = async (file) => {
    return new Promise(function (resolve, reject) {
        // this function will upload file to aws and return the link
        let s3 = new aws.S3({ apiVersion: '2006-03-01' }); // we will be using the s3 service of aws

        var uploadParams = {
            ACL: "public-read",
            Bucket: "classroom-training-bucket",
            Key: "group41/" + file.originalname, 
            Body: file.buffer
        }


        s3.upload(uploadParams, function (err, data) {
            if (err) {
                return reject({ "error": err })
            }
            console.log(data)
            console.log("file uploaded succesfully")
            return resolve(data.Location)
        })

    })
}


const postRegister = async function (req, res) {
    try {
        let data = JSON.parse(req.body.body)
        
        if(!isValidRequestBody(data))return res.status(400).send({status:false, msg:'Enter details for user creation.'})
        
        let files = req.files
        let uploadedFileURL
        if (files && files.length > 0) {
            uploadedFileURL = await uploadFile(files[0])
        }
        else {
            res.status(400).send({ msg: "No file found" })
        }

        let { fname, lname, email,password, phone, address } = data

        if(!isValid(fname))return res.status(400).send({status:false, msg:'Enter fname.'})
        
        if(!isValid(lname))return res.status(400).send({status:false, msg:'Enter lname.'})
        
        if(!isValid(email))return res.status(400).send({status:false, msg:'Enter email.'})
        if (!(/^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/.test(email))) {
            return res.status(400).send({ status: false, msg: "Please enter a valid email address" })
        }
        let existingEmail= await userModel.findOne({email:email})
        if(existingEmail)return res.status(400).send({status:false, msg:`${email} already exists.`})

        if(!isValid(phone))return res.status(400).send({status:false, msg:'Enter phone.'})
        //if(!(/^[6-9]\d{9}$/.test(phone))) return res.status(400).send({ status: false, msg: "Please enter a valid Indian Mobile Number."})
        if (`${phone}`.length < 10 || `${phone}`.length > 10) {
            return res.status(400).send({ status: false, msg: "Please enter a valid Mobile Number" })
        }
        let existingPhone= await userModel.findOne({phone:phone})
        if(existingPhone)return res.status(400).send({status:false, msg:`${phone} already exists.`})

        if(!isValid(password))return res.status(400).send({status:false, msg:'Enter password.'})
        if (!(`${password}`.length <= 15 && `${password}`.length >= 8)) {
            return res.status(400).send({ status: false, msg: "Please enter password length from 8 to 15" })
        }
        data.password = await bcrypt.hash(password,10)

        if(!isValid(address.shipping.street))return res.status(400).send({status:false, msg:'Enter shipping street.'})
        if(!isValid(address.shipping.city))return res.status(400).send({status:false, msg:'Enter shipping city.'})
        if(!isValid(address.shipping.pincode))return res.status(400).send({status:false, msg:'Enter shipping pincode.'})
        
        if(!isValid(address.billing.street))return res.status(400).send({status:false, msg:'Enter billing street.'})
        if(!isValid(address.billing.city))return res.status(400).send({status:false, msg:'Enter billing city.'})
        if(!isValid(address.billing.pincode))return res.status(400).send({status:false, msg:'Enter billing pincode.'})

        data.profileImage = uploadedFileURL

        let newUser = await userModel.create(data)
        res.status(201).send({status:true,msg:'USER SUCCESSFULLY CREATED.',data:newUser})

    }
    catch (error) {
        res.status(500).send({ status: false, msg: error.message })
    }
}


//******************************************************< User Login >******************************************************//

const loginUser = async function (req, res) {
    try {
        const loginData = req.body;

        if (!isValidRequestBody(loginData)) return res.status(400).send({ status: false, message: "Login Credentials cannot be empty" })

        const { email, password } = loginData

        if(!isValid(email)) return res.status(400).send({ status: false, message: "Email is required" })
        if (!(/^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/.test(email))) {
            return res.status(400).send({ status: false, msg: "Please enter a valid email address" })
        }

        if(!isValid(password)) return res.status(400).send({ status: false, message: "Password is required" })
        if (!(`${password}`.length <= 15 && `${password}`.length >= 8)) {
            return res.status(400).send({ status: false, msg: "Please enter password length from 8 to 15" })
        }

        //DB call for checking user is valid user
        const user = await userModel.findOne({ email: email})
        if (!user) {
            return res.status(404).send({ status: false, message: "Email is not correct" })
        }
        const samePassword = await bcrypt.compare(password,user.password);
        if(!samePassword){
            return res.status(404).send({ status: false, message: "Password is not correct" })
        }

        let token = jwt.sign(
            {
                userId: user._id.toString(),
                batch: "Uranium",
                organisation: "FunctionUp",
                exp: Math.floor(Date.now() / 1000) + (60 * 60) // 1 hour 1200s | 2500 (60*10) | (60 * min)
            },
            "functionUp-Uranium"
        )
        //sending token in header response
        res.setHeader("Authorization","Bearer" + token)

        const data = {
            user: user._id,
            token : token
        }
        res.status(200).send({ status: true, data: data })
    }
    catch (error) {
        res.status(500).send({ status: false, message: error.message })
    }
}

//******************************************************< Get User Details **************************************************//

const profileDetails = async function (req,res){
    try {
        const userId = req.params.userId;
        if(!isValidObjectId(userId)){
            return res.status(400).send({ status: false, msg: "Please enter a valid userId" })
        }

        const user = await userModel.findById(userId);
        if(!user){
            return res.status(404).send({ status: false, msg: "User not Found" }) 
        }

        res.status(200).send({ status: true, data: user })
    } catch (error) {
        res.status(500).send({ status: false, message: error.message })
        
    }
}

//****************************************************< Update User Details ************************************************//

const updateUser = async function (req, res){
    try{
        const userId = req.params.userId;
        if(!isValidObjectId(userId)){
            return res.status(400).send({ status: false, msg: "Please enter a valid userId" })
        }

        const findUserDetails =await userModel.findById(userId)
        if(!findUserDetails){
            return res.status(404).send({status: false, msg: "UserDetails not found"}) 
        }
        if(userId != req.userId) return res.status(403).send({status: false, msg: "User not authorized to update details"})

        let data = JSON.stringify(req.body.body)
        if(!data){
            return res.send({status: false, msg: "Nothing to Update"})
         }
        let files = req.files
        let uploadedFileURL
        if (files && files.length > 0) {
            uploadedFileURL = await uploadFile(files[0])
        }
        else {
            res.status(400).send({ msg: "No file found" })
        }

        let updateDetails = {}

        let { fname, lname, email,password, phone, address } = data

        if(data.hasOwnProperty("fname")){
            if(!isValid(fname))return res.status(400).send({status:false, msg:'Enter fname.'})
            updateDetails["fname"] = fname.trim()
        }

        if(data.hasOwnProperty("lname")){
            if(!isValid(lname))return res.status(400).send({status:false, msg:'Enter lname.'})
            updateDetails.lname = lname.trim()
        }

        if(data.hasOwnProperty("email")){
            if(!isValid(email))return res.status(400).send({status:false, msg:'Enter email.'})
            
        }

        if(!isValid(email))return res.status(400).send({status:false, msg:'Enter email.'})
        if (!(/^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/.test(email))) {
            return res.status(400).send({ status: false, msg: "Please enter a valid email address" })
        }
        let existingEmail= await userModel.findOne({email:email})
        if(existingEmail)return res.status(400).send({status:false, msg:`${email} already exists.`})
        updateDetails.email = email.trim()

        if(data.hasOwnProperty("password")){
            if(!isValid(password))return res.status(400).send({status:false, msg:'Enter password.'})
        }
        if (!(`${password}`.length <= 15 && `${password}`.length >= 8)) {
            return res.status(400).send({ status: false, msg: "Please enter password length from 8 to 15" })
        }
        data.password = await bcrypt.hash(password,10)
        updateDetails.password = password


        if(data.hasOwnProperty("phone")){
            if(!isValid(phone))return res.status(400).send({status:false, msg:'Enter phone.'})
        }
        
        // if (`${phone}`.length < 10 && `${phone}`.length > 10) {
        if(!(/^[6-9]\d{9}$/.test(phone))){
            return res.status(400).send({ status: false, msg: "Please enter a valid Mobile Number" })
        }
        let existingPhone= await userModel.findOne({phone:phone})
        if(existingPhone)return res.status(400).send({status:false, msg:`${phone} already exists.`})
        updateDetails.phone = phone

        if(data.hasOwnProperty("address")){
            if(!isValid(address.shipping.street))return res.status(400).send({status:false, msg:'Enter shipping street.'})
            updateDetails.address.shipping.street = address.shipping.street.trim()

            if(!isValid(address.shipping.city))return res.status(400).send({status:false, msg:'Enter shipping city.'})
            updateDetails.address.shipping.city = address.shipping.city.trim()

            if(!isValid(address.shipping.pincode))return res.status(400).send({status:false, msg:'Enter shipping pincode.'})
            updateDetails.address.shipping.pincode = address.shipping.pincode.trim()
            
            if(!isValid(address.billing.street))return res.status(400).send({status:false, msg:'Enter billing street.'})
            updateDetails.address.shipping.street = address.shipping.street.trim()

            if(!isValid(address.billing.city))return res.status(400).send({status:false, msg:'Enter billing city.'})
            updateDetails.address.shipping.city = address.shipping.city.trim()

            if(!isValid(address.billing.pincode))return res.status(400).send({status:false, msg:'Enter billing pincode.'})
            updateDetails.address.shipping.pincode = address.shipping.pincode.trim()

        }
          updateDetails.profileImage = uploadedFileURL


        const updateData = await userModel.findOneAndUpdate({_id: userId}, {$set: updateDetails}, {new: true})
        // if(!updateData) return res.status(400).send({status:false, msg:'Not Found'})

        return res.status(200).send({status:false, msg:'Data Update Successfully', data: updateData})

    }
    catch (error) {
        res.status(500).send({ status: false, message: error.message })
        
    }
}




module.exports = { postRegister, loginUser, profileDetails, updateUser}