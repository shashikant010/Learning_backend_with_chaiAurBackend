import  mongoose  from "mongoose";
import { DB_NAME } from "../constants.js";

const connectDB=async()=>{
    try {
        const connectionInstance=await mongoose.connect(`${process.env.MONGODB_URI}/${DB_NAME}`)
        console.log(`Connected successfully to MONGO DB HOST: ${connectionInstance.connection.host}`)
    } catch (error) {
        console.log("ERROR IN CONNECTION TO MONGODB",error)
        process.exit(1)
    }
}

export default connectDB