# Zappy

Zappy is a secure full-stack real-time chat application built with React, Vite, Node.js, Express, MongoDB, Mongoose, Socket.IO, Gmail SMTP OTP verification, JWT cookie sessions, and Cloudinary image uploads.

## Project Overview

Zappy now ships with a WhatsApp-inspired interface, stronger backend security, better mobile UX, and cleaner separation between controllers, services, middleware, and routes.

### Highlights
- OTP-based signup with Gmail SMTP.
- Login with username and password.
- Access + refresh token authentication using **HTTP-only cookies**.
- Secure image uploads for avatars and image messages.
- Chat requests in the navbar with badge counts.
- Responsive WhatsApp-like split layout on desktop and full-screen chat on mobile.
- Real-time messaging, typing indicators, and online/offline presence.
- Dark mode and light mode with persisted user preference.

## Tech Stack

### Frontend
- React (Vite)
- JavaScript
- CSS
- Axios
- Socket.IO Client

### Backend
- Node.js
- Express.js
- Socket.IO
- Helmet
- express-rate-limit
- express-validator
- morgan
- winston
- bcrypt
- jsonwebtoken
- nodemailer
- multer
- cloudinary

### Database
- MongoDB
- Mongoose

## Folder Structure

```text
zappy/
├── backend/
│   ├── config/
│   ├── controllers/
│   ├── middleware/
│   ├── models/
│   ├── routes/
│   ├── services/
│   ├── sockets/
│   ├── utils/
│   ├── validators/
│   ├── package.json
│   ├── requirements.txt
│   └── server.js
├── frontend/
│   ├── src/
│   │   ├── api/
│   │   ├── components/
│   │   ├── context/
│   │   ├── hooks/
│   │   ├── pages/
│   │   ├── socket/
│   │   ├── styles/
│   │   ├── utils/
│   │   ├── App.jsx
│   │   └── main.jsx
│   ├── index.html
│   ├── package.json
│   └── requirements.txt
├── .env.example
└── README.md
```

## Installation Guide

