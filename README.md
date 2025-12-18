# AI StarClass Backend

This is the backend service for the AI StarClass WeChat Mini Program, designed to be hosted on WeChat Cloud Hosting (微信云托管).

## Tech Stack

- **Runtime**: Node.js (v18)
- **Framework**: Express
- **Language**: TypeScript
- **Database**: MongoDB (via Mongoose)

## Project Structure

```
src/
  config/       # Configuration (DB, Port)
  controllers/  # Business logic
  middleware/   # Auth middleware (handling x-wx-openid)
  models/       # Mongoose schemas
  routes/       # API routes
  utils/        # Utilities
  index.ts      # Entry point
```

## Setup & Local Development

1. **Install Dependencies**
   ```bash
   npm install
   ```

2. **Environment Variables**
   Create a `.env` file in the root directory:
   ```env
   PORT=8080
   MONGO_URI=mongodb://localhost:27017/ai-starclass
   NODE_ENV=development
   ```

3. **Run Locally**
   ```bash
   npm run dev
   ```
   
   Note: When running locally, the authentication middleware looks for `x-wx-openid` header. You can bypass this or mock it by modifying `src/middleware/auth.ts` or sending `x-debug-openid` if enabled.

## Deployment to WeChat Cloud Hosting

1. **Push to Code Repository**: Push this code to the repository linked with your WeChat Cloud Hosting environment.
2. **Dockerfile**: The project includes a `Dockerfile` optimized for WeChat Cloud Hosting.
3. **Service Configuration**:
   - Ensure the service listens on port 80 (default in Dockerfile).
   - Set the `MONGO_URI` environment variable in the Cloud Hosting console to point to your Cloud Database (or internal MongoDB connection string).

## API Endpoints

### User
- `GET /api/user/me`: Get current user info.
- `POST /api/user/profile`: Create or update user profile.

### Class
- `GET /api/class`: Get all classes for the current user.
- `POST /api/class`: Create a new class.
- `GET /api/class/:id`: Get details of a specific class.
- `POST /api/class/:id/student`: Add a student to a class.
- `POST /api/class/:id/log`: Add a behavior log.

## Integration with Frontend

The frontend should call these endpoints using `callContainer` (or `wx.cloud.callContainer`).
Ensure your frontend `src/services/cloud.ts` points to the correct service name.
