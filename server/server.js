//Creating a API
const express = require('express')
const mongoose = require('mongoose');
const Messages = require('./models/dbMessages.js')
const Rooms = require('./models/dbrooms.js')
const cors = require('cors');
const dotenv = require('dotenv')
const app = express();


// call the config function
dotenv.config();

// middleware
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(cors());

const PORT = process.env.PORT || 5000;

if (process.env.NODE_ENV === "production") {
    app.use(express.static("client/build"))
}

const server = require('http').createServer(app);
const io = require('socket.io')(server, {
    cors: {
        origin: "http://localhost:3000",
        credentials: true,
    }
});



// DB config

const connection_url = process.env.DATABASE;

mongoose.connect(connection_url, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
}).then(() => {
    console.log("DB Connection Successfull");
}).catch((err) => {
    console.log(err.message);
});;


// api routes
// app.get("/", (req, res) => res.status(200).send("hello world"));




app.post("/rooms/new", (req, res) => {
    const dbRoom = req.body;
    console.log(dbRoom);
    Rooms.create(dbRoom, (err, data) => {
        console.log(data);
        if (err) {
            res.status(500).send(err);
        } else {
            res.status(201).send(data);
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


app.get("/messages/sync", (req, res) => {
    Messages.find((err, data) => {
        if (err) {
            res.status(500).send(err);
        } else {
            res.status(200).send(data);
        }
    });
});


app.get("/rooms/sync", (req, res) => {
    Rooms.find((err, data) => {
        if (err) {
            res.status(500).send(err);
        } else {
            res.status(200).send(data);
        }
    });
});


app.get('/rooms/:id', (req, res) => {
    Rooms.findById(req.params.id)
        .then(result => {
            res.status(200).json({
                roomname: result.roomname,
            })
        })
        .catch(err => {
            console.log(err);
            res.status(500).json({
                error: err
            })
        })
})

// listen
server.listen(PORT, () => console.log(`Listening on localhost:${PORT}`));