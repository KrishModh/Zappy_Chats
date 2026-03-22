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
<img width="2560" height="1440" alt="1" src="https://github.com/user-attachments/assets/e833a189-96d2-4017-91a3-a31ba7ce3e69" />
<img width="2560" height="1440" alt="2" src="https://github.com/user-attachments/assets/25f58d91-25c4-4c2a-9079-6512403981dd" />


---

### 💬 Chat Interface
<img width="2560" height="1440" alt="3" src="https://github.com/user-attachments/assets/503ff142-c4e2-43a5-a9bb-b58d47314246" />
<img width="2560" height="1440" alt="6" src="https://github.com/user-attachments/assets/698e5e3e-95f4-4dfe-8bac-abca19b7c837" />
<img width="2560" height="1440" alt="5" src="https://github.com/user-attachments/assets/1cd85925-d1a3-4aaf-b861-178d66f4afa6" />
<img width="2560" height="1440" alt="4" src="https://github.com/user-attachments/assets/363b877b-4f13-449f-9882-2b50a4cbc582" />

---

### 🖼️ Image Messaging
<img width="2560" height="1440" alt="4" src="https://github.com/user-attachments/assets/90d7fd11-ec47-4a2a-906a-2ce47cfe47d4" />
<img width="2560" height="1440" alt="5" src="https://github.com/user-attachments/assets/4283c901-f56f-4471-8110-e6bd9c7cdd6a" />
<img width="2560" height="1440" alt="14" src="https://github.com/user-attachments/assets/5e575c4e-db1e-4711-8c57-27d6d066cd2e" />

---

### 🔍 Search & Requests
<img width="2560" height="1440" alt="7" src="https://github.com/user-attachments/assets/fc5997b4-10aa-4ecf-a292-f137a3851293" />
<img width="2560" height="1440" alt="8" src="https://github.com/user-attachments/assets/f4c26a8d-d311-4aaa-899e-cfde7dbfc32c" />

---

### 👤 Profile & Settings
<img width="2560" height="1440" alt="9" src="https://github.com/user-attachments/assets/db5ac8e1-c47e-4f48-8f10-836637e6bc61" />
<img width="2560" height="1440" alt="10" src="https://github.com/user-attachments/assets/deaafab9-6f3c-460f-84be-b5ec48b0a93d" />
<img width="2560" height="1440" alt="11" src="https://github.com/user-attachments/assets/9e7586a9-2f57-476d-8d73-ee2a98fc0176" />
<img width="2560" height="1440" alt="12" src="https://github.com/user-attachments/assets/399cec1c-b834-48b5-bb3c-c8cca7652fc2" />

---

### 🌙 Dark Mode
<img width="2560" height="1440" alt="13" src="https://github.com/user-attachments/assets/aab52960-3d7b-414d-bd69-f72903604007" />
<img width="2560" height="1440" alt="15" src="https://github.com/user-attachments/assets/44f3c760-3c81-443d-9e2f-85e2e3fa5607" />

---

### ⚙️ Extra UI
![17](https://github.com/user-attachments/assets/126c17e8-654e-48b0-9f43-00e2724af825)

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
