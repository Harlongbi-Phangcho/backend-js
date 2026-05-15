import mongoose, { isValidObjectId } from "mongoose";
import { Video } from "../models/video.models.js";
import { User } from "../models/user.models.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";

const getAllVideos = asyncHandler(async (req, res) => {
  const {
    page = 1,
    limit = 10,
    query,
    sortBy = "createdAt",
    sortType = "desc",
    userId,
  } = req.query;

  //covert page and limit to number
  const pageNumber = parseInt(page);
  const limitNumber = parseInt(limit);

  const matchCondition = {
    isPublished: true,
  };

  // search by title
  if (query) {
    matchCondition.title = {
      $regex: query,
      $options: "i",
    };
  }

  // filter by owner
  if (userId) {
    if (!isValidObjectId(userId)) {
      throw new ApiError(400, "Invalid userId");
    }
    matchCondition.owner = new mongoose.Types.ObjectId(userId);
  }

  // sorting
  const sortCondition = {};
  sortCondition[sortBy] = sortType === "asc" ? 1 : -1;

  // aggregate videos with user details using $lookup
  const videos = await Video.aggregate([
    {
      $match: matchCondition,
    },
    {
      $lookup: {
        from: "users",
        localField: "owner",
        foreignField: "_id",
        as: "ownerDetails",
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
    {
      $addFields: {
        ownerDetails: {
          $first: "$ownerDetails",
        },
      },
    },

    {
      $sort: sortCondition,
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
    .json(new ApiResponse(200, videos, "Videos fetched successfully"));
});

const publishAVideo = asyncHandler(async (req, res) => {
  const { title, description } = req.body;

  // validate title and description
  if (!title?.trim() || !description?.trim()) {
    throw new ApiError(400, "Title and description are required");
  }

  // validate files
  if (!req.files || !req.files.videoFile || !req.files.thumbnail) {
    throw new ApiError(400, "Video file and thumbnail are required");
  }

  // get local path
  const videoFilePath = req.files?.videoFile[0]?.path;
  const thumbnailPath = req.files?.thumbnail[0]?.path;

  // validate local path
  if (!videoFilePath) {
    throw new ApiError(400, "Video file path is required");
  }
  if (!thumbnailPath) {
    throw new ApiError(400, "thumbnail path is required");
  }

  // upload file to cloudinary
  const uploadedVideoFile = await uploadOnCloudinary(videoFilePath);
  const uploadedThumbnail = await uploadOnCloudinary(thumbnailPath);

  // validate upload
  if (!uploadedVideoFile.secure_url) {
    throw new ApiError(400, "Video upload failed");
  }
  if (!uploadedThumbnail.secure_url) {
    throw new ApiError(400, "Thumbnail upload failed");
  }

  // create video document in database
  const newVideo = await Video.create({
    title,
    description,
    videoFile: uploadedVideoFile.secure_url,
    thumbnail: uploadedThumbnail.secure_url,
    owner: req.user._id,
    duration: uploadedVideoFile.duration || 0, // set duration if available, otherwise default to 0
  });

  if (!newVideo) {
    throw new ApiError(500, "Failed to publish video");
  }

  // sennd response
  return res
    .status(201)
    .json(new ApiResponse(201, newVideo, "Video published successfully"));
});

const getVideoById = asyncHandler(async (req, res) => {
  const { videoId } = req.params;

  // validate videoId
  if (!isValidObjectId(videoId)) {
    throw new ApiError(400, "Invalid videoId");
  }

  // aggregate video with user details using $lookup
  const video = await Video.aggregate([
    {
      $match: {
        _id: new mongoose.Types.ObjectId(videoId),
        isPublished: true,
      },
    },

    // lookup owner details
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

    {
      $addFields: {
        owner: {
          $first: "$owner",
        },
      },
    },
  ]);

  if (!video.length === 0) {
    throw new ApiError(404, "Video not found");
  }
  return res
    .status(200)
    .json(new ApiResponse(200, video[0], "Video fetched successfully"));
});

const updateVideo = asyncHandler(async (req, res) => {
  const { videoId } = req.params;
  //TODO: update video details like title, description, thumbnail
  // validate videoId
  if (!isValidObjectId(videoId)) {
    throw new ApiError(400, "Invalid videoId");
  }
});

const deleteVideo = asyncHandler(async (req, res) => {
  const { videoId } = req.params;
  //TODO: delete video
});

const togglePublishStatus = asyncHandler(async (req, res) => {
  const { videoId } = req.params;
});

export {
  getAllVideos,
  publishAVideo,
  getVideoById,
  updateVideo,
  deleteVideo,
  togglePublishStatus,
};
