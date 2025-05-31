import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import 'dotenv/config'
import connectDB from "./config/db.js";
import { clerkWebhooks } from './controller/webhooks.js';
import companyRoutes from './routes/companyRoutes.js'
import cloudinary from './config/cloudinary.js';
import JobRoutes from './routes/jobRoutes.js';
import userRoutes from './routes/userRoutes.js';
import { ClerkExpressRequireAuth } from '@clerk/clerk-sdk-node';
import path from 'path';
import { fileURLToPath } from 'url';
import { v2 as cloudinaryV2 } from 'cloudinary';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Initialize Express
const app = express();

// Connect to MongoDB
await connectDB();

// Initialize Cloudinary
cloudinaryV2.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

// CORS configuration
const allowedOrigins = [
  'https://job-quest-eight.vercel.app',
  'http://localhost:3000',
  'http://localhost:5173',
  process.env.CLIENT_URL
].filter(Boolean);

app.use(cors({
  origin: function(origin, callback) {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    
    if (allowedOrigins.indexOf(origin) === -1) {
      const msg = 'The CORS policy for this site does not allow access from the specified Origin.';
      return callback(new Error(msg), false);
    }
    return callback(null, true);
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'token']
}));

// Increase payload limit for file uploads
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// Public routes (no auth required)
app.use('/api/jobs', JobRoutes);

// Mount company routes directly
app.use('/api/company', companyRoutes);

// Clerk middleware for protected routes
const clerkMiddleware = ClerkExpressRequireAuth({
  secretKey: process.env.CLERK_SECRET_KEY,
  onError: (err, req, res) => {
    console.error('Clerk auth error:', err);
    if (err.message === 'Unauthenticated') {
      return res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
    }
    return res.status(500).json({
      success: false,
      message: 'Authentication error'
    });
  }
});

// Protected routes (Clerk auth required)
app.use('/api/users', clerkMiddleware, userRoutes);

// Webhook endpoint for Clerk
app.post('/api/webhooks/clerk', express.raw({ type: 'application/json' }), clerkWebhooks);

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Server error:', err);
  res.status(500).json({
    success: false,
    message: err.message || 'Something went wrong!'
  });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
