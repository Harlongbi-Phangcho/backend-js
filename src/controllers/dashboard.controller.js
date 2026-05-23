import mongoose from "mongoose";
import { Video } from "../models/video.models.js";
import { Subscription } from "../models/subscription.models.js";
import { Like } from "../models/like.models.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const getChannelStats = asyncHandler(async (req, res) => {
  // TODO: Get the channel stats like total video views, total subscribers, total videos, total likes etc.

  const channelId = req.user._id;
  const totalVideos = await Video.countDocuments({ owner: channelId });

  const totalViews = await Video.aggregate([
    {
      $match: {
        owner: new mongoose.Types.ObjectId(channelId),
      },
    },
    {
      $group: {
        _id: null,
        totalViews: { $sum: "$views" },
      },
    },
  ]);

  const totalSubscribers = await Subscription.countDocuments({
    channel: channelId,
  });

  const totalLikes = await Like.aggregate([
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
      $match: {
        "videoDetails.owner": new mongoose.Types.ObjectId(channelId),
      },
    },
    {
      $count: "totalLikes",
    },
  ]);

  return res.status(200).json(
    new ApiResponse(200, {
      totalVideos,
      totalViews: totalViews[0] ? totalViews[0].totalViews : 0,
      totalSubscribers,
      totalLikes: totalLikes[0] ? totalLikes[0].totalLikes : 0,
    })
  );
});

const getChannelVideos = asyncHandler(async (req, res) => {
  const { page = 1, limit = 10 } = req.query;

  const pageNumber = Math.max(1, Number(page) || 1);
  const limitNumber = Math.max(1, Number(limit) || 10);

  // get the channel id from the user object in the request
  const channelId = req.user._id;
  // find all videos uploaded by the channel
  const videos = await Video.aggregate([
    {
      $match: {
        owner: new mongoose.Types.ObjectId(channelId),
      },
    },
    {
      $lookup: {
        from: "likes",
        localField: "_id",
        foreignField: "video",
        as: "likes",
      },
    },

    {
      $addFields: {
        likeCount: {
          $size: "$likes",
        },
      },
    },

    {
      $sort: {
        createdAt: -1,
      },
    },

    {
      $project: {
        videoFile: 1,
        thumbnail: 1,
        title: 1,
        description: 1,
        duration: 1,
        views: 1,
        likeCount: 1,
        isPublish: 1,
        createdAt: 1,
      },
    },

    {
      $skip: (pageNumber - 1) * limitNumber,
    },

    {
      $limit: limitNumber,
    },
  ]);

  // return response
  return res
    .status(200)
    .json(new ApiResponse(200, videos, "Channel videos fetched successfully"));
});

export { getChannelStats, getChannelVideos };
