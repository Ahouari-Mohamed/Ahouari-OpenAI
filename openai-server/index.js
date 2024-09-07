const express = require("express");

const mongoose = require("mongoose");
const Chat = require("./models/chat");
const UserChats = require("./models/userChats");

const { GoogleGenerativeAI } = require("@google/generative-ai");
const { HarmBlockThreshold, HarmCategory } = require("@google/generative-ai");

const cors = require("cors");
require('dotenv').config();

//Open-Ai
const genAi = new GoogleGenerativeAI(process.env.GenerativeAI_API_KEY);

const safetySettings = [
    {
        category: HarmCategory.HARM_CATEGORY_HARASSMENT,
        threshold: HarmBlockThreshold.BLOCK_LOW_AND_ABOVE,
    },
    {
        category: HarmCategory.HARM_CATEGORY_HATE_SPEECH,
        threshold: HarmBlockThreshold.BLOCK_LOW_AND_ABOVE,
    },
];
const model = genAi.getGenerativeModel({ model: "gemini-1.5-flash", safetySettings });
const chat = model.startChat({
    history: [],
    generationConfig: {
        // maxOutputTokens: 1000,
        // temperature: 0.1,
    },
});

// Express
const app = express();
app.use(express.json());

// Cors
app.use(cors({ origin: process.env.CLIENT_URL }));

// mongoose
mongoose.connect(process.env.MONGOOSE_URL)
    .then(() => {
        console.log("Connected Sucessfully to Mongoose")
    })
    .catch((e) => {
        console.log("Error: ", e)
    })


//Routes    
app.post("/generate", async (req, res) => {
    const { history, message} = req.body;
    try {
        const updatedHistory = history.map(h => ({
            role: h.role.toLowerCase(), 
            parts: [{ text: h.content }]
        }));
        console.log('history+message: ', JSON.stringify({
            message: message,
            history: updatedHistory
        }));
        const model = genAi.getGenerativeModel({ model: "gemini-1.5-flash", safetySettings });
        const chatSession = model.startChat({
            history: updatedHistory,
            generationConfig: {
                // maxOutputTokens: 1000,
                // temperature: 0.1,
            },
        });

        const result = await chatSession.sendMessageStream(message);

        // Set headers for a streaming response
        res.setHeader('Content-Type', 'text/plain');
        res.setHeader('Transfer-Encoding', 'chunked');

        // Send each chunk as it comes in
        for await (const chunk of result.stream) {
            const chunkText = chunk.text();
            res.write(chunkText); // Send the chunk to the client
        }

        // End the response when all chunks have been sent
        res.end();
    } catch (error) {
        console.error("Error generating content:", error);
        res.status(500).json({
            error: "Failed to generate content",
        });
    }
});

app.post('/chatLog', async (req, res) => {
    const { userId, id, history } = req.body
    try {
        const newChat = new Chat({
            userId: userId,
            id: id,
            history: history
        })
        await newChat.save();
        console.log("New Chat Saved:", newChat);

        const userChats = await UserChats.findOne({ userId: userId });

        const chatTitle = "New Chat";

        if (!userChats) {
            // If UserChats document does not exist, create it
            const newUserChats = new UserChats({
                userId: userId,
                chats: [{ _id: newChat.id, title: chatTitle }]
            });

            await newUserChats.save();
            console.log("New UserChats Created:", newUserChats);
        } else {
            // Check if the chat already exists
            const chatIndex = userChats.chats.findIndex(chat => {
                console.log(`Comparing existing chat ID: ${chat._id.toString()} with new chat ID: ${newChat.id.toString()}`);
                return chat._id.toString() === newChat.id.toString();
            });

            if (chatIndex === -1) {
                // If chat does not exist, add it
                userChats.chats.push({ _id: newChat.id, title: chatTitle });
                await userChats.save();
                console.log("UserChats Updated with New Chat:", userChats);
            } 
        }

        res.send(newChat.id)
    }
    catch (e) {
        console.log("Error: ", e);
        res.status(500).send("Error Creating Chat!");
    }
});

app.get('/chatIndex/:id', async (req, res) => {
    try {
        const userId = req.params.id;
        // Find the user's document
        const userChats = await UserChats.findOne({ userId: userId });

        let nextChatIndex = 1;  // Start from 1 if no chats exist

        if (userChats && userChats.chats.length > 0) {
            // Extract the max chat ID from the chats array
            const maxIndex = Math.max(...userChats.chats.map(chat => parseInt(chat._id)));
            nextChatIndex = maxIndex + 1;
        }

        // Send the nextChatIndex to the client
        res.json(nextChatIndex);
    } catch (error) {
        console.log("Error fetching chat index: ", error);
        res.status(500).send("Error fetching chat index");
    }
});

app.get('/userChats', async (req, res) => {
    const userId = 1;
    try {
        const userChats = await UserChats.findOne({ userId: userId });
        
        if (!userChats) {
            return res.status(404).json({ error: "User chats not found" });
        }
        
        res.json(userChats.chats);
    } catch (e) {
        console.log("Error: ", e);
        res.status(500).send("Error Fetching Chats");
    }
});

app.get('/userChats/:id', async (req, res) => {
    const userId = 1;
    const chatId = req.params.id;

    try {
        const userChat = await Chat.findOne({ userId: userId, id: chatId })
                                   .sort({ updatedAt: -1 })  
                                   .sort({ 'history.length': -1 });  

        if (!userChat) {
            return res.status(404).json({ error: "User chat not found" });
        }

        res.json(userChat);
    } catch (e) {
        console.log("Error: ", e);
        res.status(500).send("Error Fetching Chat");
    }
});

app.put("/rename/:id", async (req, res) => {
    const userId = 1; // This should ideally come from the authenticated user
    const chatId = req.params.id;
    const newName = req.body.newName;

    try {
        const userChat = await UserChats.findOneAndUpdate(
            { userId: userId, "chats._id": chatId },
            { $set: { "chats.$.title": newName } },
            { new: true }
        );

        if (!userChat) {
            return res.status(404).json({ error: "Chat not found" });
        }

        res.status(200).json({ message: "Chat renamed successfully" });
    } catch (e) {
        console.log("Error: ", e);
        res.status(500).send("Error Renaming Chat");
    }
});



app.delete("/delete/:id", async (req, res) => {
    const userId = 1; // This should ideally come from the authenticated user
    const chatId = req.params.id;

    try {
        const userChat = await UserChats.findOneAndUpdate(
            { userId: userId },
            { $pull: { chats: { _id: chatId } } }, 
            { new: true }
        );

        if (!userChat) {
            return res.status(404).json({ error: "User chat not found" });
        }

        res.status(200).json({ message: "Chat deleted successfully" });
    } catch (e) {
        console.log("Error: ", e);
        res.status(500).send("Error Deleting Chat");
    }
});

const port = process.env.PORT || 3080
app.listen(port, () => {
    console.log("Listening in Port: ",port);
});
