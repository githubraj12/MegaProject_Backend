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

    if([username,fullname,email,password].some(
        (field)=>field?.trim() === "")){
            throw new ApiError(400, "All fields are required")
        }
    
const existingUser= await User.findOne({
    $or:[{email},{username}]
});

if(existingUser){
    throw new ApiError(409, 'User already exist with this email or username')
}

console.log(req.files)

const avatarLocalPath= req.files?.avatar[0]?.path;
let coverImageLocalPath;

if(req.files && Array.isArray(req.files.coverImage) && req.files.coverImage.length > 0){
    coverImageLocalPath=req.files.coverImage[0].path;
}

if(!avatarLocalPath){
    throw new ApiError(400, 'Avatar image is required')
}


const avatar = await uploadOnCloudinary(avatarLocalPath);
const coverImage = await uploadOnCloudinary(coverImageLocalPath);


if(!avatar){
    throw new ApiError(400, 'Avatar image is required')
}

const user = await User.create({
    username: username.toLowerCase(),
    email,
    fullname,
    password,
    avatar:avatar.url,
    coverImage:coverImage?.url || "",
});

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

    const {accessToken, refreshToken} = await generateAccesssAndRefreshToken(user._id);

    const loggedUser = await User.findOne(user._id).select(
        "-password -refreshToken"
    )


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




export {
    registerUser,loginUser,
    logoutUser,refreshAccessToken
}