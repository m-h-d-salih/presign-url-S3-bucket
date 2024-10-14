const mongoose = require("mongoose");

const avatar = new mongoose.Schema({
    original: {
       type: String
    },     
    thumbnail:{
        type: String
    }    
})

const Avatar = mongoose.model('avater', avatar)

module.exports = Avatar;


