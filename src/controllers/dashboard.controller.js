import mongoose from "mongoose";
import { Video } from "../models/video.models.js";
import { Subscription } from "../models/subscription.models.js";
import { Like } from "../models/like.models.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const getChannelStats = asyncHandler(async (req, res) => {
  // TODO: Get the channel stats like total video views, total subscribers, total videos, total likes etc.
  // get channel id
  // validate channel id
  // get total videos uploaded by the channel
  // get total views of the channel
  // get total subscribers of the channel
  // get total likes of the channel
  // return response

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
      $project: {
        videoFile: 1,
        thumbnail: 1,
        title: 1,
        description: 1,
        duration: 1,
        views: 1,
        likeCount: 1,
      },
    },
  ]);

  // return response
  return res
    .status(200)
    .json(new ApiResponse(200, videos, "Channel videos fetched successfully"));
});

export { getChannelStats, getChannelVideos };
