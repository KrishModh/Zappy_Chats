# Zappy - Full-Stack Real-Time Chat App

## Project Overview
Zappy is a production-ready, beginner-friendly full-stack chat platform built with React + Node.js + MongoDB + Socket.IO. It supports OTP-based signup, JWT authentication, real-time messaging, chat request approvals, profile picture uploads via Cloudinary, and responsive dark/light themed UI.

## Tech Stack
- **Frontend:** React (Vite), JavaScript, CSS, Axios, Socket.IO Client
- **Backend:** Node.js, Express.js, Socket.IO, JWT, bcrypt, Nodemailer, Multer, Cloudinary
- **Database:** MongoDB + Mongoose

## Core Features
- Username/password login with JWT
- Signup with email OTP verification via Gmail SMTP
- Profile image upload to Cloudinary
- Username-based user search
- Chat request system (pending, accepted, rejected)
- Chat creation only after request acceptance
- Real-time messaging with Socket.IO and DB persistence
- Dark mode / Light mode toggle
- Responsive UI for mobile and desktop

## Folder Structure
```
zappy/
├── backend/
│   ├── config/
│   ├── controllers/
│   ├── middleware/
│   ├── models/
│   ├── routes/
│   ├── sockets/
│   ├── utils/
│   ├── server.js
│   ├── package.json
│   └── requirements.txt
├── frontend/
│   ├── src/
│   │   ├── api/
│   │   ├── components/
│   │   ├── context/
│   │   ├── pages/
│   │   ├── socket/
│   │   ├── styles/
│   │   └── main.jsx
│   ├── index.html
│   ├── package.json
│   └── requirements.txt
├── .env.example
└── README.md
```

## Installation Guide
### 1) Install Node.js
Install Node.js 18+ from https://nodejs.org

### 2) Clone repo
```bash
git clone <your-repo-url>
cd zappy
```

### 3) Install dependencies
```bash
cd backend && npm install
cd ../frontend && npm install
```

### 4) Setup environment variables
Create `backend/.env` and (optionally) `frontend/.env`.
Use values from `.env.example` and replace placeholders.

Example backend `.env`:
```env
PORT=5000
MONGO_URI=replace_with_your_mongodb_uri
JWT_SECRET=replace_with_random_secret
CLIENT_URL=http://localhost:5173
SMTP_EMAIL=replace_with_your_gmail
SMTP_PASSWORD=replace_with_gmail_app_password
CLOUDINARY_CLOUD_NAME=replace_here
CLOUDINARY_API_KEY=replace_here
CLOUDINARY_API_SECRET=replace_here
```

Example frontend `.env`:
```env
VITE_API_URL=http://localhost:5000/api
VITE_SOCKET_URL=http://localhost:5000
```

### Environment Variable Explanation
- `PORT`: Backend server port.
- `MONGO_URI`: MongoDB connection string.
- `JWT_SECRET`: Secret used to sign JWT tokens.
- `CLIENT_URL`: Frontend URL allowed for CORS.
- `SMTP_EMAIL`: Gmail address used to send OTP.
- `SMTP_PASSWORD`: Gmail App Password (not account password).
- `CLOUDINARY_CLOUD_NAME`: Cloudinary cloud name.
- `CLOUDINARY_API_KEY`: Cloudinary API key.
- `CLOUDINARY_API_SECRET`: Cloudinary API secret.
- `VITE_API_URL`: Frontend API base URL.
- `VITE_SOCKET_URL`: Frontend Socket.IO server URL.

## Running the App
### Start backend
```bash
cd backend
npm run dev
```

### Start frontend
```bash
cd frontend
npm run dev
```

## API Highlights
- `POST /api/auth/send-otp`
- `POST /api/auth/verify-otp`
- `POST /api/auth/signup`
- `POST /api/auth/login`
- `GET /api/users/search?q=<username>`
- `POST /api/chats/requests`
- `PATCH /api/chats/requests/:requestId`
- `GET /api/chats`
- `GET /api/messages/:chatId`

## Real-Time Flow
1. Sender emits `send_message` over Socket.IO.
2. Server validates + stores message in MongoDB.
3. Server emits `receive_message` to receiver instantly.
4. Sender also receives `message_sent` acknowledgement.

## Notes for Production
- Add robust input validation (e.g., Zod/Joi).
- Add rate limiting and helmet middleware.
- Add refresh token strategy and secure cookie handling.
- Configure HTTPS + reverse proxy.
- Use object storage and CDN policies for media files.
