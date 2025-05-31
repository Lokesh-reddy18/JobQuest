import e from "express";
import User from "../models/User.js";
import JobApplication from "../models/JobApplication.js";
import Job from "../models/Job.js";
import { v2 } from "cloudinary";
import { uploadToCloudinary } from '../config/cloudinary.js';
import { clerkClient } from '@clerk/clerk-sdk-node';
import fs from 'fs';

// Get user Data
export const getUserData = async (req, res) => {
  try {
    const userId = req.auth.userId;
    console.log('User ID from request:', userId);

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'User ID is required'
      });
    }

    // Get user from database
    let user = await User.findOne({ _id: userId });

    // If user doesn't exist, create new user from Clerk data
    if (!user) {
      try {
        // Fetch user data from Clerk
        const clerkUser = await clerkClient.users.getUser(userId);
        console.log('Clerk user data:', clerkUser);

        if (!clerkUser) {
          return res.status(404).json({
            success: false,
            message: 'User not found in Clerk'
          });
        }

        // Extract user data from Clerk user
        const userData = {
          _id: userId,
          name: clerkUser.firstName && clerkUser.lastName 
            ? `${clerkUser.firstName} ${clerkUser.lastName}`
            : clerkUser.username || 'User',
          email: clerkUser.emailAddresses[0]?.emailAddress || '',
          image: clerkUser.imageUrl || 'https://res.cloudinary.com/dxq7q0yux/image/upload/v1710331234/default-avatar.png',
          resume: ''
        };

        // Validate required fields
        if (!userData.email) {
          return res.status(400).json({
            success: false,
            message: 'Email is required from Clerk user data'
          });
        }

        // Create new user with Clerk data
        user = await User.create(userData);
        console.log('Created new user:', user);
      } catch (clerkError) {
        console.error('Error fetching Clerk user:', clerkError);
        return res.status(500).json({
          success: false,
          message: 'Failed to fetch user data from Clerk: ' + clerkError.message
        });
      }
    }

    res.status(200).json({
      success: true,
      user
    });
  } catch (error) {
    console.error('Error in getUserData:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// Apply for a job
export const applyForJob = async (req, res) => {
  try {
    const userId = req.auth.userId;
    const { jobId } = req.params;

    console.log('Applying for job:', { userId, jobId });

    if (!userId || !jobId) {
      return res.status(400).json({
        success: false,
        message: 'User ID and Job ID are required'
      });
    }

    // Check if user exists
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Check if job exists
    const job = await Job.findById(jobId);
    if (!job) {
      return res.status(404).json({
        success: false,
        message: 'Job not found'
      });
    }

    // Check if user has already applied
    const existingApplication = await JobApplication.findOne({
      userId,
      jobId
    });

    if (existingApplication) {
      return res.status(400).json({
        success: false,
        message: 'You have already applied for this job'
      });
    }

    // Create new application with all required fields
    const newApplication = new JobApplication({
      userId,
      jobId,
      companyId: job.companyId,
      date: new Date(),
      status: 'pending'
    });

    await newApplication.save();
    console.log('Job application created successfully:', newApplication);

    res.status(200).json({
      success: true,
      message: 'Application submitted successfully',
      application: newApplication
    });
  } catch (error) {
    console.error('Error in applyForJob:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// Get User applied applications
export const getUserJobApplications = async (req, res) => {
  try {
    const userId = req.auth.userId;
    console.log('Fetching applications for user:', userId);

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'User ID is required'
      });
    }

    const applications = await JobApplication.find({ userId })
      .populate('jobId', 'title location category level salary description')
      .populate('companyId', 'name image')
      .sort({ date: -1 }); // Sort by date, newest first

    console.log('Found applications:', applications);

    res.status(200).json({
      success: true,
      applications
    });
  } catch (error) {
    console.error('Error in getUserJobApplications:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// Update User Profile (resume)
export const updateUserResume = async (req, res) => {
  try {
    const userId = req.auth.userId;
    console.log('Updating resume for user:', userId);

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'User ID is required'
      });
    }

    // Log the entire request object to debug
    console.log('Request object:', {
      file: req.file,
      body: req.body,
      headers: req.headers
    });

    if (!req.file) {
      console.log('No file uploaded');
      return res.status(400).json({
        success: false,
        message: 'Please upload a resume file'
      });
    }

    console.log('File details:', {
      mimetype: req.file.mimetype,
      size: req.file.size,
      path: req.file.path,
      originalname: req.file.originalname,
      fieldname: req.file.fieldname
    });

    // Check if file is a PDF
    if (!req.file.mimetype.includes('pdf')) {
      console.log('Invalid file type:', req.file.mimetype);
      // Delete the uploaded file
      fs.unlinkSync(req.file.path);
      return res.status(400).json({
        success: false,
        message: 'Please upload a PDF file'
      });
    }

    // Check if user exists
    const user = await User.findById(userId);
    if (!user) {
      console.log('User not found:', userId);
      // Delete the uploaded file
      fs.unlinkSync(req.file.path);
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    try {
      console.log('Uploading to Cloudinary...');
      // Upload resume to Cloudinary
      const result = await uploadToCloudinary(req.file.path, 'resumes');
      console.log('Cloudinary upload result:', result);

      if (!result || !result.secure_url) {
        throw new Error('Failed to get secure URL from Cloudinary');
      }

      // Update user's resume URL
      user.resume = result.secure_url;
      await user.save();
      console.log('User updated with new resume URL:', result.secure_url);

      // Delete the temporary file
      fs.unlinkSync(req.file.path);
      console.log('Temporary file deleted');

      res.status(200).json({
        success: true,
        message: 'Resume updated successfully',
        user
      });
    } catch (uploadError) {
      console.error('Error uploading to Cloudinary:', uploadError);
      // Delete the temporary file if upload fails
      if (req.file && req.file.path) {
        try {
          fs.unlinkSync(req.file.path);
          console.log('Temporary file deleted after upload error');
        } catch (unlinkError) {
          console.error('Error deleting temporary file:', unlinkError);
        }
      }
      return res.status(500).json({
        success: false,
        message: 'Failed to upload resume: ' + uploadError.message
      });
    }
  } catch (error) {
    console.error('Error in updateUserResume:', error);
    // Try to delete the file if it exists
    if (req.file && req.file.path) {
      try {
        fs.unlinkSync(req.file.path);
        console.log('Temporary file deleted after error');
      } catch (unlinkError) {
        console.error('Error deleting temporary file:', unlinkError);
      }
    }
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};