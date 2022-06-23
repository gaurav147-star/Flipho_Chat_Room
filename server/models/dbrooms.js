const mongoose = require('mongoose');

const wpSchema2 = mongoose.Schema({
    roomname: String,
})


module.exports = mongoose.model('rooms',wpSchema2)