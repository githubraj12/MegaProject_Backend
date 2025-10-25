import {asyncHandler} from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import {User} from "../models/user.model.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import jwt from "jsonwebtoken";



const generateAccesssAndRefreshToken = async (userId)=>{
        try {

            const user =await User.findOne(userId);
            const accessToken = await user.generateAccessToken();
            const refreshToken = await user.generateRefreshToken();

            user.refreshToken = refreshToken;
            user.save({validateBeforeSave : false});


            return {accessToken,refreshToken}
            
        } catch (error) {
            throw new ApiError(500, ' Something went wrong while generating access and refresh token ')
            
        }
}

const registerUser = asyncHandler( async (req, res)=>{

    //get user details from req body
    // validation -- checking for empty fields
    //check for user existence --- email username
    //checks for images --- for avatar
    //upload them cloudinary === avatar
    //create user object --- entry in database
    // remove password and refresh token form respones
    //check for user creation 
    // then return response

    const {username, fullname , email, password} = req.body;

    // if(!username || !fullname || !email || !password){
    //     throw new ApiError(400, 'All fields are required');
    // }


    // here we check the field are empty or not 
    if([username,fullname,email,password].some(
        (field)=>field?.trim() === "")){
            throw new ApiError(400, "All fields are required")
        }
 
        
        // here we find the user based on email or username, 
const existingUser= await User.findOne({
    $or:[{email},{username}]
});

if(existingUser){
    throw new ApiError(409, 'User already exist with this email or username')
}

console.log(req.files)


// here take the path of the avatar file 
const avatarLocalPath= req.files?.avatar[0]?.path;
let coverImageLocalPath;


// here we check for coverimage , if we find coverImage then only take their file path
if(req.files && Array.isArray(req.files.coverImage) && req.files.coverImage.length > 0){
    coverImageLocalPath=req.files.coverImage[0].path;
}

if(!avatarLocalPath){
    throw new ApiError(400, 'Avatar image is required')
}



// here we upload avatar and converImage
const avatar = await uploadOnCloudinary(avatarLocalPath);
const coverImage = await uploadOnCloudinary(coverImageLocalPath);


if(!avatar){
    throw new ApiError(400, 'Avatar image is required')
}


// here we create the user and take this user into mongodb database 
const user = await User.create({
    username: username.toLowerCase(),
    email,
    fullname,
    password,
    avatar:avatar.url,
    coverImage:coverImage?.url || "",
});


// here we get user without password and refresh token field 
const createdUser = await User.findById(user._id).select(
    "-password -refreshToken"
)

if(!createdUser){
    throw new ApiError(500, "Something went wrong while registering the User")
};



    return res.status(200).json(
        new ApiResponse(200,createdUser,"user created successfully")
    );





});




const loginUser = (async (req,res)=>{

    // data from req.body
    // username or email
    //find the user
    //password check
    // tokens - access and refresh
    // send cookie 


    const {username, email, password} = req.body;


// this condition required both email and username to fill 
    if(!username && !email){
        throw new ApiError(400, 'username or email is required ')
    }

    const user = await User.findOne({
        $or:[{email},{username}]
    })

    if (!user){
        throw new ApiError(400, 'User does not exist')
    }


   const isPasswordvalid =  await user.isPasswordCorrect(password);

   if(!isPasswordvalid){
    throw new ApiError(401, " invalid credentials ")
   }


   // here we get tokens 
    const {accessToken, refreshToken} = await generateAccesssAndRefreshToken(user._id);

    const loggedUser = await User.findOne(user._id).select(
        "-password -refreshToken"
    )


    // this otions is required so that no one can modify cookies in frontend 
    // this can only happend by Backend developer
    const options = {
        httpOnly:true,
        secure:true
    }


    return res
    .status(200)
    .cookie("accessToken",accessToken,options)
    .cookie("refreshToken",refreshToken,options)
    .json(
        new ApiResponse(
            200,
            {
                user:loggedUser,refreshToken,accessToken
            },
            "User logged in successfully"
        )
    )



})



