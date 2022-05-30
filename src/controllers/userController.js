const { uploadFile } = require('../utils/aws')
const bcrypt = require('bcrypt');
const userModel = require('../models/userModel')
const jwt = require("jsonwebtoken")

const { isValid, isValidRequestBody, isValidObjectId, isValidName, isValidPincode, isValidEmail, isValidPhoneNumber } = require("../utils/validator")


//*************************************************< User Registration >*****************************************************//

const createUser = async function (req, res) {
    try {
        let data = req.body

        if (!isValidRequestBody(data)) return res.status(400).send({ status: false, msg: 'Enter details for user creation.' })

        let { fname, lname, email, password, phone, address } = data


        if (!isValid(fname)) return res.status(400).send({ status: false, msg: 'Enter first name' })
        if (!isValidName(fname)) return res.status(400).send({ status: false, msg: 'Enter valid first name' })

        if (!isValid(lname)) return res.status(400).send({ status: false, msg: 'Enter last name.' })
        if (!isValidName(lname)) return res.status(400).send({ status: false, msg: 'Enter valid last name' })

        if (!isValid(email)) return res.status(400).send({ status: false, msg: 'Enter email' })
        if (!isValidEmail(email)) {
            return res.status(400).send({ status: false, msg: "Please enter a valid email address" })
        }

        let existingEmail = await userModel.findOne({ email: email })
        if (existingEmail) return res.status(400).send({ status: false, msg: `${email} already exists.` })


        if (!isValid(phone)) return res.status(400).send({ status: false, msg: 'Enter phone' })
        if (!isValidPhoneNumber(phone)) {
            return res.status(400).send({ status: false, msg: "Please enter a valid Mobile Number" })
        }

        let existingPhone = await userModel.findOne({ phone: phone })
        if (existingPhone) return res.status(400).send({ status: false, msg: `${phone} already exists.` })


        if (!isValid(password)) return res.status(400).send({ status: false, msg: 'Enter password' })

        if (!(`${password}`.length <= 15 && `${password}`.length >= 8)) {
            return res.status(400).send({ status: false, msg: "Password Should be minimum 8 characters and maximum 15 characters" })
        }
        password = await bcrypt.hash(password, 10)


        if (!isValid(address))
            return res.status(400).send({ status: false, message: "Address required" });

        address = JSON.parse(address)

        let { shipping, billing } = address

        if (!isValid(shipping)) {
            return res.status(400).send({ status: false, message: "Shipping address required" });
        } else {
            let { street, city, pincode } = shipping

            if (!isValid(street))
                return res.status(400).send({ status: false, message: "Shipping street required" });

            if (!isValid(city))
                return res.status(400).send({ status: false, message: "Shipping city required" });

            if (!isValidPincode(pincode))
                return res.status(400).send({ status: false, message: "Shipping pincode Should be Like: 750001" });
        }

        if (!isValid(billing)) {
            return res.status(400).send({ status: false, message: "Billing address required" });
        } else {
            let { street, city, pincode } = billing
            if (!isValid(street))
                return res.status(400).send({ status: false, message: "Billing street required" });

            if (!isValid(city))
                return res.status(400).send({ status: false, message: "Billing city required" });

            if (!isValidPincode(pincode))
                return res.status(400).send({ status: false, message: "Billing pincode Should be Like: 750001" });
        }


        let files = req.files
        let uploadedFileURL
        if (files && files.length > 0) {
            uploadedFileURL = await uploadFile(files[0])
        }
        else {
            res.status(400).send({ msg: "No file found" })
        }

        const profileImage = await uploadFile(files[0])

        let result = { fname, lname, email, profileImage: profileImage, phone, password: password, address };

        let newUser = await userModel.create(result)
        res.status(201).send({ status: true, msg: 'USER SUCCESSFULLY CREATED.', data: newUser })

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

        if (!isValid(email)) return res.status(400).send({ status: false, message: "Email is required" })
        if (!isValidEmail(email)) {
            return res.status(400).send({ status: false, msg: "Please enter a valid email address" })
        }

        if (!isValid(password)) return res.status(400).send({ status: false, message: "Password is required" })
        if (!(`${password}`.length <= 15 && `${password}`.length >= 8)) {
            return res.status(400).send({ status: false, msg: "Please enter password length from 8 to 15" })
        }

        //Db call for checking user is valid user
        const user = await userModel.findOne({ email: email })
        if (!user) {
            return res.status(404).send({ status: false, message: "User not found" })
        }
        const samePassword = await bcrypt.compare(password, user.password);
        if (!samePassword) {
            return res.status(401).send({ status: false, message: "Password is not correct" })
        }

        let token = jwt.sign(
            {
                userId: user._id.toString(),
                batch: "Uranium",
                organisation: "FunctionUp",
                exp: Math.floor(Date.now() / 1000) + (60 * 60)
            },
            "functionUp-Uranium"
        )
        //sending token in header response
        res.setHeader("Authorization", "Bearer" + token)

        const data = {
            userId: user._id,
            token: token
        }
        res.status(200).send({ status: true, data: data })
    }
    catch (error) {
        res.status(500).send({ status: false, message: error.message })
    }
}

