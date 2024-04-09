import {asyncHandler} from "../utils/asyncHandler.js"
import {ApiError} from "../utils/ApiError.js"
import { User } from "../models/user.model.js";
import {uploadOnCloudinary} from "../utils/cloudinary.js"
import {ApiResponse} from"../utils/ApiResponse.js"

const generateAccessAndRefreshToken = async(userId)=>{
  try {
    const user = User.findById(userId);
    const accessToken = await user.generateAccessToken();
    const refreshToken = await user.generateRefreshToken();
  
    user.refreshToken=refreshToken;
    user.save({validateBeforeSave:false})
    return {accessToken,refreshToken}
  } catch (error) {
    throw new ApiError(500,"something went wrong while generting access and refresh token")
  }
 
}

const registerUser = asyncHandler(async(req,res)=>{
  const {email,password,fullName,username}=req.body;
  console.log(email);

if([fullName,password,email,username].some((field)=>field?.trim()==="")){
  throw new ApiError(400,"all fields are required")
}

const existedUser= await User.findOne({
  $or:[{username},{email}]
})
console.log(existedUser)

if(existedUser){
  throw new ApiError(409,"User or email already exist")
}

const avatarLocalPath= req.files?.avatar[0]?.path;
// const CoverImgLocalPath=req.files?.coverImage[0]?.path; not working properly
let coverImgLocalPath;
if(req.files && Array.isArray(req.files.coverImage) && req.files.coverImage.length>0){
  coverImgLocalPath=req.files.coverImage[0].path;
}

if(!avatarLocalPath){
  throw new ApiError(400,"avatar is required")
}

const avatar= await uploadOnCloudinary(avatarLocalPath);
const coverImage = await uploadOnCloudinary(CoverImgLocalPath);

if(!avatar){
  throw new ApiError(400,"avatar is required")
}

const user = await User.create({
  fullName,
  username:username.toLowerCase(),
  password,
  email,
  avatar:avatar.url,
  coverImage:coverImage?.url || ""

})

const createdUser=User.findById(user._id).select("-password -refreshToken")

if(!createdUser){
  throw new ApiError(500,"something went wrong while creating the user");
}

return res.status(201).json(
  new ApiResponse(200,"User created successfully")
)


  res.send("ok")
})

const loginUser = asyncHandler(async(req,res)=>{
  const {email,username}=req.body;
  if(!username||!email){
    throw new ApiError(400,"Email or password is required")
  }

  const user = await User.findOne({
    $or:[{username},{email}]
  })

  if(!user){
    throw new ApiError(404,"user not find")
  }

  const isPasswordValid=await user.isPasswordCorrect(password);

  if(!isPasswordValid){
    throw new ApiError(401,"password is wrong")
  }
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


   /*Steps to login user

    1.get data from req body
    2.validate the data(that username/email exists or not if exist check password)
    3.if alright give access and refresh token to user
    4.send cookie

   */