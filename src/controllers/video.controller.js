import mongoose, { isValidObjectId } from "mongoose";
import { Video } from "../models/video.models.js";
import { User } from "../models/user.models.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import {
  deleteFromCloudinary,
  uploadOnCloudinary,
} from "../utils/cloudinary.js";

const getAllVideos = asyncHandler(async (req, res) => {
  const {
    page = 1,
    limit = 10,
    query = "",
    sortBy = "createdAt",
    sortType = "desc",
    userId,
  } = req.query;

  //covert page and limit to number
  const pageNumber = Number(page);
  const limitNumber = Number(limit);

  const matchCondition = {
    isPublish: true,
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
    .json(new ApiResponse(200, videos, "All videos fetched successfully"));
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
  if (!uploadedVideoFile?.secure_url) {
    throw new ApiError(400, "Video upload failed");
  }
  if (!uploadedThumbnail?.secure_url) {
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

  // send response
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

 const pipeline = [
  {
    $match: {
      _id: new mongoose.Types.ObjectId(videoId),
      isPublish: true,
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
          $project: { fullName: 1, username: 1, avatar: 1 },
        },
      ],
    },
  },

  // unwind owner before using owner._id in subsequent lookups
  {
    $addFields: {
      owner: { $first: "$owner" },
    },
  },

  // lookup likes
  {
    $lookup: {
      from: "likes",
      localField: "_id",
      foreignField: "video",
      as: "likes",
    },
  },

  // lookup comments (count only)
  {
    $lookup: {
      from: "comments",
      localField: "_id",
      foreignField: "video",
      as: "comments",
    },
  },

  // lookup subscribers using owner._id (now correctly unwound)
  {
    $lookup: {
      from: "subscriptions",
      localField: "owner._id",
      foreignField: "channel",
      as: "subscribers",
    },
  },

  // compute all counts
  {
    $addFields: {
      likesCount: { $size: "$likes" },
      commentsCount: { $size: "$comments" },
      subscribersCount: { $size: "$subscribers" },
    },
  },

  // isLike and isSubscribed — only if user is logged in
  ...(req.user
    ? [
        {
          $addFields: {
            isLike: {   // matches frontend: videoData?.isLike
              $in: [new mongoose.Types.ObjectId(req.user._id), "$likes.likeBy"],
            },
            isSubscribed: {
              $in: [new mongoose.Types.ObjectId(req.user._id), "$subscribers.subscriber"],
            },
          },
        },
      ]
    : [
        {
          $addFields: {
            isLike: false,
            isSubscribed: false,
          },
        },
      ]),

  // drop raw arrays — client only needs computed fields
  {
    $project: {
      likes: 0,
      comments: 0,
      subscribers: 0,  // fixed typo from "subscriber"
    },
  },
];
  const video = await Video.aggregate(pipeline);

  if (!video.length) {
    throw new ApiError(404, "Video not found");
  }

  // Increment views
  await Video.findByIdAndUpdate(videoId, {
    $inc: {
      views: 1,
    },
  });

  // Update response immediately
  video[0].views += 1;

 const isOwner = req.user && video[0].owner._id.equals(req.user._id);

  // ── Watch history — only for logged in users, not the owner
  if (req.user && !isOwner) {
  const videoObjectId = new mongoose.Types.ObjectId(videoId); 

  await User.findByIdAndUpdate(req.user._id, {
    $pull: { watchHistory: videoObjectId },
  });
  await User.findByIdAndUpdate(req.user._id, {
    $push: {
      watchHistory: {
        $each: [videoObjectId],
        $position: 0,
      },
    },
  });

  // verify it saved correctly
  const check = await User.findById(req.user._id).select("watchHistory");
  console.log("Watch history after save:", check.watchHistory);
}




// // Inside handler after video found
// const isOwner = req.user && video[0].owner._id.equals(req.user._id);
// const viewKey = `${req.user?._id ?? req.ip}:${videoId}`;

// if (!isOwner && !recentViews.has(viewKey)) {
//   recentViews.add(viewKey);
//   await Video.findByIdAndUpdate(videoId, { $inc: { views: 1 } });
//   video[0].views += 1;
//   setTimeout(() => recentViews.delete(viewKey), 24 * 60 * 60 * 1000);
// }





  return res.status(200).json(
    new ApiResponse(
      200,
      video[0],
      "Video fetched successfully"
    )
  );
});