//******************************************************< Get User Details **************************************************//

const profileDetails = async function (req, res) {
    try {
        const userId = req.params.userId;

        if (!isValidObjectId(userId)) {
            return res.status(400).send({ status: false, msg: "Please enter a valid userId" })
        }

        const user = await userModel.findById(userId);
        if (!user) {
            return res.status(404).send({ status: false, msg: "User not Found" })
        }
        if (userId != req.userId) return res.status(403).send({ status: false, msg: "User not authorized" })


        res.status(200).send({ status: true, data: user })
    } catch (error) {
        res.status(500).send({ status: false, message: error.message })

    }
}

//****************************************************< Update User Details ************************************************//

const updateUser = async function (req, res) {
    try {
        const userId = req.params.userId
        const data = req.body
        const files = req.files

        if (!isValidObjectId(userId)) {
            return res.status(400).send({ status: false, msg: "Please enter a valid userId" })
        }

        const checkUser = await userModel.findOne({ _id: userId })
        if (!checkUser) {
            return res.status(404).send({ status: false, message: "User Not Found" });
        }

        if (userId != req.userId) return res.status(403).send({ status: false, msg: "User not authorized to update details" })


        let { fname, lname, email, password, phone, address } = data

        if (isValid(fname)) {
            if (!isValidName(fname)) return res.status(400).send({ status: false, message: "Enter valid fname" });

            checkUser.fname = fname;
        }

        if (isValid(lname)) {
            if (!isValidName(lname)) return res.status(400).send({ status: false, message: "enter valid lname" });

            checkUser.lname = lname;
        }


        if (isValid(email)) {
            if (!isValidEmail(email)) return res.status(400).send({ status: false, message: "enter valid email" });

            let checkEmail = await userModel.findOne({ email: email });
            if (checkEmail) return res.status(400).send({ status: false, msg: " email is already exists" });

            checkUser.email = email;
        }

        if (isValid(password)) {
            if (!(`${password}`.length <= 15 && `${password}`.length >= 8)) {
                return res.status(400).send({ status: false, msg: "Password Should be minimum 8 characters and maximum 15 characters" })
            }
            password = await bcrypt.hash(password, 10)
            checkUser.password = password;
        }

        if (isValid(phone)) {
            if (!isValidPhoneNumber(phone)) return res.status(400).send({ status: false, msg: " Phone number is not valid " });

            let checkPhone = await userModel.findOne({ phone: phone });
            if (checkPhone) return res.status(400).send({ status: false, message: "phone number already exist" });

            checkUser.phone = phone;
        }


        if (isValid(address)) {

            address = JSON.parse(address)

            let { shipping, billing } = address

            if (isValid(shipping)) {

                let { street, city, pincode } = shipping

                if (!isValid(street)){
                    return res.status(400).send({ status: false, message: "shipping street required" });
                }else{
                    checkUser.address.shipping.street = street
                }
                if (!isValid(city)){
                    return res.status(400).send({ status: false, message: "shipping city required" });
                }else{
                    checkUser.address.shipping.city = city
                }
                if(isValid(pincode)){
                    if(isValidPincode(pincode)){
                        checkUser.address.shipping.pincode = pincode
                    }
                    return res.status(400).send({ status: false, message: "shipping pincode Should be Like: 750001" });
                }
                else {
                    return res.status(400).send({ status: false, message: "shipping pincode is required" });
                }
            }

            

            if (isValid(billing)) {

                let { street, city, pincode } = billing

                  if (!isValid(street)){
                    return res.status(400).send({ status: false, message: "shipping street required" });
                }else{
                    checkUser.address.billing.street = street
                }
                if (!isValid(city)){
                    return res.status(400).send({ status: false, message: "shipping city required" });
                }else{
                    checkUser.address.billing.city = city
                }
                if(isValid(pincode)){
                    if(isValidPincode(pincode)){
                        checkUser.address.billing.pincode = pincode
                    }
                    return res.status(400).send({ status: false, message: "Billing pincode Should be Like: 750001" });
                }
                else {
                    return res.status(400).send({ status: false, message: "Billing pincode is required" });
                }
            }
        }

        if (req.files) {
            if (files && req.files.length > 0) {
                let uploadedFileURL = await uploadFile(files[0])
                checkUser.profileImage = uploadedFileURL
            }
            else {
                return res.status(400).send({ msg: "No file found" })
            }
        }

        await checkUser.save();
        return res.status(200).send({ status: true, message: "User Profile updated", data: checkUser })

    }
    catch (error) {
        res.status(500).send({ status: false, message: error.message })
    }
}

module.exports = { createUser, loginUser, profileDetails, updateUser }
