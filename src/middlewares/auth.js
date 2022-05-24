const jwt = require("jsonwebtoken");
// const userModel = require("../models/userModel")


const authentication = async function (req, res, next) {
    try {
        let bearerToken = req.headers["authorization"];
        if (!bearerToken) token = req.headers["Authorization"]
        if (!bearerToken)
            return res.status(400).send({ status: false, message: "Token required! Please login to generate token" });
// console.log(bearerToken)
        const token = bearerToken.split(" ")[1]
    //   console.log(token)
        let decodedToken = jwt.verify(token, "functionUp-Uranium");
        if (!decodedToken)
            return res.status(400).send({ status: false, message: "Inter valid token" });
        
        req.userId = decodedToken.userId

        next();

    } catch (error) {
        res.status(500).send({ status: false, message: error.message });
    }
}

module.exports ={ authentication }