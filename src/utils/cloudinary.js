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

// cloudinary.uploader
//        .upload(
//            'https://res.cloudinary.com/demo/image/upload/getting-started/shoes.jpg',
//             { public_id: 'shoes'},
//             function(error,result) {console.log(result);}
//        )


export {
    uploadOnCloudinary
}