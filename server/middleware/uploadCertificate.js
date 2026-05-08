import multer from 'multer';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Storage: save to uploads/certificates/
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, path.join(__dirname, '../../uploads/certificates/'));
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
        cb(null, 'cert-' + uniqueSuffix + path.extname(file.originalname));
    },
});

// Accept PDF and images
const fileFilter = (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|pdf/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const allowedMime = /image\/(jpeg|jpg|png)|application\/pdf/;
    const mimetype = allowedMime.test(file.mimetype);

    if (mimetype && extname) {
        return cb(null, true);
    } else {
        cb(new Error('Only PDF and images (jpeg, jpg, png) are allowed for certificates'));
    }
};

const uploadCertificate = multer({
    storage,
    limits: {
        fileSize: 10 * 1024 * 1024, // 10 MB max
    },
    fileFilter,
});

export default uploadCertificate;
