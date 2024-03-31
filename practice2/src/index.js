import connectDB from "./db/index.js";
import dotenv from "dotenv";
import { app } from "./app.js";
dotenv.config({
    path:"./.env"
})

let PORT=process.env.PORT || 8000;

connectDB()
.then(()=>{
    app.listen(PORT,()=>{
        console.log(`server is running at port ${PORT}`)
    })
})
.catch((err)=>{
    console.log("MONGO DB CONNECTION FAILED!! ", err)
})
    

