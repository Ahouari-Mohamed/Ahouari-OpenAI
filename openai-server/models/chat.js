const mongoose = require("mongoose")

const chatSchema = new mongoose.Schema({
    userId :{
        type: String,
        required: true
    },
    id :{
        type: String,
        required: true
    },
    history:[
        {
            role: {
                type: String,
                enum: ["user","model"],
                required: true
            },
            content: {
                type: String,
                required: true
            }
        }
    ]
}, { timestamps: true })

module.exports = mongoose.model("chat",chatSchema)