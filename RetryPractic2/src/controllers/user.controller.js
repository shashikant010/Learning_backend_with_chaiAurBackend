import {asyncHandler} from "../utils/asyncHandler.js"
import {ApiError} from "../utils/ApiError.js"
import { User } from "../models/user.model.js";
import {uploadOnCloudinary} from "../utils/cloudinary.js"
const registerUser = asyncHandler(async(req,res)=>{
  const {email,password,fullName,username}=req.body;
  console.log(email);

if([fullName,password,email,username].some((field)=>field?.trim()==="")){
  throw new ApiError(400,"all fields are required")
}

const existedUser=User.findOne({$or:[{username},{email}]})

if(existedUser){
  throw new ApiError(409,"User or email already exist")
}

const avatarLocalPath= req.files?.avatar[0]?.path;
const CoverImgLocalPath=req.files?.coverImage[0]?.path;

if(!avatarLocalPath){
  throw new ApiError(400,"avatar is required")
}

const avatar= await uploadOnCloudinary(avatarLocalPath);
const coverImage = await uploadOnCloudinary(CoverImgLocalPath);

if(!avatar){
  throw new ApiError(400,"avatar is required")
}

User.create({
  fullName,
  username:username.toLowerCase(),
  password,
  email,
  avatar:avatar.url,
  coverImage:coverImage?.url || ""

})

  res.send("ok")
})

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