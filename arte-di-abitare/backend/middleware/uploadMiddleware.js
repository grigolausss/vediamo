const multer = require('multer');
const path = require('path');
const fs = require('fs');

const uploadDir = 'arte-di-abitare/backend/public/uploads';

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

// Check file type function
function checkFileType(file, cb){
  // Allowed extensions
  const filetypes = /jpeg|jpg|png|gif|webp/;
  // Check extension
  const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
  // Check mime type
  const mimetype = filetypes.test(file.mimetype);

  if(mimetype && extname){
    return cb(null, true);
  } else {
    cb(new Error('Error: Images Only! Allowed types are jpeg, jpg, png, gif, webp.'), false);
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
