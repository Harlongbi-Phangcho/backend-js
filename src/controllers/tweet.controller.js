import mongoose, { isValidObjectId } from "mongoose";
import { Tweet } from "../models/tweet.models.js";
import { User } from "../models/user.models.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const createTweet = asyncHandler(async (req, res) => {
  // get content
  const { content } = req.body;

  // validate request body
  if (!content?.trim()) {
    throw new ApiError(400, "Content is required");
  }
  // create a new tweet
  const newTweet = await Tweet.create({
    content: content.trim(),
    owner: req.user._id,
  });

  // return response
  return res
    .status(201)
    .json(new ApiResponse(201, newTweet, "Tweet created successfully"));
});

const getUserTweets = asyncHandler(async (req, res) => {
  // get userId from params
  const { userId } = req.params;
  const {page = 1, limit = 10} = req.query

  
  const pageNumber = parseInt(page);
  const limitNumber = parseInt(limit);

  // validate page and limit
  if (isNaN(pageNumber) || pageNumber < 1) {
    throw new ApiError(400, "Invalid page number");
  }
  if (isNaN(limitNumber) || limitNumber < 1) {
    throw new ApiError(400, "Invalid limit number");
   }

   const skipNumber = (pageNumber - 1) * limitNumber;

  // validate userId
  if (!isValidObjectId(userId)) {
    throw new ApiError(400, "Invalid userId");
  }

  // get tweets of the user and aggregate owner details
  const tweets = await Tweet.aggregate([
    {
      $match: {
        owner: new mongoose.Types.ObjectId(userId),
      },
    },
    {
      $lookup: {
        from: "users",
        localField: "owner",
        foreignField: "_id",
        as: "owner",
        pipeline: [
          {
            $project: {
              fullName: 1,
              username: 1,
              avatar: 1,
            },
          },
        ],
      },
    },

    //convert owner array to object
    {
      $addFields: {
        owner: {
          $first: "$owner",
        },
      },
    },

   
    {
      $sort: {
        createdAt: -1,
      },
    },

    {
      $skip: skipNumber,
    },
    {
      $limit: limitNumber,
    },
  ]);

  // send response
  return res
    .status(200)
    .json(new ApiResponse(200, tweets, "User tweets fetched successfully"));
});

const updateTweet = asyncHandler(async (req, res) => {
  //TODO: update tweet

  // get tweetId and userId
  const { tweetId } = req.params;
  const { content } = req.body;

  // validate tweetId and content
  if (!isValidObjectId(tweetId)) {
    throw new ApiError(400, "Invalid tweetId");
  }
  if (!content?.trim()) {
    throw new ApiError(400, "Content is required");
  }

  //
  const updatedTweet = await Tweet.findOneAndUpdate(
    {
      _id: tweetId,
      owner: req.user._id,
    },
    {
      $set: {
        content: content.trim(),
      },
    },
    { new: true }
  );
  if (!updatedTweet) {
    throw new ApiError(404, "Tweet not found or unauthorized");
  }

  // return response
  return res
    .status(200)
    .json(new ApiResponse(200, updatedTweet, "Tweet updated successfully"));
});

const deleteTweet = asyncHandler(async (req, res) => {
  // get tweetId and userId
  const { tweetId } = req.params;

  // validate tweetId
  if (!isValidObjectId(tweetId)) {
    throw new ApiError(400, "Invalid tweetId");
  }
  // check if tweet exists and belongs to the user
  const deletedTweet = await Tweet.findOneAndDelete({
    _id: tweetId,
    owner: req.user._id,
  });
  if (!deletedTweet) {
    throw new ApiError(404, "Tweet not found or unauthorized");
  }

  return res
    .status(200)
    .json(new ApiResponse(200, {}, "Tweet deleted successfully"));
});

export { createTweet, getUserTweets, updateTweet, deleteTweet };
