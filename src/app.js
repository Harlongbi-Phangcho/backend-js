import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import {errorHandler} from "./middlewares/errorHandler.js";

const app = express();

app.use(
  cors({
    origin: process.env.CORS_ORIGIN,
    credentials: true,
  })
);

//accepting json
app.use(express.json({ limit: "16kb" })); //accepting json
app.use(express.urlencoded({ extended: true, limit: "16kb" }));
app.use(express.static("public"));
app.use(cookieParser());

//routes import
import userRouter from "./routes/user.routes.js";
import videoRouter from "./routes/video.routes.js";
import tweetRouter from "./routes/tweet.routes.js";
import commentRouter from "./routes/comment.routes.js";
import playlistRouter from "./routes/playlist.routes.js";
import SubscriptionRouter from "./routes/subscription.routes.js";
import DashboardRouter from "./routes/dashboard.routes.js";
import healthcheckRouter from "./routes/healthcheck.routes.js";
import LikeRouter from "./routes/like.routes.js";

//routes declaration
app.use("/api/v1/users", userRouter);
app.use("/api/v1/videos", videoRouter);
app.use("/api/v1/tweets", tweetRouter);
app.use("/api/v1/comments", commentRouter);
app.use("/api/v1/playlists", playlistRouter);
app.use("/api/v1/subscriptions", SubscriptionRouter);
app.use("/api/v1/dashboards", DashboardRouter);
app.use("/api/v1/healthchecks", healthcheckRouter);
app.use("/api/v1/likes", LikeRouter);

app.use(errorHandler);

export { app };
