import {asynchandler} from "../asynchandler.js"
import { ApiError } from "../utils/ApiError.js"
import {uploadOnCloudinary} from "../utils/cloudinary.js"
import {User} from "../models/user.model.js"
import { ApiResponse } from "../utils/ApiResponse.js"
const registerUser=asynchandler(
async(req,res)=>{
    //(for temporary testing)
//     res.status(200).json({
//         message:"ok"
//     })
const {userName,password,email,fullName}=req.body
console.log(email)

if([userName,password,email,fullName].some((field)=>{
    return field?.trim()===""
})){
    throw new ApiError(400,"All fields are required")
}

const existedUser=User.findOne({
    $or:[{userName},{email}]
})

if(existedUser){
    throw new ApiError(409,"Username or email already exists")
}

const avatarLocalPath = req.files?.avatar[0]?.path;
const coverImgLocalPath = req.files?.CoverImg[0]?.path;

if(!avatarLocalPath){
    throw new ApiError(400,"avatar is required")
}

const avatar = await  uploadOnCloudinary(avatarLocalPath);
const coverImage=await uploadOnCloudinary(coverImgLocalPath);

if(!avatar){
    throw new ApiError(400,"avatar is required")
}

const user = await User.create({
userName:userName.toLowerCase(),
password,
fullName,
email,
avatar:avatar.url,
coverImage: coverImage?.url || ""

})

const createdUser= User.findById(user._id).select("-password -refreshToken")




return res.status(201).json(
    new ApiResponse(200,createdUser,"user registered successfully")
)

}




    )

    export {registerUser}


    /*steps to register a user
    1.take data from user
    2.validate the data
    3.check if user already exists
    4.check for images
    5.upload it on cloudinary
    6.create object in database
    7.remove fields like password and refresh token
    8.check for user creation
    9.return res
    */