import { Request, Response } from 'express';
import { S3Client, PutObjectCommand, GetObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';

dotenv.config();

const s3 = new S3Client({
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID || '',
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || '',
  },
});

const BUCKET_NAME = process.env.AWS_BUCKET_NAME || '';

// ✅ Upload file
export const uploadFile = async (req: Request, res: Response) => {
  const file = req.file;

  if (!file) return res.status(400).json({ error: 'No file uploaded' });

  const command = new PutObjectCommand({
    Bucket: BUCKET_NAME,
    Key: file.originalname,
    Body: file.buffer,
    ContentType: file.mimetype,
  });

  try {
    await s3.send(command);
    res.status(200).json({ message: 'Upload successful', key: file.originalname });
  } catch (error) {
    res.status(500).json({ error: 'Upload failed', details: error });
  }
};

// 📥 Download file
export const downloadFile = async (req: Request, res: Response) => {
  const { key } = req.params;

  const command = new GetObjectCommand({
    Bucket: BUCKET_NAME,
    Key: key,
  });

  try {
    const data = await s3.send(command);

    // @ts-ignore: TypeScript doesn't know `Body` is streamable
    data.Body.pipe(res);
  } catch (error) {
    res.status(500).json({ error: 'Download failed', details: error });
  }
};

// ❌ Delete file
export const deleteFile = async (req: Request, res: Response) => {
  const { key } = req.params;

  const command = new DeleteObjectCommand({
    Bucket: BUCKET_NAME,
    Key: key,
  });

  try {
    await s3.send(command);
    res.status(200).json({ message: 'File deleted', key });
  } catch (error) {
    res.status(500).json({ error: 'Delete failed', details: error });
  }
};
