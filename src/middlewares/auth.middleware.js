import { User } from "../models/user.model";
import { ApiError } from "../utils/ApiError";
import { asyncHandler } from "../utils/asyncHandler";
import jwt from "jsonwebtoken"


export const verifyJWT = asyncHandler(async (req,res,next)=>{

 try {
       const token = req.cookies?.accessToken || req.header
       ("Authorization")?.replace("Bearer","");
   
       if(!token){
           throw new ApiError(400, ' Unauthorised access');
       }
   
   
       const decodedtoken = jwt.verify(token,process.env.
           ACCESS_TOKEN_SECRET)
   
       const user = User.findById(decodedtoken._id).select(
           "-password -refreshToken"
       )
   
       if(!user){
           throw new ApiError(401, " Invalid access token")
       }
   
       req.user = user;
       next();
 } catch (error) {
    throw new ApiError(401, error?.message || "Invalid Access Token")
 }


})