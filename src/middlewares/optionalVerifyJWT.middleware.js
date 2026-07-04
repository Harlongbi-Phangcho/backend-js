import jwt from "jsonwebtoken";
import { User } from "../models/user.models";
import { asyncHandler } from "../utils/asyncHandler";

export const optionalVerifyJWT = asyncHandler(async (req, res, next) => {
  try {
    const token =
      req.cookies?.accessToken ||
      req.header("Authorization")?.replace("Bearer ", "");
    if (!token) {
      req.user = null;
      return next();
    }
    const decodedToken = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);
    const user = await User.findById(decodedToken?._id).select(
      "-password -refreshToken"
    );
    req.user = user || null;
  } catch (error) {
    // Invalid or expired token -> continue as guest
    req.user = null;
    next();
  }
});
