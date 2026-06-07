import mongoose, { isValidObjectId } from "mongoose";
import { Like } from "../models/like.models.js";
import { Video } from "../models/video.models.js";
import { Comment } from "../models/comment.models.js";
import { Tweet } from "../models/tweet.models.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const toggleVideoLike = asyncHandler(async (req, res) => {
  const { videoId } = req.params;

  //validate videoId
  if (!isValidObjectId(videoId)) {
    throw new ApiError(400, "Invalid video ID");
  }

  //check video exists
  const video = await Video.findById(videoId);
  if (!video) {
    throw new ApiError(404, "Video not found");
  }

  //check existing like
  const existingLike = await Like.findOne({
    video: videoId,
    likeBy: req.user._id,
  });

  //unlike
  if (existingLike) {
    await Like.findByIdAndDelete(existingLike._id);

    return res
      .status(200)
      .json(
        new ApiResponse(200, { liked: false }, "Video unliked successfully")
      );
  }

  //create like
  await Like.create({
    video: videoId,
    likeBy: req.user._id,
  });

  return res
    .status(200)
    .json(new ApiResponse(200, { liked: true }, "Video liked successfully"));
});

const toggleCommentLike = asyncHandler(async (req, res) => {
  const { commentId } = req.params;

  if (!isValidObjectId(commentId)) {
    throw new ApiError(400, "Invalid comment ID");
  }

  const comment = await Comment.findById(commentId);

  if (!comment) {
    throw new ApiError(404, "Comment not found");
  }

  const existingLike = await Like.findOne({
    comment: commentId,
    likeBy: req.user._id,
  });

  if (existingLike) {
    await existingLike.deleteOne();

    return res
      .status(200)
      .json(
        new ApiResponse(200, { liked: false }, "Comment unliked successfully")
      );
  }

  await Like.create({
    comment: commentId,
    likeBy: req.user._id,
  });

  return res
    .status(200)
    .json(new ApiResponse(200, { liked: true }, "Comment liked successfully"));
});

const toggleTweetLike = asyncHandler(async (req, res) => {
  const { tweetId } = req.params;

  //validate tweetId
  if (!isValidObjectId(tweetId)) {
    throw new ApiError(400, "Invalid tweet ID");
  }

  // check tweet exist
  const tweet = await Tweet.findById(tweetId);
  if (!tweetId) {
    throw new ApiError(404, "Tweet not found");
  }

  // check existing like
  const existingLike = await Like.findOne({
    tweet: tweetId,
    likeBy: req.user._id,
  });

  //unlike
  if (existingLike) {
    await Like.findOneAndDelete(existingLike._id);

    return res
      .status(200)
      .json(
        new ApiResponse(200, { liked: false }, "Tweet unliked successfully")
      );
  }

  //create like
  await Like.create({
    tweet: tweetId,
    likeBy: req.user._id,
  });

  return res
    .status(200)
    .json(new ApiResponse(200, { liked: true }, "Tweet liked successfully"));
});

const getLikedVideos = asyncHandler(async (req, res) => {
  // Get all liked videos
 const page = Math.max(1, Number(req.query.page)) || 1;
  const limit = Math.min(10, Number(req.query.limit)) || 10;
  const skip = (page - 1) * limit;

  const videos = await Like.aggregate([
    {
      $match: {
        likeBy: new mongoose.Types.ObjectId(req.user._id),
        video: { $ne: null },
      },
    },
    {
      $lookup: {
        from: "videos",
        localField: "video",
        foreignField: "_id",
        as: "videoDetails",
      },
    },
    {
      $unwind: "$videoDetails",
    },
    {
      $replaceRoot: { newRoot: "$videoDetails" },
    },
    {
      $sort: { createdAt: -1 },
    },
    { $skip: skip },
    {
      $limit: limit,
    },
  ]);

  console.log("Video Details:", videos);
  return res
    .status(200)
    .json(new ApiResponse(200, videos, "Liked videos retrieved successfully"));
});



export { toggleCommentLike, toggleTweetLike, toggleVideoLike, getLikedVideos };
