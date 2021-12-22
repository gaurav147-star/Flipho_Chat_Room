//Creating a API

// importing
import express from "express";
import mongoose from "mongoose";
import Messages from "./dbMessages.js";
import Pusher from "pusher";
import cors from "cors";
import dotenv from "dotenv";

// call the config function
dotenv.config();

//app config
const app = express();
const port = process.env.PORT || 5000;

const pusher = new Pusher({
    appId: "1320656",
    key: "65a3b0c27b2aca9a9b6e",
    secret: "39cf99bf44246bef4b5d",
    cluster: "ap2",
    useTLS: true
});

// middleware
app.use(express.json());
app.use(cors());

// app.use((req, res, next) => {
//     res.setHeader("Access-Control-Allow-Origin", "*")
//     res.setHeader("Access-Control-Allow-Headers", "*")
// })

// DB config

const connection_url = process.env.DATABASE;

mongoose.connect(connection_url, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
});

// pusher
const db = mongoose.connection;

db.once("open", () => {
    console.log("DB connected");

    const msgCollection = db.collection("messagecontents");
    const changeStream = msgCollection.watch();

    changeStream.on("change", (change) => {
        console.log("A change occured", change);

        if (change.operationType === "insert") {
            const messageDetails = change.fullDocument;
            pusher.trigger("messages", "inserted", {
                name: messageDetails.name,
                message: messageDetails.message,
                timestamp: messageDetails.timestamp,
                received: messageDetails.received,
            });
        } else {
            console.log("Error triggering Pusher");
        }
    });
});

// api routes
app.get("/", (req, res) => res.status(200).send("hello world"));

app.get("/messages/sync", (req, res) => {
    Messages.find((err, data) => {
        if (err) {
            res.status(500).send(err);
        } else {
            res.status(200).send(data);
        }
    });
});

app.post("/messages/new", (req, res) => {
    const dbMessage = req.body;
    Messages.create(dbMessage, (err, data) => {
        if (err) {
            res.status(500).send(err);
        } else {
            res.status(201).send(data);
        }
    });
});

// listen
app.listen(port, () => console.log(`Listening on localhost:${port}`));