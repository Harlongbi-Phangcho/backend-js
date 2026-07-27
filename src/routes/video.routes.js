import { Router } from "express";
import {
  deleteVideo,
  getAllVideos,
  getVideoById,
  publishAVideo,
  togglePublishStatus,
  updateVideo,
} from "../controllers/video.controller.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import { upload } from "../middlewares/multer.middleware.js";
import { optionalVerifyJWT } from "../middlewares/optionalVerifyJWT.middleware.js";

const router = Router();
// Public routes — no auth needed
router.route("/:videoId").get(optionalVerifyJWT, getVideoById)
  router.route("/")
  .get(getAllVideos)
  .post(
    verifyJWT,
    upload.fields([
      { name: "videoFile", maxCount: 1 },
      { name: "thumbnail", maxCount: 1 },
    ]),
    publishAVideo
  );

router.route("/toggle/publish/:videoId").patch(verifyJWT, togglePublishStatus);

router
  .route("/:videoId")
  .delete(verifyJWT, deleteVideo)
  .patch(verifyJWT, upload.single("thumbnail"), updateVideo);

export default router;
