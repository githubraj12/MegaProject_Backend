import mongoose, { mongo } from "mongoose";
import { User } from "../models/user.model";
import { Video } from "../models/video.model";
import { ApiError } from "../utils/ApiError";
import { ApiResponse } from "../utils/ApiResponse";
import { asyncHandler } from "../utils/asyncHandler";
import { uploadOnCloudinary } from "../utils/cloudinary";



const getAllVideos = asyncHandler(async (req, res) => {
    const { page = 1, limit = 10, query="", sortBy="createdAt", sortType="desc", userId } = req.query;
    //TODO: get all videos based on query, sort, pagination


    const sortStage = {};

    if(sortBy && sortType){
        sortStage[sortBy] = sortType === "desc" ? -1 : 1;
    }

    if(userId){
        matchStage.owner=new mongoose.ObjectId(userId)
    }

    const aggregate = await Video.aggregate([
        {
            $match:{
                isPublished:true,
                $or:[
                    {title: {$regex: query || "", $options:"i"}},
                    {description:{$regex:query || "", $options:"i"}}
                ]
            }
        },
        {
            $lookup:{
                from:"users",
                localField:"owner",
                foreignField:"_id",
                as:"owner",
                pipeline:[
                    {
                        $project:{
                title:1,
                description:1,
                duration:1,
                views:1,
                thumbnail:1,
                username:1

                        }
                    }
                ]}
        },
        {
            $sort:sortStage
        },
        {
            $unwind:"$owner"
        }
    ])

    const options ={
        page:parseInt(page, 10),
        limit:parseInt(limit, 10)
    }


    const videos = await Video.aggregatePaginate(aggregate, options);

    if(!videos){
        throw new ApiError(500, " Error in fetching Videos")
    }

    return res.status(200).json(
        new ApiResponse(200, videos, " All Videos fetched successfully")
    )

})




const publishAVideo= asyncHandler(async (req, res) => {
    const { title, description} = req.body
    // TODO: get video, upload to cloudinary, create video

if(!(title || description)){
    throw new ApiError(400, " Title and description are required")
}

const user = await User.findById(req.user?._id);
if(!user){
    throw new ApiError(404, " user not found ");
}

const videoLocalPath = req.files?.videoFile[0]?.path;
const thumbnailLocalPath = req.files?.thumbnail[0]?.path

if(!videoLocalPath || !thumbnailLocalPath){
    throw new ApiError(400, " Video file and thumbnail are required");
}

const videoFile = await uploadOnCloudinary(videoLocalPath);
const thumbnail = await uploadOnCloudinary(thumbnailLocalPath);

if(!videoFile || !thumbnail){
    throw new ApiError(500, " Error while uploading to cloudinary");
}

const duration = videoFile.duration; 

const video = await Video.create({
    videoFile:videoFile.url,
    thumbnail:thumbnail.url,
    title,
    description,
    duration:duration,
})
console.log(video)

if(!video){
    throw new ApiError(500, " Error while uploading the video")
}

return res.status(200).json(
    new ApiResponse(200, video, " Video Uploaded successfully")
)

})




const getVideoById = asyncHandler(async (req, res) => {
    const { videoId } = req.params
    //TODO: get video by id
    if(!videoId){
        throw new ApiError(400, " Video not found");
    }
    const video = await Video.findById(videoId) ;
    return res.status(200).json(
        new ApiResponse(200, video, " video fetched successfully")
    )
})

const updateVideo = asyncHandler(async (req, res) => {
    const { videoId } = req.params
    //TODO: update video details like title, description, thumbnail

    if(!videoId){
        throw new ApiError(400, "Video not found")
    }
    const { title, description} = req.body;
    const thumbnailLocalPath = req.file?.path;

    if(!title && !description && !thumbnailLocalPath){
        throw new ApiError(400, " Nothing to update");
    }

    const thumbnail = await uploadOnCloudinary(thumbnailLocalPath);
    if(!thumbnail){
        throw new ApiError(500, " error in uploading thumbnail")
    }

    const video = await Video.findByIdAndUpdate(
        videoId,
    {
        $set:{
            title,
            description,
            thumbnail: thumbnail.url
        },
    },
    { new: true })

    return res.status(200).json(
        new ApiResponse(200, video, " video updated successfully")
    )
})





const deleteVideo = asyncHandler(async (req, res) => {
    const { videoId } = req.params
    //TODO: delete video
    if(!videoId){
        throw new ApiError(400, " video not found")
    }
    const deletedVideo = await Video.findByIdAndDelete(videoId);

    return res.status(200).json(
        new ApiResponse(200, deletedVideo, " video deleted successfully")
    )
})




const togglePublishStatus = asyncHandler(async (req, res) => {
    const { videoId } = req.params;

    if(!videoId){
        throw new ApiError(400, " video not found ")
    };

    const video = await Video.findById(videoId);

    if( !video ){
        throw new ApiError(400, " video not found ")
    }

    video.isPublished = !video.isPublished

    video.save()

    return res.status(200).json(
        new ApiResponse(200, video, " successfully toggle the video publish status ")
    )


})




export {
    publishAVideo,
    getAllVideos,
    updateVideo,
    getVideoById,
    deleteVideo,
    togglePublishStatus
}