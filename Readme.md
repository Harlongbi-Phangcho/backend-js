# Backend JS API

A feature-rich backend API built using **Node.js, Express.js, MongoDB, and Mongoose**.

This project implements a scalable backend architecture inspired by modern content platforms (YouTube/Twitter-style features) with **authentication, video management, subscriptions, playlists, likes, comments, tweets, dashboard analytics, and media uploads**.

The project focuses on backend fundamentals including **REST APIs, JWT authentication, MongoDB aggregation pipelines, middleware architecture, file uploads, reusable utilities, and scalable folder structure**.

---

## Features

### Authentication & User Management

* User Registration
* Secure Login & Logout
* JWT Authentication
* Access Token & Refresh Token Flow
* Password Change
* Current User Retrieval
* Update Account Details
* Update Avatar
* Update Cover Image
* Channel Profile Retrieval
* Watch History

### Video Management

* Upload Videos
* Upload Video Thumbnail
* Get All Videos
* Get Video By ID
* Update Video Details
* Delete Video
* Toggle Publish Status
* Video Views Tracking
* Pagination Support

### Comments

* Add Comment
* Update Comment
* Delete Comment
* Get Video Comments

### Likes

* Like / Unlike Videos
* Like / Unlike Comments
* Like / Unlike Tweets
* Get Liked Videos

### Subscription System

* Subscribe / Unsubscribe Channels
* Get User Subscribed Channels
* Get Channel Subscribers

### Playlist Management

* Create Playlist
* Update Playlist
* Delete Playlist
* Add Video to Playlist
* Remove Video from Playlist
* Get User Playlists

### Tweets

* Create Tweet
* Update Tweet
* Delete Tweet
* Get User Tweets

### Dashboard

* Get Channel Statistics
* Get Channel Videos

### Healthcheck

* API Healthcheck Endpoint

---

## Tech Stack

### Backend

* **Node.js**
* **Express.js**
* **MongoDB**
* **Mongoose**

### Authentication & Security

* **JWT (jsonwebtoken)**
* **bcrypt**
* **cookie-parser**
* **CORS**

### File Handling

* **Multer** (temporary local storage)
* **Cloudinary** (media storage)

### Database Features

* **MongoDB Aggregation Pipeline**
* **Pagination**
* **Mongoose Relationships**

### Development Tools

* **Nodemon**
* **Prettier**

---

## Architecture & Concepts Used

This project was built to practice backend engineering concepts such as:

* REST API Design
* MVC-inspired Folder Structure
* Authentication & Authorization
* Access & Refresh Token Strategy
* Custom Error Handling
* Async Error Wrapper
* Middleware Pattern
* File Upload Handling
* MongoDB Aggregation Pipelines
* Pagination
* Route Modularization
* Secure Cookies
* Database Relationships

---

## Folder Structure

```txt
backend-js/
│
├── public/
│   └── temp/
│
├── src/
│   ├── controllers/
│   │   ├── comment.controller.js
│   │   ├── dashboard.controller.js
│   │   ├── healthcheck.controller.js
│   │   ├── like.controller.js
│   │   ├── playlist.controller.js
│   │   ├── subscription.controller.js
│   │   ├── tweet.controller.js
│   │   ├── user.controller.js
│   │   └── video.controller.js
│   │
│   ├── db/
|   |   |__ index.js
│   │
│   ├── middlewares/
│   │   ├── auth.middleware.js
│   │   └── multer.middleware.js
│   │
│   ├── models/
│   │   ├── comment.models.js
│   │   ├── like.models.js
│   │   ├── playlist.models.js
│   │   ├── subscription.models.js
│   │   ├── tweet.models.js
│   │   ├── user.models.js
│   │   └── video.models.js
│   │
│   ├── routes/
│   │   ├── comment.routes.js
│   │   ├── dashboard.routes.js
│   │   ├── healthcheck.routes.js
│   │   ├── like.routes.js
│   │   ├── playlist.routes.js
│   │   ├── subscription.routes.js
│   │   ├── tweet.routes.js
│   │   ├── user.routes.js
│   │   └── video.routes.js
│   │
│   ├── utils/
│   │   ├── ApiError.js
│   │   ├── ApiResponse.js
│   │   ├── asyncHandler.js
│   │   └── cloudinary.js
│   │
│   ├── app.js
│   ├── constants.js
│   └── index.js
│
├── .env
├── package.json
└── README.md
```

---

## Authentication Flow

Protected routes use a custom `verifyJWT` middleware.

Authentication works using:

* **HTTP-only cookies**
* **Bearer token fallback**

The middleware validates:

* Access token
* Logged-in user existence
* Authorization for protected routes

Example:

```http
Authorization: Bearer your_access_token
```

---

## File Upload Flow

The project supports media uploads using:

### Multer

Temporary local file storage:

```txt
public/temp
```

### Cloudinary

Uploaded media is stored in Cloudinary for persistent hosting.

Supported uploads:

* Avatar
* Cover Image
* Video File
* Video Thumbnail

---

## API Base URL

```http
/api/v1
```

### Modules

```txt
/api/v1/users
/api/v1/videos
/api/v1/comments
/api/v1/likes
/api/v1/playlists
/api/v1/subscriptions
/api/v1/tweets
/api/v1/dashboards
/api/v1/healthchecks
```

---

## Installation

Clone the repository:

```bash
git clone https://github.com/Harlongbi-Phangcho/backend-js.git
```

Move into the project:

```bash
cd backend-js
```

Install dependencies:

```bash
npm install
```

---

## Environment Variables

Create a `.env` file in the root directory.

```env
PORT=8000

MONGODB_URI=

CORS_ORIGIN=

ACCESS_TOKEN_SECRET=
ACCESS_TOKEN_EXPIRY=

REFRESH_TOKEN_SECRET=
REFRESH_TOKEN_EXPIRY=

CLOUDINARY_CLOUD_NAME=
CLOUDINARY_API_KEY=
CLOUDINARY_API_SECRET=
```

---

## Running The Project

Development mode:

```bash
npm run dev
```

Production mode:

```bash
npm start
```

---

## Main Dependencies

```json
{
  "bcrypt": "^6.0.0",
  "cloudinary": "^2.10.0",
  "cookie-parser": "^1.4.7",
  "cors": "^2.8.6",
  "dotenv": "^17.4.2",
  "express": "^5.2.1",
  "jsonwebtoken": "^9.0.3",
  "mongoose": "^9.5.0",
  "mongoose-aggregate-paginate-v2": "^1.1.4",
  "multer": "^2.1.1"
}
```

### Dev Dependencies

```json
{
  "nodemon": "^3.1.14",
  "prettier": "^3.8.3"
}
```

---

## Future Improvements

* API Documentation (Swagger / Postman)
* Rate Limiting
* Unit Testing
* Deployment
* Logging System
* Role-Based Authorization

---

## Learning Goals

This project was built to strengthen practical backend development skills and understand how production-style APIs are structured using Node.js and MongoDB.

---

## Author

**Harlongbi Phangcho**

GitHub:
https://github.com/Harlongbi-Phangcho
