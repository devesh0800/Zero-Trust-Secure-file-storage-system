import fs from 'fs/promises';
import path from 'path';
import config from '../config/config.js';
import { createClient } from '@supabase/supabase-js';

// Initialize Supabase if credentials exist
let supabase = null;
if (config.storage.type === 'supabase' && config.storage.supabaseUrl && config.storage.supabaseKey) {
  supabase = createClient(config.storage.supabaseUrl, config.storage.supabaseKey);
}

/**
 * Upload a file (buffer) to the configured storage provider
 * @param {Buffer} buffer - The file content
 * @param {string} filename - Unique filename for storage
 * @returns {Promise<string>} - Local path or Cloud URL
 */
export async function upload(buffer, filename) {
  if (config.storage.type === 'supabase' && supabase) {
    const { data, error } = await supabase.storage
      .from(config.storage.bucket)
      .upload(filename, buffer, {
        contentType: 'application/octet-stream',
        cacheControl: '3600',
        upsert: false
      });

    if (error) throw new Error(`Supabase Upload Error: ${error.message}`);
    return data.path;
  } else {
    // Fallback to local storage (Default)
    const uploadDir = config.upload.uploadDir;
    // Ensure directory exists
    try {
      await fs.access(uploadDir);
    } catch {
      await fs.mkdir(uploadDir, { recursive: true });
    }
    
    const storedPath = path.join(uploadDir, filename);
    await fs.writeFile(storedPath, buffer);
    return storedPath;
  }
}

/**
 * Download a file from the configured storage provider
 * @param {string} filename - The stored filename
 * @returns {Promise<Buffer>} - The file content
 */
export async function download(filename) {
  if (config.storage.type === 'supabase' && supabase) {
    const { data, error } = await supabase.storage
      .from(config.storage.bucket)
      .download(filename);

    if (error) throw new Error(`Supabase Download Error: ${error.message}`);
    
    // Convert Blob to Buffer
    const arrayBuffer = await data.arrayBuffer();
    return Buffer.from(arrayBuffer);
  } else {
    // Fallback to local storage
    const storedPath = path.join(config.upload.uploadDir, filename);
    return await fs.readFile(storedPath);
  }
}

/**
 * Delete a file from the configured storage provider
 * @param {string} filename - The stored filename
 */
export async function remove(filename) {
  if (config.storage.type === 'supabase' && supabase) {
    const { error } = await supabase.storage
      .from(config.storage.bucket)
      .remove([filename]);

    if (error) console.error(`Supabase Delete Error: ${error.message}`);
  } else {
    // Fallback to local storage
    const storedPath = path.join(config.upload.uploadDir, filename);
    try {
      await fs.unlink(storedPath);
    } catch (err) {
      console.error('Local Delete Error:', err.message);
    }
  }
}

export default {
  upload,
  download,
  remove
};
