const mongoose = require("mongoose")

const usreChatsSchema = new mongoose.Schema({
    userId :{
        type: String,
        required: true
    },
    chats:[
        {
            _id: {
                type: String,
                required: true
            },
            title: {
                type: String,
                required: true
            }
        }
    ]
})

module.exports = mongoose.model("userChats",usreChatsSchema)