### 1. Install Node.js
Install Node.js 18 or newer from [https://nodejs.org](https://nodejs.org).

### 2. Clone the repository
```bash
git clone <your-repo-url>
cd zappy
```

### 3. Install dependencies
```bash
cd backend
npm install

cd ../frontend
npm install
```

### 4. Configure environment variables
Create `backend/.env` and `frontend/.env` using `.env.example` as a reference.

#### Example backend `.env`
```env
NODE_ENV=development
PORT=5000
MONGO_URI=replace_with_your_mongodb_uri
JWT_SECRET=replace_with_random_secret
JWT_REFRESH_SECRET=replace_with_a_different_random_secret
CLIENT_URLS=http://localhost:5173
BCRYPT_SALT_ROUNDS=12
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX=250
AUTH_RATE_LIMIT_WINDOW_MS=900000
AUTH_RATE_LIMIT_MAX=20
ACCESS_TOKEN_MAX_AGE_MS=900000
REFRESH_TOKEN_MAX_AGE_MS=604800000
MAX_UPLOAD_SIZE_BYTES=3145728
LOG_LEVEL=debug
SMTP_EMAIL=replace_with_your_gmail
SMTP_PASSWORD=replace_with_gmail_app_password
CLOUDINARY_CLOUD_NAME=replace_here
CLOUDINARY_API_KEY=replace_here
CLOUDINARY_API_SECRET=replace_here
```

#### Example frontend `.env`
```env
VITE_API_URL=http://localhost:5000/api
VITE_SOCKET_URL=http://localhost:5000
```

## Environment Variable Explanation
- `NODE_ENV`: Application mode (`development` or `production`).
- `PORT`: Express server port.
- `MONGO_URI`: MongoDB connection string.
- `JWT_SECRET`: Secret used for short-lived access tokens.
- `JWT_REFRESH_SECRET`: Secret used for refresh tokens.
- `CLIENT_URLS`: Comma-separated list of allowed frontend origins for CORS.
- `BCRYPT_SALT_ROUNDS`: Password hashing cost factor. Keep this at 10 or higher.
- `RATE_LIMIT_WINDOW_MS`: General API throttling window.
- `RATE_LIMIT_MAX`: Maximum requests per general window.
- `AUTH_RATE_LIMIT_WINDOW_MS`: Auth-specific throttling window.
- `AUTH_RATE_LIMIT_MAX`: Maximum login/signup/OTP attempts per window.
- `ACCESS_TOKEN_MAX_AGE_MS`: Lifetime of the access token cookie.
- `REFRESH_TOKEN_MAX_AGE_MS`: Lifetime of the refresh token cookie.
- `MAX_UPLOAD_SIZE_BYTES`: Max upload size in bytes.
- `LOG_LEVEL`: Winston log level.
- `SMTP_EMAIL`: Gmail address used to send OTP emails.
- `SMTP_PASSWORD`: Gmail App Password.
- `CLOUDINARY_CLOUD_NAME`: Cloudinary cloud name.
- `CLOUDINARY_API_KEY`: Cloudinary API key.
- `CLOUDINARY_API_SECRET`: Cloudinary API secret.
- `VITE_API_URL`: Frontend API URL.
- `VITE_SOCKET_URL`: Frontend Socket.IO URL.

## Running the App

### Start the backend
```bash
cd backend
npm run dev
```

### Start the frontend
```bash
cd frontend
npm run dev
```

## Security Features

### JWT Cookies
Zappy stores access and refresh tokens in **HTTP-only cookies**, not in `localStorage`, which reduces the XSS risk window for session theft.

### Rate Limiting
- General API rate limits help reduce abuse.
- Authentication endpoints have stricter rate limits to slow brute-force attacks.

### Input Validation
All major auth, chat request, and messaging routes validate request data with `express-validator` before hitting business logic.

### Input Sanitization
- MongoDB operator injection is blocked using `express-mongo-sanitize`.
- Request body strings are sanitized to strip dangerous angle brackets.

### File Upload Security
- Only image MIME types and image extensions are accepted.
- Upload size is capped.
- Empty or obviously invalid uploads are rejected before Cloudinary upload.

### Error Handling and Logging
- Centralized error handling prevents raw internal error leakage.
- `morgan` improves local development visibility.
- `winston` provides structured production-friendly logs.

## UI Changes

### WhatsApp-like Layout
- Desktop uses a two-panel interface with a chat list sidebar and a conversation stage.
- Chat rows show avatar, name, last message preview, and timestamp.
- The active chat highlights clearly.

### Mobile Responsive System
- Mobile view collapses into a chat-list screen and a full-screen chat window.
- A dedicated back button is shown inside the chat header.

### Navbar Improvements
- Zappy logo.
- Search bar with debounce, live dropdown results, and inline request actions.
- Chat requests dropdown with red badge counter.
- Theme toggle.
- Profile menu.

## Real-Time Features
- Message send -> Socket.IO -> backend save -> room emit.
- Typing indicators.
- Online/offline presence updates.
- Last seen text.
- Duplicate message prevention via `clientMessageId`.
- Socket reconnect logic on the frontend.

## Core Features
- Username/password login.
- OTP signup flow.
- Cloudinary profile pictures.
- Cloudinary image messages.
- Username search.
- Chat request accept/reject flow.
- Protected chat-only messaging.
- Dark and light mode toggle.

## Deployment Guide

### Backend production build steps
1. Provision MongoDB, Cloudinary, and Gmail App Password credentials.
2. Set `NODE_ENV=production`.
3. Configure secure HTTPS and trusted proxy on your deployment platform.
4. Add production values for `CLIENT_URLS`, `JWT_SECRET`, and `JWT_REFRESH_SECRET`.
5. Run:
   ```bash
   cd backend
   npm install
   npm start
   ```

### Frontend production build steps
1. Configure `frontend/.env` with production backend URLs.
2. Build static assets:
   ```bash
   cd frontend
   npm install
   npm run build
   ```
3. Deploy the generated `dist/` folder to your preferred static host.

## API Overview
- `POST /api/auth/send-otp`
- `POST /api/auth/verify-otp`
- `POST /api/auth/signup`
- `POST /api/auth/login`
- `POST /api/auth/refresh`
- `POST /api/auth/logout`
- `GET /api/auth/me`
- `GET /api/users/search?query=username`
- `POST /api/chats/requests`
- `GET /api/chats/requests/received`
- `PATCH /api/chats/requests/:requestId`
- `GET /api/chats`
- `GET /api/messages/:chatId`
- `POST /api/messages`

## Notes
- For stronger production hardening, consider adding CSRF protection, automated tests, and a dedicated malware scanner for uploaded files.
- Gmail SMTP requires an App Password when 2FA is enabled.
