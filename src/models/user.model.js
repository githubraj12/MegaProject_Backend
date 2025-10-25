import mongoose, {Schema} from 'mongoose';
import bcrypt from "bcrypt";
import jwt from 'jsonwebtoken';

const userSchema = new Schema({
    username: {
        type:String,
        required:true,
        unique:true,
        trim:true,
        lowercase:true,
        index:true
    },
    email:{
        type:String,
        required:true,
        unique:true,
        trim:true,
        lowercase:true
    },
    fullname:{
        type:String,
        required:true,
        trim:true,
        index:true
    },
    avatar:{
        type:String,  //cloudinary url 
        required:true,
         },
    coverImage:{
        type:String  // cloudinary url
    },
    watchHistory:[
        {
            type:Schema.Types.ObjectId,
            ref:'Video'}
    ],
    password:{
        type:String,
        required:[true, 'Password is required']
    },
    refreshToken:{
        type:String
    },

}, {timestamps:true}
)


// here we encrypt the password
userSchema.pre('save',async function(next){
    if(!this.isModified('password') ) return next();

    this.password = await bcrypt.hash(this.password,10)
    next();
})

// here we check the password given by user with already encrypted password in database
userSchema.methods.isPasswordCorrect = async function(password){
    return await bcrypt.compare(password, this.password)
}



// here we generate access token
userSchema.methods.generateAccessToken = function(){
    return jwt.sign(
        {
            _id:this._id,
            username:this.username,
            email:this.email,
            fullname:this.fullname
        },
        process.env.ACCESS_TOKEN_SECRET,
        {
            expiresIn:process.env.ACCESS_TOKEN_EXPIRY
        }

    )
}



// here we generate refresh token 
userSchema.methods.generateRefreshToken = function(){
    return jwt.sign(
        {
            _id:this._id,
            username:this.username,
            email:this.email,
            fullname:this.fullname
        },
        process.env.REFRESH_TOKEN_SECRET,
        {
            expiresIn:process.env.REFRESH_TOKEN_EXPIRY
        }

    )
}

export const User = mongoose.model('User',userSchema)