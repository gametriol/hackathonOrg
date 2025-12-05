import cloudinary from "./cloudinary.js";
import multer from "multer";
import streamifier from "streamifier";
import { supabase } from "./supabase.js";

const upload = multer(); // memory storage

// export const uploadToCloudinary = (fileBuffer, folder) => {
//   return new Promise((resolve, reject) => {
//     const uploadStream = cloudinary.uploader.upload_stream(
//       {
//         folder,
//         upload_preset: process.env.CLOUD_PRESET,   // ⭐ FROM ENV NOW
//         resource_type: "raw",
//       },
//       (error, result) => {
//         if (error) reject(error);
//         else resolve(result);
//       }
//     );

//     streamifier.createReadStream(fileBuffer).pipe(uploadStream);
//   });
// };

export const uploadToSupabase = async (fileBuffer, bucket, originalName, mimeType) => {
  if (!supabase) throw new Error('Supabase client not configured');


  const now = Date.now();
  let filename = `file_${now}`;
  if (originalName) {
 
    const parts = originalName.split('.');
    if (parts.length > 1) {
      const ext = parts.pop();
      const name = parts.join('.').replace(/[^a-zA-Z0-9-_]/g, '_').substring(0, 150);
      filename = `${name}_${now}.${ext}`;
    } else {
      filename = `${originalName.replace(/[^a-zA-Z0-9-_]/g, '_')}_${now}`;
    }
  }

  const path = filename;


  const { data, error } = await supabase.storage.from(bucket).upload(path, fileBuffer, {
    contentType: mimeType || undefined,
    upsert: false,
  });

  if (error) throw error;

 
  // Return permanent public URL for public buckets (no signed-url fallback)
  const pub = await supabase.storage.from(bucket).getPublicUrl(path);
  const publicURL = pub?.publicURL || pub?.data?.publicUrl || pub?.data?.publicURL;

  if (!publicURL) {
    throw new Error('No public URL available. Ensure the Supabase bucket is set to public.');
  }

  return {
    path: data?.path,
    publicURL,
    key: path,
  };
};

export default upload;
