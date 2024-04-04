import mongoose , {Schema} from "mongoose";
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";

const userSchema = new Schema(
    {
        userName:{
            type:String,
            require:true,
            unique:true,
            lowercase:true,
            trim:true,
            index:true
        },
        email:{
            type:String,
            require:true,
            unique:true,
            lowercase:true,
            trim:true
        },
        fullName:{
            type:String,
            require:true,
            trim:true,
            index:true
        },
        avatar:{
            type:String,  //cloudinary service url
            require:true,
        },
        coverImg:{
            type:String,  //cloudinary service url
            require:true,
        },
        watchHistory:[{
            type:Schema.Types.ObjectId,
            ref:"Video"
        }],
        password:{
            type:String,
            required:[true,"password is Required"]
        },
        refreshToken:{
            type:String,

        }
    },
    {timestamps:true}
)

userSchema.pre("save",async function(next){
    if(!this.isModified("password")) return next();

    this.password=bcrypt.hash(this.password,10)
    next()
})

userSchema.methods.isPasswordCorrect=async function(password){
   return await bcrypt.compare(password,this.password)
}

export const User = mongoose.Model("User",userSchema)