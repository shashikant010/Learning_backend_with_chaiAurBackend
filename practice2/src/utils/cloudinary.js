import {v2 as cloudinary} from "cloudinary"
import fs from "fs"
           
cloudinary.config({ 
  cloud_name: "dugaeyhko", 
  api_key: "611154496142225" , 
  api_secret:"04lzIvH_Ykv5kmiS1KwX3nzElR8"
});

const uploadOnCloudinary=async(localfilepath)=>{
    try {
        console.log("your local file path is ",localfilepath,"uploading")
        if(!localfilepath) return null;
        const response=await cloudinary.uploader.upload(localfilepath,{
            resource_type:"auto"
        })
        
        console.log("file has been uploaded",response.url);
        return response
    } catch (error) {
        fs.unlinkSync(localfilepath) //remove the file as the upload operation is failed
        console.log(error)
        return null;
    }
}

export {uploadOnCloudinary}