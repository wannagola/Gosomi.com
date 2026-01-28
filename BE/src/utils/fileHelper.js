
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';

/**
 * Saves a base64 string as an image file.
 * @param {string} base64String - The base64 string (with or without data URI prefix).
 * @param {string} uploadDir - Directory to save the file.
 * @returns {string} - The relative path to the saved file.
 */
export const saveBase64Image = (base64String, uploadDir = 'uploads') => {
  if (!base64String) return null;

  // Ensure upload directory exists
  const targetDir = path.join(process.cwd(), uploadDir);
  if (!fs.existsSync(targetDir)) {
    fs.mkdirSync(targetDir, { recursive: true });
  }

  // Strip metadata prefix if present (e.g., "data:image/png;base64,")
  const matches = base64String.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
  let buffer;
  let extension = 'png'; // Default

  if (matches && matches.length === 3) {
    const mimeType = matches[1];
    buffer = Buffer.from(matches[2], 'base64');
    
    // Simple extension mapping
    if (mimeType === 'image/jpeg') extension = 'jpg';
    else if (mimeType === 'image/gif') extension = 'gif';
    else if (mimeType === 'image/webp') extension = 'webp';
  } else {
    // raw base64
    buffer = Buffer.from(base64String, 'base64');
  }

  // Generate unique filename
  const filename = `${crypto.randomBytes(16).toString('hex')}.${extension}`;
  const filepath = path.join(targetDir, filename);

  fs.writeFileSync(filepath, buffer);

  return `/uploads/${filename}`;
};
