import { v2 as cloudinary } from 'cloudinary'
import fs from "fs"

cloudinary.config({ 
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME, 
    api_key: process.env.CLOUDINARY_API_key, 
    api_secret: process.env.CLOUDINARY_API_SECRET,
  
}); 

const uplodeOnCloudinary = async (localFilePath) => {
    
    try {
        if(!localFilePath) return null
        // uplode the file on cloudinary
        const responce = await cloudinary.uploader.upload
        (localFilePath, {resource_type: "auto"
        })
        //file has uploded successfull
        //console.log("file is uploded on cloudinary",
        //responce.url);
        fs.unlinkSync(localFilePath)
        return responce;

    } catch (error) {
        
        // remove the locailly saved temporary file as the
        // uplode operated got failed
        fs.unlinkSync(localFilePath)
        return null;
         
    }

}

export {uplodeOnCloudinary}