import mongoose from "mongoose";
import { DB_NAME } from "../constants.js";

// const MongoURI="mongodb+srv://shashikant:sky9718@cluster0.lbiebv5.mongodb.net"

const connectDB = async()=>{
    try {
        let connectionInstance=await mongoose.connect(`${process.env.Mongodb_URI}/${DB_NAME}`)
        console.log(`\n MongoDB connected !! DB HOST: ${connectionInstance.connection.host}`);

    } catch (error) {
        console.error("Connection to mongodb failed ",error)
        process.exit(1)
    }
    
}
export default connectDB;