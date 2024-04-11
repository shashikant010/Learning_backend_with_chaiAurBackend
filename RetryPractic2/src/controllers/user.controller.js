import {asyncHandler} from "../utils/asyncHandler.js"
import {ApiError} from "../utils/ApiError.js"
import { User } from "../models/user.model.js";
import {uploadOnCloudinary} from "../utils/cloudinary.js"
import {ApiResponse} from"../utils/ApiResponse.js"
import jwt from "jsonwebtoken";
import e from "cors";
import  mongoose from "mongoose";

const generateAccessAndRefreshToken = async(userId)=>{
  try {
    console.log(userId)
    const user = await User.findById(userId);
    console.log(user._id)
    const accessToken = user.generateAccessToken();
    const refreshToken = user.generateRefreshToken();
  
    user.refreshToken=refreshToken;
    user.save({validateBeforeSave:false})
    return {accessToken,refreshToken}
  } catch (error) {
    console.log(error)
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
const coverImage = await uploadOnCloudinary(coverImgLocalPath);

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

const createdUser= await User.findById(user._id).select("-password -refreshToken")

if(!createdUser){
  throw new ApiError(500,"something went wrong while creating the user");
}

return res.status(201).json(
  new ApiResponse(200,"User created successfully")
)


})

const loginUser = asyncHandler(async(req,res)=>{
  const {email,username,password}=req.body;
  console.log(email,username)
  if(!username && !email){
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

  const {refreshToken,accessToken}=await generateAccessAndRefreshToken(user._id);

  const loggedinUser=await User.findById(user._id).select("-password -refreshToken");

  const options = {
    httpOnly:true,
    secure:true
  }

  return res
  .status(201)
  .cookie("accessToken",accessToken,options)
  .cookie("refreshToken",refreshToken,options)
  .json(new ApiResponse(200,{user:loggedinUser,accessToken,refreshToken},"user logged in successfully"))

})

const logoutUser=asyncHandler(async(req,res)=>{
    await User.findByIdAndUpdate(req.user._id,{
      $unset:{
        refreshToken:1
      }
    ,}
    ,{
      new:true
    })

    const options = {
      httpOnly:true,
      secure:true
    }

    return res
    .status(200)
    .clearCookie("accessToken")
    .clearCookie("refreshToken")
    .json(new ApiResponse(200,{},"loggedout successfully"))

})

const refreshAccessToken=asyncHandler(async(req,res)=>{
  const incomingRefreshToken=req.cookies.refreshToken||req.body.refreshToken;    //cookie spelling can be wrong
  if(!incomingRefreshToken){
    throw new ApiError(401,"UnAuthorized request")
  }

try {
    const decodedToken=jwt.verify(incomingRefreshToken,process.env.REFRESH_TOKEN_SECRET)
  
    const user = await User.findById(decodedToken?._id)
  
    if(!user){
      throw new ApiError(401,"Invalid refresh token")
    }
  
    if(incomingRefreshToken!==user.refreshToken){
      throw new ApiError(401,"refresh token is expired or used")
    }
  
    const {accessToken,newRefreshToken}= await generateAccessAndRefreshToken(user._id);
  
    const options={
      httpOnly:true,
      secure:true
    }
  
    return res.status(201)
    .cookie(           //cookie spelling can be wrong
    "accessToken",accessToken,options
    )
    .cookie("refreshToken",newRefreshToken,options)
    .json(new ApiResponse(
      200,{accessToken,refreshToken:newRefreshToken},"access token refreshed"
    ))
  
} catch (error) {
  throw new ApiError(401,error?.message || "invalid refresh token")
}
})

const changeCurrentPassword=asyncHandler(async(req,res)=>{
  const {oldPassword,newPassword}=req.body;
  const user = await User.findById(req.user?._id)
  const isPasswordCorrect = await user.isPasswordCorrect(oldPassword)
  if(!isPasswordCorrect){
    throw new ApiError(400,"Invalid old password")
  }
  user.password=newPassword;
 await user.save({validateBeforeSave:false})
 res.status(200).json(
  new ApiResponse(200,{},"Data saved successfully")
 )
})

const getCurrentUser=asyncHandler(async(req,res)=>{
  return res.status(200).json(
    new ApiResponse(200,req.user,"current user fetched successfully")
  )
})

const updateAccountDetails = asyncHandler(async(req,res)=>{
  const {fullName,email}=req.body 
  
  if(!fullName || !email){
    throw new ApiError(400,"all fields are required")
  }

  const user = await User.findByIdAndUpdate(req.user._id,
  {
    $set:{
      fullName,email
    }
  },
  {new:true}
  ).select("-password")

  return res
  .status(200)
  .json(
    new ApiResponse(200,user,"Account Details updated successfully")
  )
})

const updateUserAvatar = asyncHandler(async(req,res)=>{
    const AvatartLocalPath = req.file?.path;
    if(!AvatartLocalPath){
      throw new ApiError(400,"Avatar not found")
    }

    const avatar=await uploadOnCloudinary(AvatartLocalPath);

    if(!avatar.url){
      throw new ApiError(400,"something went wrong while uploading the avatar")
    }

    const user = await User.findByIdAndUpdate(req.user._id,
    {
      $set:{avatar:avatar.url}
    },{new:true}).select("-password")

    return res.status(200)
    .json(new ApiResponse(200,user,"avatar changed succcessfully"))

})



const updateUserCoverImage = asyncHandler(async(req,res)=>{
  const coverImageLocalPath = req.file?.path;
  if(!coverImageLocalPath){
    throw new ApiError(400,"coverImage not found")
  }

  const coverImage=await uploadOnCloudinary(coverImageLocalPath);

  if(!coverImage.url){
    throw new ApiError(400,"something went wrong while uploading the cover Image")
  }

  const user = await User.findByIdAndUpdate(req.user._id,
  {
    $set:{coverImage:coverImage.url}
  },{new:true}).select("-password")

  return res.status(200)
  .json(new ApiResponse(200,user,"cover Image changed succcessfully"))

})

const getUserChannelProfile = asyncHandler(async(req,res)=>{
  const {username}=req.params;
  if(!username?.trim()){
    throw new ApiError(400,"username is missing")
  }

  const channel = await User.aggregate([
    {
      $match:{
        username:username?.toLowerCase()
      }
    },
    {
      $lookup:{
        from:"subscriptions",
        localField:"_id",
        foreignField:"$channel",
        as:"subscribers"
      }
    },
    {
      $lookup:{
        from:"subscriptions",
        localField:"_id",
        foreignField:"$subscriber",
        as:"subscribedTo"
      }
    },
    {
      $addFields:{
        subscriberCount:{
          $size: "$subscribers"
        },
        channelsSubscribedToCount:{
          $size:"$subscribedTo"
        },
        isSubscribed:{
          $cond:{
            if:{
              $in:[req.user?._id,"subscribers.subscriber"]
            },
            then:true,
            else:false
          }
        }
      }
    },
    {
      $project:{
        fullName:1,
        username:1,
        avatar:1,
        coverImage:1,
        isSubscribed:1,
        channelsSubscribedToCount:1,
        subscriberCount:1,
        email:1
      }
    }
  ])

  if(!channel?.length){
    throw new ApiError(404,"Channel does not exists")
  }  

  return res.status(200)
  .json(
    new ApiResponse(200,channel[0],"user channel fetched successfully")
  )

})

const getWatchHistory = asyncHandler(async(req,res)=>{
  const user = await User.aggregate([
     {$match:{
        _id: new mongoose.Types.ObjectId(req.user._id)
     }},
     {
      $lookup:{
        from:"videos",
        localField:"watchHistory",
        foreignField:"_id",
        as:"watchHistory",
        pipeline:[
          {
            $lookup:{
              from:"users",
              localField:"owner",
              foreignField:"_id",
              as:"owner",
              pipeline:[{
                $project:{
                  fullName:1,
                  username:1,
                  avatar:1
                }
              },
              {
                $addFields:{
                    owner:{ 
                      $first:"$owner"
                    }
                }
              }
              ]
            }
          }
        ]
      }
     }
  ])

  return res.status(200)
  .json(new ApiResponse(200,user[0].watchHistory,"watch history fetched successfuly"))
})

export {registerUser,loginUser,logoutUser,refreshAccessToken,changeCurrentPassword,getCurrentUser,updateAccountDetails,updateUserAvatar,updateUserCoverImage,getWatchHistory,getUserChannelProfile}


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