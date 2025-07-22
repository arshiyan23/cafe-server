import express from 'express';
import multer from 'multer';
import { uploadFile, downloadFile, deleteFile } from '../controllers/s3Controller';

const router = express.Router();
const upload = multer(); // In-memory storage

router.post('/upload', upload.single('file'), uploadFile);
router.get('/download/:key', downloadFile);
router.delete('/delete/:key', deleteFile);

export default router;
