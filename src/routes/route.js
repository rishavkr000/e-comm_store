const express = require('express')
const router = express.Router()

const { postRegister,loginUser,profileDetails,updateUser} = require('../controllers/userController')
const {authentication} = require("../middlewares/auth")


router.post('/register', postRegister)
router.post('/login', loginUser)
router.get("/user/:userId/profile",authentication,profileDetails)
router.put("/user/:userId/profile",updateUser )













/*------------------------------------------if api is invalid OR wrong URL----------------------------------------------------------*/

router.all("/**", function (req, res) {
    res.status(404).send({ status: false, msg: "The api you request is not available" })
})

module.exports = router