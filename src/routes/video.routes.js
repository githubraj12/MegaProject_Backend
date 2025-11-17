import express from 'express';
import { upload } from '../middlewares/multer.middleware';
import { verifyJWT } from '../middlewares/auth.middleware';
import { deleteVideo, getAllVideos, getVideoById, publishAVideo, togglePublishStatus, updateVideo } from '../controllers/video.controller';


const router = express.Router();


router.route('/publish').post(verifyJWT,upload.fields([
    {
        name: videoFile,
        maxCount:1
    },
    { 
        name:thumbnail,
        maxCount:1
    }
]),publishAVideo)

router.route("/:videoId").get(verifyJWT,getVideoById)
router.route("/update/:videoId").patch(verifyJWT,upload.single("thumbnail"),updateVideo);

router.route("/delete/:videoId").post(verifyJWT,deleteVideo)
router.route("/status/:videoId").post(verifyJWT,togglePublishStatus)

router.route("/all-videos").get(verifyJWT,getAllVideos);


export default router;