import Company from "../models/Company.js";
import bcrypt from "bcrypt";
import { v2 as cloudinary } from "cloudinary";
import generateToken from "../utils/generateToken.js";
import Job from "../models/Job.js";
import JobApplication from "../models/JobApplication.js";
import fs from 'fs';

// Register a new Company
export const registerCompany = async (req, res) => {
  const { name, email, password } = req.body;
  const imageFile = req.file;

  if (!name || !email || !password || !imageFile) {
    return res.status(400).json({ 
      success: false, 
      message: "All fields are required" 
    });
  }

  try {
    const companyExists = await Company.findOne({ email });

    if (companyExists) {
      return res.status(400).json({ 
        success: false, 
        message: "Company Already Exists" 
      });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Upload image to Cloudinary
    const imageUpload = await cloudinary.uploader.upload(imageFile.path, {
      folder: 'company_logos',
      use_filename: true
    });

    // Delete the temporary file after upload
    fs.unlinkSync(imageFile.path);

    const company = await Company.create({
      name,
      email,
      password: hashedPassword,
      image: imageUpload.secure_url,
    });

    res.status(201).json({
      success: true,
      company: {
        _id: company._id,
        name: company.name,
        email: company.email,
        image: company.image,
      },
      token: generateToken(company._id),
    });
  } catch (error) {
    // If there's an error and we have a file, delete it
    if (imageFile && imageFile.path) {
      try {
        fs.unlinkSync(imageFile.path);
      } catch (unlinkError) {
        console.error('Error deleting temporary file:', unlinkError);
      }
    }
    
    console.error('Registration error:', error);
    res.status(500).json({ 
      success: false, 
      message: error.message || "Error registering company" 
    });
  }
};

// Company Login
export const loginCompany = async (req, res) => {
  const { email, password } = req.body;

  try {
    // Validate input
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: "Email and password are required"
      });
    }

    // Check if company exists
    const company = await Company.findOne({ email });
    if (!company) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password"
      });
    }

    // Check password
    const isPasswordValid = await bcrypt.compare(password, company.password);
    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password"
      });
    }

    // Generate token
    const token = generateToken(company._id);
    if (!token) {
      return res.status(500).json({
        success: false,
        message: "Error generating authentication token"
      });
    }

    // Send response
    res.status(200).json({
      success: true,
      company: {
        _id: company._id,
        name: company.name,
        email: company.email,
        image: company.image,
      },
      token
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ 
      success: false, 
      message: "Error during login. Please try again." 
    });
  }
};

// Get company data
export const getCompanyData = async (req, res) => {
  const company = req.company;

  try {
    res.json({ sucess: true, company });
  } catch (error) {
    res.json({
      success: false,
      message: error.message,
    });
  }
};

// Post a new Job
export const postJob = async (req, res) => {
  const { title, description, location, salary, level, category } = req.body;

  const companyId = req.company._id;

  try {
    const newJob = new Job({
      title,
      description,
      location,
      salary,
      companyId,
      date: Date.now(),
      level,
      category,
    });

    await newJob.save();

    res.json({ success: true, newJob });
  } catch (error) {
    res.json({ success: false, message: error.message });
  }
};
// Get Company Job Applicants
export const getCompanyJobApplicants = async (req, res) => {
  try {
    const companyId = req.company._id;

    // Find Job applications for the user
    const applications = await JobApplication.find({ companyId })
      .populate("userId", "name image email resume")
      .populate("jobId", "title  location category level salary")
      .exec();

    return res.json({ success: true, applications });
  } catch (error) {
    res.json({ success: false, message: error.message });
  }
};

// Get Company  Posted Jobs
export const getCompanyPostedJobs = async (req, res) => {
  try {
    const companyId = req.company._id;
    console.log("companyId:", companyId);

    const jobs = await Job.find({ companyId });
    console.log("jobs:", jobs);

    // adding No. of applicants
    const jobsData = await Promise.all(
      jobs.map(async (job) => {
        console.log("job:", job);
        const applicants = await JobApplication.find({ jobId: job._id });
        console.log("applicants:", applicants);
        return { ...job.toObject(), applicants: applicants.length };
      })
    );

    console.log("jobsData:", jobsData);

    // Adding No of appicants info in data
    res.json({ success: true, jobsData });
  } catch (error) {
    console.error("Error:", error);
    res.json({ success: false, message: error.message });
  }
};

// Change Job Application Status
export const ChangeJobApplicationStatus = async (req, res) => {
  
  try{
    const { id, status } = req.body;

  // Find Job Application and update Status

  await JobApplication.findOneAndUpdate(
    {_id: id,},
    {status}
  )
  res.json({success:true, message:"Status Changed"})
  }
  catch(error){
    res.json({success:false, message:error.message})
  }
  
  
};

// Change Job Visiblity
export const changeVisiblity = async (req, res) => {
  try {
    const { id } = req.body;

    const companyID = req.company._id;

    const job = await Job.findById(id);

    if (companyID.toString() === job.companyId.toString()) {
      job.visible = !job.visible;
    }
    await job.save();
    res.json({ success: true, job });
  } catch (error) {
    res.json({ success: false, message: error.message });
  }
};
