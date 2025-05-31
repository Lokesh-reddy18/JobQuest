import express from "express";
import {
  ChangeJobApplicationStatus,
  changeVisiblity,
  getCompanyData,
  getCompanyJobApplicants,
  getCompanyPostedJobs,
  loginCompany,
  postJob,
  registerCompany,
} from "../controller/comapanyController.js";
import upload from "../config/multer.js";
import { protectCompany } from "../middleware/authMiddleware.js";

const router = express.Router();

// Public routes (no auth required)
router.post("/login", loginCompany);
router.post("/register", upload.single("image"), registerCompany);

// Protected routes (JWT auth required)
router.get("/company", protectCompany, getCompanyData);
router.post("/post-job", protectCompany, postJob);
router.get("/applicants", protectCompany, getCompanyJobApplicants);
router.get("/list-jobs", protectCompany, getCompanyPostedJobs);
router.post("/change-status", protectCompany, ChangeJobApplicationStatus);
router.post("/change-visibility", protectCompany, changeVisiblity);

export default router;
