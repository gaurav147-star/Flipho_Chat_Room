import mongoose from 'mongoose'

const wpSchema2 = mongoose.Schema({
    roomname: String,
})


export default mongoose.model('rooms',wpSchema2)