const updateVideo = asyncHandler(async (req, res) => {
  const { videoId } = req.params;
  const { title, description } = req.body ?? {};

  // throw error  required any one field to update
  if (title === undefined && description === undefined && !req.file?.path) {
    throw new ApiError(
      400,
      "At least one field (title, description or thumbnail) is required to update"
    );
  }

  // validate videoId
  if (!isValidObjectId(videoId)) {
    throw new ApiError(400, "Invalid videoId");
  }

  // find video by id and owner
  const video = await Video.findOne({
    _id: videoId,
    owner: req.user._id,
  });

  if (!video) {
    throw new ApiError(404, "Video not found or unauthorized");
  }

  if (title !== undefined && !title.trim()) {
    throw new ApiError(400, "Title cannot be empty");
  }

  if (description !== undefined && !description.trim()) {
    throw new ApiError(400, "Description cannot be empty");
  }

  // update only provided fields
  if (title !== undefined) {
    video.title = title.trim();
  }
  if (description !== undefined) {
    video.description = description.trim();
  }

  let oldThumbnailPublicId;

  // update thumbnail (optional)
  if (req.file?.path) {
    const uploadedThumbnail = await uploadOnCloudinary(req.file.path);

    if (!uploadedThumbnail?.secure_url) {
      throw new ApiError(400, "Thumbnail upload failed");
    }

    // get old thumbnail public id for deletion
    oldThumbnailPublicId = video.thumbnail
      ?.split("/")
      .slice(-1)[0]
      .split(".")[0];

    video.thumbnail = uploadedThumbnail.secure_url;
  }

  await video.save();

  // delete old thumbnail from cloudinary
  if (oldThumbnailPublicId) {
    await deleteFromCloudinary(oldThumbnailPublicId);
  }

  return res
    .status(200)
    .json(new ApiResponse(200, video, "Video updated successfully"));
});

const deleteVideo = asyncHandler(async (req, res) => {
  const { videoId } = req.params;
  //TODO: delete video

  // validate videoId
  if (!isValidObjectId(videoId)) {
    throw new ApiError(400, "Invalid videoId");
  }

  // find video by id
  const video = await Video.findOne({
    _id: videoId,
    owner: req.user._id,
  });

  if (!video) {
    throw new ApiError(404, "Video not found or unauthorized");
  }

  // old video public and thumbnail id
  const oldVideoPublicId = video.videoFile
    ?.split("/")
    .slice(-1)[0]
    .split(".")[0];
  const oldThumbnailPublicId = video.thumbnail
    ?.split("/")
    .slice(-1)[0]
    .split(".")[0];

  // delete video document from database
  await video.deleteOne();

  // delete video file from cloudinary
  if (oldVideoPublicId) {
    await deleteFromCloudinary(oldVideoPublicId, "video");
  }

  // delete thumbnail from cloudinary
  if (oldThumbnailPublicId) {
    await deleteFromCloudinary(oldThumbnailPublicId);
  }

  return res
    .status(200)
    .json(new ApiResponse(200, null, "Video deleted successfully"));
});

const togglePublishStatus = asyncHandler(async (req, res) => {
  const { videoId } = req.params;

  //validate videoId
  if (!isValidObjectId(videoId)) {
    throw new ApiError(400, "Invalid videoId");
  }

  //find video by id
  const video = await Video.findOne({
    _id: videoId,
    owner: req.user._id,
  });

  // validate video
  if (!video) {
    throw new ApiError(404, "Video not found or unauthorized");
  }

  // toggle publish status
  video.isPublish = !video.isPublish;
  await video.save();

  // send response
  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        video,
        `Video ${video.isPublish ? "published" : "unpublished"} successfully`
      )
    );
});

export {
  getAllVideos,
  publishAVideo,
  getVideoById,
  updateVideo,
  deleteVideo,
  togglePublishStatus,
};
