# 🚀 Zappy — Secure Real-Time Chat Application

> 💬 The new way to connect — fast, secure, and real-time.

Zappy is a modern full-stack real-time chat application designed with **security-first architecture** and a **WhatsApp-inspired UI**.  
It enables users to connect, send requests, and chat securely with features like OTP authentication, real-time messaging, and advanced user controls.

---

## 🔥 Live Preview

🌐 **Website URL :** https://zappy-nine.vercel.app/

---

## 📸 Screenshots

### 🔐 Authentication (Login / Signup)
![Login](./screenshots/1.png)
![Signup](./screenshots/2.png)

---

### 💬 Chat Interface
![Chat UI](./screenshots/3.png)
![Chat UI](./screenshots/4.png)
![Chat UI](./screenshots/5.png)
![Chat UI](./screenshots/6.png)

---

### 🖼️ Image Messaging
![Image Send](./screenshots/7.png)
![Image Preview](./screenshots/8.png)

---

### 🔍 Search & Requests
![Search](./screenshots/9.png)
![Request](./screenshots/10.png)

---

### 👤 Profile & Settings
![Profile](./screenshots/11.png)
![Change Password](./screenshots/12.png)
![Appearance](./screenshots/13.png)

---

### 🌙 Dark Mode
![Dark Mode](./screenshots/14.png)
![Dark Mode Chat](./screenshots/15.png)

---

### ⚙️ Extra UI
![Extra](./screenshots/16.png)

---

## 🧠 Concept (How It Works)

Zappy works on a **secure request-based chat system**:

1. 🔍 Search user by username  
2. 📩 Send chat request  
3. ✅ Accept request  
4. 💬 Start secure real-time chat  

---

## ⚡ Features (Phase 1)

### 💬 Chat System
- Real-time messaging using **Socket.IO**
- Typing indicators
- Online/offline status
- Last seen tracking

### ✏️ Message Control
- Edit messages
- Delete messages
- Duplicate prevention using `clientMessageId`

### 🖼️ Media Support
- Image sending
- Image preview & download
- Cloudinary integration

### 👤 User System
- Profile update (name, avatar, DOB, etc.)
- View other users' profiles
- Remove friend option

### 🔐 Authentication & Security
- OTP-based signup (Gmail SMTP)
- JWT authentication (HTTP-only cookies)
- Password change & reset
- Rate limiting (anti-bruteforce)
- Input validation & sanitization

### 🎨 UI/UX
- WhatsApp-like design
- Fully responsive
- Dark / Light mode
- Smooth UX transitions

---

## 🛡️ Security Highlights (AppSec Focus)

- 🔒 JWT stored in **HTTP-only cookies** (XSS protection)
- 🚫 MongoDB injection prevention (`mongo-sanitize`)
- ⚡ Rate limiting on auth routes
- 🧹 Input sanitization (XSS prevention)
- 📁 Secure file upload validation
- 📊 Structured logging with Winston

---

## 🧱 Tech Stack

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
- MongoDB + Mongoose
- JWT Authentication
- Nodemailer (OTP)
- Cloudinary (Images)

---

## ⚙️ Installation & Setup

### 1️⃣ Clone Repository
```bash
git clone https://github.com/KrishModh/Zappy_Chats.git
cd Zappy_Chats
```

### 2️⃣ Install Dependencies
```bash
cd backend
npm install

cd ../frontend
npm install
```

### 3️⃣ Setup Environment Variables

Create `.env` files in both frontend & backend

#### Backend `.env`
```env
PORT=5000
MONGO_URI=your_mongodb_uri
JWT_SECRET=your_secret
SMTP_EMAIL=your_email
SMTP_PASSWORD=your_password
CLOUDINARY_CLOUD_NAME=your_cloud
CLOUDINARY_API_KEY=your_key
CLOUDINARY_API_SECRET=your_secret
```

#### Frontend `.env`
```env
VITE_API_URL=http://localhost:5000/api
VITE_SOCKET_URL=http://localhost:5000
```

---

### 4️⃣ Run Project
```bash
cd backend
npm start

cd frontend
npm run dev
```

---

## 🔄 API Flow (How Methods Work)

### 🔐 Authentication Flow
- `POST /send-otp` → sends OTP via email  
- `POST /verify-otp` → verifies OTP  
- `POST /signup` → creates account  
- `POST /login` → login user  
- `POST /refresh` → refresh token  

---

### 💬 Chat Flow
- `POST /chats/request` → send request  
- `PATCH /chats/request/:id` → accept/reject  
- `GET /chats` → fetch chats  
- `GET /messages/:chatId` → get messages  
- `POST /messages` → send message  

---

### 👤 User Flow
- `GET /users/search` → search user  
- `PUT /users/update-profile` → update profile  
- `POST /change-password` → update password  

---

## 🚀 Future Scope (Phase 2)

- 📞 Voice & Video Calling  
- 👥 Group Chats  
- 🔔 Push Notifications  
- 🔍 Advanced Search  

---

## 💼 Why This Project Stands Out

- 🔥 Production-level architecture  
- 🛡️ Strong security implementation  
- ⚡ Real-time system design  
- 🎨 Clean UI/UX  
- 📦 Full-stack integration  

---

## 👨‍💻 Author

**Krish Modh**  
B.Tech CSE | Full Stack Developer | AppSec Enthusiast  

---

## 🔗 Connect With Me

- 💼 LinkedIn: https://www.linkedin.com/in/krish-modh-b38447300/ 
- 🌐 Portfolio: https://krish-modh-portfolio.vercel.app/ 

---

## ⭐ Repository

👉 GitHub: https://github.com/KrishModh/Zappy_Chats.git  

---

## ❤️ Support

If you like this project, consider giving it a ⭐ on GitHub!