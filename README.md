# JobQuest - MERN Stack Job Portal

JobQuest is a modern, full-featured job portal web application built with the MERN stack (MongoDB, Express, React, Node.js). It allows job seekers to search and apply for jobs, and recruiters to post and manage job listings.

---

## 🌍 Live Demo

- **Frontend:** [https://job-quest-eight.vercel.app](https://job-quest-eight.vercel.app)
- **Backend API:** [https://jobquest-ifq1.onrender.com](https://jobquest-ifq1.onrender.com)

---

## 🚀 Features

- User authentication (job seekers & recruiters)
- Job search with filters (category, location, keyword)
- Job application and tracking
- Recruiter dashboard for posting and managing jobs
- Company profile management
- Responsive, modern UI (Tailwind CSS)
- Secure REST API

---

## 🛠️ Tech Stack

- **Frontend:** React, Vite, Tailwind CSS
- **Backend:** Node.js, Express.js
- **Database:** MongoDB
- **Authentication:** JWT, Clerk
- **Deployment:** Vercel (frontend), Render (backend)

---

## ⚡ Getting Started (Local Development)

### 1. Clone the repository
```bash
git clone https://github.com/Lokesh-reddy18/JobQuest.git
cd jobquest
```

### 2. Setup the backend
```bash
cd server
npm install
# Create a .env file (see .env.example)
npm start
```

### 3. Setup the frontend
```bash
cd ../client
npm install
npm run dev
```

### 4. Open in browser
Visit [http://localhost:5173](http://localhost:5173)

---

## 🌐 Deployment

- **Frontend:** Deploy `/client` to [Vercel](https://vercel.com/)
- **Backend:** Deploy `/server` to [Render](https://render.com/)
- Set environment variables on both platforms as needed

---

## 📝 Environment Variables

**Backend (.env):**
```
PORT=5000
MONGODB_URI=your_mongodb_uri
JWT_SECRET=your_jwt_secret
CLERK_SECRET_KEY=your_clerk_secret
CLIENT_URL=https://your-frontend.vercel.app
```

**Frontend (.env):**
```
VITE_BACKEND_URL=https://your-backend.onrender.com
```

---

## 🤝 Contributing

Pull requests are welcome! For major changes, please open an issue first to discuss what you would like to change.

---

## 📄 License

This project is licensed under the MIT License. See [LICENSE](./LICENSE) for details.