const logoutUser = asyncHandler(async (req,res)=>{

 
        await User.findByIdAndUpdate(
            req.user._id,
            {
                $set:{
                    refreshToken:undefined
                }
            }
        )
     const options = {
        httpOnly:true,
        secure:true
    }

    return res
    .status(200)
    .clearCookie("accessToken",options)
    .clearCookie("refreshToken",options)
    .json(
        new ApiResponse(
            200,
            "User logged out in successfully"
        )
    )   
})


    const refreshAccessToken = asyncHandler(async (req,res)=>{
         const incomingRefreshToken = req.cookies.refreshToken || req.body.refreshToken;

         if(!incomingRefreshToken){
            throw new ApiError(401, " Unauthorized Error : Access Denied")
         }

         const decodedToken = jwt.verify(incomingRefreshToken,process.env.REFRESH_TOKEN_SECRET);

         const user = await User.findById(decodedToken?._id);

         if(!user){
            throw new ApiError(401,"Invalid refresh token")
         }

         if(incomingRefreshToken !== decodedToken){
            throw new ApiError(401, " Invalid refresh token")

         }

         const options={
            httpOnly:true,
            secure:true
         }
         const {accessToken, newRefreshToken}= await generateAccesssAndRefreshToken(user._id)
         return res
         .status(200)
         .cookie("accessToken",accessToken,options)
         .cookie("refreshToken",newRefreshToken,options)
         .json(
            200,
            {
                accessToken, "refreshToken":newRefreshToken
            },
            "Access token is Refreshed"
         )
    })



    const changeCurrentPassword = asyncHandler(async (req,res)=>{

        const {oldPassword, newPassword} = req.body;

       const user = await User.findById(req.user?._id)

       const isPasswordCorrect = await user.isPasswordCorrect(oldPassword)

       if(!isPasswordCorrect){
        throw new ApiError(401, " Invalid old Password")
       }

       user.password = newPassword;

       await user.save({validateBeforeSave:true})

       return res.status(200).json(
        new ApiResponse(200, " Password changed successfully")
       )
    })


    const getCurrentUser = asyncHandler(async (req,res)=>{
        return res.status(200).json(200, req.user, "current user fetched successfully"
        )
    })


    const updateUserDetails = asyncHandler(async (req,res)=>{

        const {email,username} = req.body;

        if(!email && !password){
            throw new ApiError(400, " email or username is required to update")
        }

        const updateUser = await User.findByIdAndUpdate(
            req.user?._id,
            {
                $set:{
                    email:email,
                    username:username
                }
            },{
                new:true
            }
        ).select("-password");


        return res.status(200).json(
            new ApiResponse(200, updateUser, " User details updated successfully")
        )
    })


    const updateUserAvatar = asyncHandler(async (req,res)=>{

        const avatarLocalPath = req.file?.path;
        if(!avatarLocalPath){
            throw new ApiError(400, " Avatar image is required")   
        }

        const avatar = await uploadOnCloudinary(avatarLocalPath);

        if(!avatar.url){
            throw new ApiError(500, " Something went wron while updating avatar")
        }

        const newAvatar= await User.findByIdAndUpdate(
            req.user?._id,
            {
                $set:{
                    avatar:avatar.url
                }
            },
            {new:true}
        ).select("-password")


        return res.status(200).json(
            200, newAvatar, " Avatar updated successfully"
        )
    })




        const updateUserCoverImage = asyncHandler(async (req,res)=>{

        const coverImageLocalPath = req.file?.path;
        if(!coverImageLocalPath){
            throw new ApiError(400, "Cover image is required")   
        }

        const coverImage = await uploadOnCloudinary(coverImageLocalPath);

        if(!coverImage.url){
            throw new ApiError(500, " Something went wron while updating cover image")
        }

        const newCoverImage= await User.findByIdAndUpdate(
            req.user?._id,
            {
                $set:{
                    coverImage:coverImage.url
                }
            },
            {new:true}
        ).select("-password")


        return res.status(200).json(
            200, newCoverImage, " coverImage updated successfully"
        )
    })

export {
    registerUser,loginUser,
    logoutUser,refreshAccessToken,changeCurrentPassword,
    getCurrentUser
}