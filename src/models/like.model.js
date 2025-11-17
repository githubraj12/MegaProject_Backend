import mongoose, { Schema} from "mongoose";

const likeSchema = new Schema({
    video:{
        type:Schema.Types.ObjectId,
        ref:"Video"
    },
    tweet:{
        type:Schema.Types.ObjectId,
        ref:"Tweet"
    },
    comment:{
        type:Schema.Types.ObjectId,
        ref:"Comment"
    },
    likedby:{
        type:Schema.Types.ObjectId,
        ref:"User"
    }
})



export const Like = mongoose.model("Like", likeSchema);