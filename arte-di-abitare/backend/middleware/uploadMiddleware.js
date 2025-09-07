const multer = require('multer');
const path = require('path');
const fs = require('fs');

// FIX: Use an absolute path to ensure files are always saved in the correct location,
// regardless of the current working directory.
const uploadDir = path.join(__dirname, '..', 'public', 'uploads');

// Ensure the upload directory exists
fs.mkdirSync(uploadDir, { recursive: true });

// Set storage engine
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadDir);
  },
  filename: function(req, file, cb){
    // Create a unique filename to avoid conflicts
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

// A more robust file type check focusing only on the mimetype
function checkFileType(file, cb){
  // Regular expression to match allowed image mimetypes, now including heic
  const filetypes = /jpeg|jpg|png|gif|webp|heic/;
  const isMimeTypeAllowed = filetypes.test(file.mimetype);

  if (isMimeTypeAllowed) {
    return cb(null, true);
  } else {
    console.error(`[Upload Middleware] File rejected. Mimetype: ${file.mimetype}, Original Name: ${file.originalname}`);
    cb(new Error('Errore: Solo file di tipo immagine sono ammessi (jpeg, png, gif, webp, heic).'), false);
  }
}

// Initialize upload middleware
const upload = multer({
  storage: storage,
  limits: { fileSize: 15 * 1024 * 1024 }, // Limit file size to 15MB
  fileFilter: function(req, file, cb){
    checkFileType(file, cb);
  }
}).fields([
    { name: 'dossierImage', maxCount: 1 },
    { name: 'planimetryImage', maxCount: 1 },
    { name: 'zoneImage', maxCount: 1 }
]);

module.exports = upload;
