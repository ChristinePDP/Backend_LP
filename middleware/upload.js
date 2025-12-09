import { v2 as cloudinary } from 'cloudinary';
import { CloudinaryStorage } from 'multer-storage-cloudinary';
import multer from 'multer';
import 'dotenv/config';

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const amenitiesStorage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'la_piscina_amenities', 
    allowed_formats: ['jpg', 'png', 'jpeg', 'webp'],
  },
});

export const uploadAmenities = multer({ storage: amenitiesStorage });

const paymentStorage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'la_piscina_payments', 
    allowed_formats: ['jpg', 'png', 'jpeg'], 
  },
});

export const uploadPayment = multer({ storage: paymentStorage });