import { Router } from "express";
import { home } from "../controllers/homeController";
import storageRoutes from "./storageRoutes";
import s3Routes from "./s3Routes";

const router = Router();

// Home route
router.get("/", home);

// Storage API routes (folder and file management)
router.use("/api/storage", storageRoutes);

// S3 routes (if they exist)
router.use("/api/s3", s3Routes);

export default router;
