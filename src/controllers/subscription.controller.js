import mongoose, { isValidObjectId } from "mongoose";
import { User } from "../models/user.models.js";
import { Subscription } from "../models/subscription.models.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const toggleSubscription = asyncHandler(async (req, res) => {
  const { channelId } = req.params;

  // validate channel id
  if (!channelId) {
    throw new ApiError(400, "Channel Id is required");
  }

  if (!isValidObjectId(channelId)) {
    throw new ApiError(400, "Invalid channel Id");
  }

  // user cannot subscribe to their own channel
  if (channelId === req.user._id.toString()) {
    throw new ApiError(400, "You cannot subscribe to your own channel");
  }

  // check if channel exists
  const channel = await User.findById(channelId);
  if (!channel) {
    throw new ApiError(404, "Channel not found");
  }

  // check if already subscribed
  const isSubscribed = await Subscription.findOne({
    subscriber: req.user._id,
    channel: channelId,
  });

  // unsubscribe if already subscribed
  if (isSubscribed) {
    await Subscription.findByIdAndDelete(isSubscribed._id);

    return res
      .status(200)
      .json(
        new ApiResponse(
          200,
          { subscribed: false },
          "Unsubscribed to channel successfully"
        )
      );
  }

  // subscribe to channel
  await Subscription.create({
    subscriber: req.user._id,
    channel: channelId,
  });

  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        { subscribed: true },
        "Subscribed to channel successfully"
      )
    );
});

// controller to return subscriber list of a channel
const getUserChannelSubscribers = asyncHandler(async (req, res) => {
  const { subscriberId } = req.params;

  //paginate
  const page = Math.max(1, Number(req.query.page) || 1);
  const limit = Math.min(10, Number(req.query.limit) || 1);

  //validate channel id
  if (!isValidObjectId(subscriberId)) {
    throw new ApiError(400, "Invalid channel ID");
  }

  // check if channel exists
  const subscribers = await Subscription.aggregate([
    {
      $match: {
        channel: new mongoose.Types.ObjectId(subscriberId),
      },
    },
    {
      $lookup: {
        from: "users",
        localField: "subscriber",
        foreignField: "_id",
        as: "subscriber",
        pipeline: [
          {
            $project: { username: 1, fullName: 1, avatar: 1 },
          },
        ],
      },
    },

    {
      $addFields: {
        subscriberDetails: {
          $first: "$subscriber",
        },
      },
    },

    {
      $addFields: {
        subscriberCount: {
          $size: "$subscriber",
        },
      },
    },
    {
      $skip: (page - 1) * limit,
    },

    {
      $limit: limit,
    },
  ]);

  // return response
  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        subscribers,
        "Channel subscribers fetched successfully"
      )
    );
});

// controller to return channel list to which user has subscribed
const getSubscribedChannels = asyncHandler(async (req, res) => {
  const { subscriberId } = req.params;

  // pagination
  const page = Math.max(1, Number(req.query.page) || 1);
  const limit = Math.min(10, Number(req.query.limit) || 1);
  const skip = (page - 1) * limit;

  // validate subscribe ID
  if (!isValidObjectId(subscriberId)) {
    throw new ApiError(400, "Invalid subscribe ID");
  }

  const subscribedChannel = await Subscription.aggregate([
    {
      $match: {
        subscriber: new mongoose.Types.ObjectId(subscriberId),
      },
    },
    {
      $lookup: {
        from: "users",
        localField: "channel",
        foreignField: "_id",
        as: "channelDetails",
        pipeline: [
          {
            $project: {
              username: 1,
              fullName: 1,
              avatar: 1,
            },
          },
        ],
      },
    },

    {
      $unwind: "$channelDetails",
    },

    {
      $skip: skip,
    },

    {
      $limit: limit,
    },
  ]);

  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        subscribedChannel,
        "Subscribed channels fetched successfully"
      )
    );
});

export { toggleSubscription, getUserChannelSubscribers, getSubscribedChannels };
