const jwt = require("jsonwebtoken")

const authentication = async function (req, res, next) {
    try {
        let bearerToken = req.headers["authorization"];
        if (!bearerToken) token = req.headers["Authorization"]
        if (!bearerToken)
        return res.status(400).send({ status: false, message: "Token required! Please login to generate token" });
       
        const token = bearerToken.split(" ")[1]

        let decodedToken = jwt.verify(token, "functionUp-Uranium");
        if (!decodedToken)
            return res.status(400).send({ status: false, message: "Enter a valid token" });
        
        req.userId = decodedToken.userId

        next();

    } catch (error) {
        res.status(500).send({ status: false, message: error.message });
    }
}

module.exports ={ authentication }