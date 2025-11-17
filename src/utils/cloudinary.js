import { v2 as cloudinary } from 'cloudinary';
import fs from 'fs';

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});


const uploadOnCloudinary = async (localfilepath)=>{
    try {
        if(!localfilepath) return null;

        const response=  await cloudinary.uploader.upload(localfilepath,{
            resource_type:   'auto'  })

            //file has been uploaded successfully
            fs.unlinkSync(localfilepath);
            return response
        
    } catch (error) {
        fs.unlinkSync(localfilepath);
        // remove the local saved temporary file as the upload
        return null;        
    }

}


const deleteFromCloudinary = async( publicId)=>{
    try{
        await cloudinary.uploader.destroy(publicId)

    }catch(error){
        console.log("Error while deleting image from cloudinary", error)
    }
}

export {
    uploadOnCloudinary,
    deleteFromCloudinary
}