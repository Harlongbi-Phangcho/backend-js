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

  // return videos
  return res
    .status(200)
    .json(new ApiResponse(200, videos, "Videos fetched successfully"));
});

const publishAVideo = asyncHandler(async (req, res) => {
  const { title, description } = req.body;

  // TODO: get video, upload to cloudinary, create video
  if ([title, description].some((field) => field.trim() === "")) {
    throw new ApiError(400, "Title and description are required");
  }

  // check if video file and thumbnail are present
  if (!req.files || !req.files.videoFile || !req.files.thumbnail) {
    throw new ApiError(400, "Video file and thumbnail are required");
  }

  const videoFilePath = req.files?.videoFile[0]?.path;
  const thumbnailPath = req.files?.thumbnail[0]?.path;

  if (!videoFilePath) {
    throw new ApiError(400, "Video file path is required");
  }
  if (!thumbnailPath) {
    throw new ApiError(400, "thumbnail path is required");
  }

  const uploadedVideoFile = await uploadOnCloudinary(videoFilePath);
  const uploadedThumbnail = await uploadOnCloudinary(thumbnailPath);

  console.log("req.user: ", req.user)

  if (!uploadedVideoFile) {
    throw new ApiError(400, "Video file is required");
  }
  if (!uploadedThumbnail) {
    throw new ApiError(400, "thumbnail file is required");
  }

  const newVideo = await Video.create({
    title,
    description,
    videoFile: uploadedVideoFile.secure_url,
    thumbnail: uploadedThumbnail.secure_url,
    owner: req.user._id,
    duration: uploadedVideoFile.duration || 0, // set duration if available, otherwise default to 0
  });

});

const getVideoById = asyncHandler(async (req, res) => {
  const { videoId } = req.params;
  //TODO: get video by id
});

const updateVideo = asyncHandler(async (req, res) => {
  const { videoId } = req.params;
  //TODO: update video details like title, description, thumbnail
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
