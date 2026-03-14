const express = require('express');
const fs = require('fs');
const path = require('path');
const exifr = require('exifr');
const sharp = require('sharp');
const cors = require('cors');
const multer = require('multer');
const { getBirdInfo } = require('./birds');

// Prevent server crash from unhandled errors
process.on('uncaughtException', (err) => {
  console.error('Uncaught Exception:', err.message);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

const PHOTO_DIR = '/Volumes/扩展盘512G/bird_photo';//'/Users/zhouheng/Pictures';
const PORT = 3000;

// Configure multer for file uploads
const storage = multer.memoryStorage();
const upload = multer({ 
  storage,
  limits: { fileSize: 1024 * 1024 * 1024 }, // 1GB limit
  fileFilter: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    const allowed = ['.jpg', '.jpeg', '.png', '.webp', '.heic', '.heif', '.tiff', '.tif', '.dng', '.raw', '.cr2', '.nef', '.arw', '.avif'];
    if (allowed.includes(ext)) {
      cb(null, true);
    } else {
      cb(new Error('Unsupported format: ' + ext));
    }
  }
});

const app = express();
app.use(cors());
app.use(express.json({ limit: '500mb' }));
app.use(express.urlencoded({ extended: true, limit: '500mb' }));

// Ensure directory exists
function ensureDir(dir) {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

// Get date-based folder path
function getDateFolder(dateObj) {
  const year = dateObj.getFullYear();
  const month = String(dateObj.getMonth() + 1).padStart(2, '0');
  const day = String(dateObj.getDate()).padStart(2, '0');
  return `${year}/${year}-${month}-${day}`;
}

// ============= API ROUTES (defined first) =============

// Upload endpoint
app.post('/api/upload', upload.array('photos', 100), async (req, res) => {
  try {
    const results = [];
    const autoDate = req.body.autoDate !== 'false';
    
    for (const file of req.files) {
      try {
        let targetDir = PHOTO_DIR;
        let targetFileName = file.originalname;
        
        if (autoDate) {
          let photoDate = new Date();
          try {
            const tags = await exifr.parse(file.buffer, { pick: ['DateTimeOriginal', 'CreateDate', 'DateTimeDigitized'] });
            if (tags && (tags.DateTimeOriginal || tags.CreateDate || tags.DateTimeDigitized)) {
              photoDate = tags.DateTimeOriginal || tags.CreateDate || tags.DateTimeDigitized;
            }
          } catch (e) {}
          targetDir = path.join(PHOTO_DIR, getDateFolder(photoDate));
        }
        
        ensureDir(targetDir);
        
        const targetPath = path.join(targetDir, targetFileName);
        
        let finalPath = targetPath;
        let counter = 1;
        while (fs.existsSync(finalPath)) {
          const ext = path.extname(targetFileName);
          const base = path.basename(targetFileName, ext);
          finalPath = path.join(targetDir, `${base}_${counter}${ext}`);
          counter++;
        }
        
        fs.writeFileSync(finalPath, file.buffer);
        
        // Generate thumbnails asynchronously (WebP, AVIF, JPEG)
        const thumbDir = path.join(PHOTO_DIR, '.thumbnails');
        ensureDir(thumbDir);
        
        const baseName = path.basename(finalPath, path.extname(finalPath));
        
        // Generate JPEG thumbnail
        const jpgPath = path.join(thumbDir, baseName + '.jpg');
        try {
          await sharp(file.buffer)
            .resize(400, 400, { fit: 'inside' })
            .jpeg({ quality: 80 })
            .toFile(jpgPath);
        } catch (e) {
          console.log('JPEG thumbnail failed:', e.message);
        }
        
        // Generate WebP thumbnail
        const webpPath = path.join(thumbDir, baseName + '.webp');
        try {
          await sharp(file.buffer)
            .resize(400, 400, { fit: 'inside' })
            .webp({ quality: 80 })
            .toFile(webpPath);
        } catch (e) {
          console.log('WebP thumbnail failed:', e.message);
        }
        
        // Generate AVIF thumbnail (if supported)
        const avifPath = path.join(thumbDir, baseName + '.avif');
        try {
          await sharp(file.buffer)
            .resize(400, 400, { fit: 'inside' })
            .avif({ quality: 70 })
            .toFile(avifPath);
        } catch (e) {
          // AVIF may not be supported on all systems
        }
        
        results.push({
          success: true,
          name: path.basename(finalPath),
          path: `/photos/${finalPath.replace(PHOTO_DIR + '/', '')}`,
          size: file.size
        });
        
      } catch (err) {
        results.push({
          success: false,
          name: file.originalname,
          error: err.message
        });
      }
    }
    
    res.json({ results });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Paste upload endpoint
app.post('/api/upload-paste', async (req, res) => {
  try {
    const { image, filename, autoDate } = req.body;
    
    if (!image) {
      return res.status(400).json({ error: 'No image data' });
    }
    
    const base64Data = image.replace(/^data:image\/\w+;base64,/, '');
    const buffer = Buffer.from(base64Data, 'base64');
    
    let ext = '.jpg';
    if (image.includes('data:image/png')) ext = '.png';
    else if (image.includes('data:image/webp')) ext = '.webp';
    else if (image.includes('data:image/heic')) ext = '.heic';
    
    const name = filename || `pasted_${Date.now()}${ext}`;
    
    let targetDir = PHOTO_DIR;
    if (autoDate !== 'false') {
      targetDir = path.join(PHOTO_DIR, getDateFolder(new Date()));
    }
    
    ensureDir(targetDir);
    
    const targetPath = path.join(targetDir, name);
    
    let finalPath = targetPath;
    let counter = 1;
    while (fs.existsSync(finalPath)) {
      const base = path.basename(name, ext);
      finalPath = path.join(targetDir, `${base}_${counter}${ext}`);
      counter++;
    }
    
    fs.writeFileSync(finalPath, buffer);
    
    res.json({
      success: true,
      name: path.basename(finalPath),
      path: `/photos/${finalPath.replace(PHOTO_DIR + '/', '')}`,
      size: buffer.length
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get all photos recursively
app.get('/api/photos', async (req, res) => {
  try {
    const photos = [];
    
    function scanDir(dir) {
      const files = fs.readdirSync(dir);
      for (const file of files) {
        if (file === '.thumbnails' || file === '.superpicky' || file.startsWith('._')) continue;
        
        const filePath = path.join(dir, file);
        const stats = fs.statSync(filePath);
        
        if (stats.isDirectory()) {
          scanDir(filePath);
          continue;
        }
        
        const ext = path.extname(file).toLowerCase();
        if (!['.jpg', '.jpeg', '.png', '.webp', '.heic', '.tiff', '.tif', '.dng'].includes(ext)) continue;
        
        const relativePath = filePath.replace(PHOTO_DIR + '/', '');
        
        // Extract bird species from folder path
        const pathParts = relativePath.split('/');
        let birdSpecies = null;
        let starRating = 0;
        
        // Check if path contains bird species (e.g., "3星_优选/普通翠鸟/")
        for (let i = 0; i < pathParts.length - 1; i++) {
          const part = pathParts[i];
          if (part.includes('星')) {
            starRating = parseInt(part.charAt(0)) || 0;
          }
          const birdInfo = getBirdInfo(part);
          if (birdInfo) {
            birdSpecies = {
              chinese: part,
              scientific: birdInfo.scientific,
              english: birdInfo.english,
              family: birdInfo.family
            };
          }
        }
        
        photos.push({
          name: file,
          path: `/photos/${relativePath}`,
          size: stats.size,
          modified: stats.mtime,
          starRating: starRating,
          bird: birdSpecies,
          exif: {}
        });
      }
    }
    
    scanDir(PHOTO_DIR);
    
    for (const photo of photos) {
      try {
        const filePath = path.join(PHOTO_DIR, photo.path.replace('/photos/', ''));
        
        // Skip EXIF parsing for files that might cause issues
        let tags = null;
        try {
          tags = await exifr.parse(filePath, { silent: true, silentErrors: true });
        } catch (exifError) {
          // Ignore EXIF parsing errors
        }
        
        if (tags) {
          photo.exif = {
            make: tags.Make,
            model: tags.Model,
            dateTime: tags.DateTimeOriginal ? tags.DateTimeOriginal.toISOString() : null,
            exposureTime: tags.ExposureTime,
            fNumber: tags.FNumber,
            iso: tags.ISO,
            focalLength: tags.FocalLength,
            lens: tags.LensModel,
          };
        }
      } catch (e) {}
    }
    
    photos.sort((a, b) => {
      if (a.exif.dateTime && b.exif.dateTime) {
        return new Date(b.exif.dateTime) - new Date(a.exif.dateTime);
      }
      return b.modified - a.modified;
    });
    
    res.json(photos);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get filter options
app.get('/api/filters', async (req, res) => {
  try {
    const photosRes = await fetch('http://localhost:' + PORT + '/api/photos');
    const photos = await photosRes.json();
    
    const dates = {};
    const models = {};
    const lenses = {};
    
    for (const photo of photos) {
      if (photo.exif.dateTime) {
        const date = photo.exif.dateTime.substring(0, 10);
        dates[date] = (dates[date] || 0) + 1;
      }
      if (photo.exif.model) {
        models[photo.exif.model] = (models[photo.exif.model] || 0) + 1;
      }
      if (photo.exif.lens) {
        lenses[photo.exif.lens] = (lenses[photo.exif.lens] || 0) + 1;
      }
    }
    
    res.json({ dates, models, lenses });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get videos
app.get('/api/videos', async (req, res) => {
  try {
    const videos = [];
    const videoExtensions = ['.mp4', '.mov', '.avi', '.mkv', '.webm'];
    
    function scanForVideos(dir) {
      const files = fs.readdirSync(dir);
      for (const file of files) {
        if (file === '.thumbnails' || file === '.superpicky' || file.startsWith('._')) continue;
        
        const filePath = path.join(dir, file);
        const stats = fs.statSync(filePath);
        
        if (stats.isDirectory()) {
          scanForVideos(filePath);
          continue;
        }
        
        const ext = path.extname(file).toLowerCase();
        if (!videoExtensions.includes(ext)) continue;
        
        const relativePath = filePath.replace(PHOTO_DIR + '/', '');
        const pathParts = relativePath.split('/');
        let birdSpecies = null;
        
        // Extract bird species from folder path
        for (let i = 0; i < pathParts.length - 1; i++) {
          const part = pathParts[i];
          const birdInfo = getBirdInfo(part);
          if (birdInfo) {
            birdSpecies = {
              chinese: part,
              scientific: birdInfo.scientific,
              english: birdInfo.english,
              family: birdInfo.family
            };
          }
        }
        
        videos.push({
          name: file,
          path: `/videos/${relativePath}`,
          size: stats.size,
          modified: stats.mtime,
          bird: birdSpecies
        });
      }
    }
    
    scanForVideos(PHOTO_DIR);
    
    // Sort by date
    videos.sort((a, b) => new Date(b.modified) - new Date(a.modified));
    
    res.json(videos);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Serve videos statically
app.use('/videos', express.static(PHOTO_DIR));

// Get thumbnail
app.get('/api/thumbnail', async (req, res) => {
  try {
    const { name } = req.query;
    const filePath = path.join(PHOTO_DIR, name);
    
    const thumbDir = path.join(PHOTO_DIR, '.thumbnails');
    const baseName = path.basename(name, path.extname(name));
    
    // Check client-preferred format
    const accept = req.headers.accept || '';
    let preferredFormat = 'jpeg';
    
    if (accept.includes('image/webp')) preferredFormat = 'webp';
    else if (accept.includes('image/avif')) preferredFormat = 'avif';
    
    // Try to find cached thumbnail in preferred format
    const formatExts = preferredFormat === 'webp' ? ['.webp', '.jpg', '.avif'] :
                       preferredFormat === 'avif' ? ['.avif', '.webp', '.jpg'] :
                       ['.jpg', '.webp', '.avif'];
    
    let thumbPath = null;
    let contentType = 'image/jpeg';
    
    for (const ext of formatExts) {
      const tp = path.join(thumbDir, baseName + ext);
      if (fs.existsSync(tp)) {
        thumbPath = tp;
        contentType = ext === '.webp' ? 'image/webp' : 
                     ext === '.avif' ? 'image/avif' : 'image/jpeg';
        break;
      }
    }
    
    if (thumbPath) {
      res.set('Content-Type', contentType);
      return fs.createReadStream(thumbPath).pipe(res);
    }
    
    // Generate on demand if not exists
    if (!fs.existsSync(filePath)) {
      return res.status(404).send('File not found');
    }
    
    // Skip thumbnail generation for DNG files - serve original
    if (filePath.toLowerCase().endsWith('.dng')) {
      return res.sendFile(filePath);
    }
    
    const sharpInstance = sharp(filePath).resize(400, 400, { fit: 'inside' });
    if (preferredFormat === 'webp') {
      res.set('Content-Type', 'image/webp');
      return sharpInstance.webp({ quality: 80 }).pipe(res);
    } else if (preferredFormat === 'avif') {
      res.set('Content-Type', 'image/avif');
      return sharpInstance.avif({ quality: 70 }).pipe(res);
    } else {
      res.set('Content-Type', 'image/jpeg');
      return sharpInstance.jpeg({ quality: 80 }).pipe(res);
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Trigger SuperPicky AI analysis
app.post('/api/analyze', async (req, res) => {
  try {
    const { exec } = require('child_process');
    const scriptPath = path.join(__dirname, '../scripts/superpicky.scpt');
    
    // Run AppleScript
    exec(`osascript "${scriptPath}"`, { timeout: 300000 }, (err, stdout, stderr) => {
      if (err) {
        console.error('SuperPicky error:', err);
        res.json({ success: false, error: err.message });
      } else {
        console.log('SuperPicky output:', stdout);
        res.json({ success: true, message: 'Analysis complete!' });
      }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get all bird species
app.get('/api/birds', async (req, res) => {
  try {
    const birdCounts = {};
    
    // Scan photos to count bird species
    function scanForBirds(dir) {
      const files = fs.readdirSync(dir);
      for (const file of files) {
        if (file === '.thumbnails' || file === '.superpicky' || file.startsWith('._')) continue;
        
        const filePath = path.join(dir, file);
        const stats = fs.statSync(filePath);
        
        if (stats.isDirectory()) {
          const birdInfo = getBirdInfo(file);
          if (birdInfo) {
            if (!birdCounts[file]) {
              birdCounts[file] = {
                chinese: file,
                scientific: birdInfo.scientific,
                english: birdInfo.english,
                family: birdInfo.family,
                count: 0
              };
            }
          }
          scanForBirds(filePath);
        } else {
          // Count this file to the bird folder
          const pathParts = dir.replace(PHOTO_DIR + '/', '').split('/');
          for (const part of pathParts) {
            if (birdCounts[part]) {
              birdCounts[part].count++;
            }
          }
        }
      }
    }
    
    scanForBirds(PHOTO_DIR);
    
    res.json(Object.values(birdCounts).filter(b => b.count > 0).sort((a, b) => b.count - a.count));
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ============= STATIC FILES (defined after API routes) =============
app.use(express.static(path.join(__dirname, '../public')));
app.use('/photos', express.static(PHOTO_DIR));

app.listen(PORT, () => {
  console.log(`Photo gallery API running at http://localhost:${PORT}`);
  console.log(`Photos directory: ${PHOTO_DIR}`);
});
