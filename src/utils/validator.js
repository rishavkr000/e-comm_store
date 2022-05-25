const mongoose = require("mongoose")

const isValid = function (value) {
    if (typeof value === 'undefined' || value === null) return false //it checks whether the value is null or undefined.
    if (typeof value === 'string' && value.trim().length === 0) return false //it checks whether the string contain only space or not 
    return true;
};

const isValidRequestBody = function (requestBody) {
    return Object.keys(requestBody).length > 0
}

const isValidObjectId = function(objectId){
    return mongoose.Types.ObjectId.isValid(objectId);
}

const isVAlidName =function (name) {
    let validNameRegex = /^[a-zA-Z ]*$/
    return validNameRegex.test(name);
}
 ;

const isValidEmail = /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/;

const isValidPhoneNumber = /^[6-9]\d{9}$/





module.exports = { isValid, isValidRequestBody,isValidObjectId,isVAlidName,isValidEmail,isValidPhoneNumber}