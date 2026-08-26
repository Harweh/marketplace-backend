import multer from "multer";

// Files are held in memory only long enough to stream to Cloudinary —
// nothing is written to disk on the server.
const storage = multer.memoryStorage();

export const upload = multer({
    storage,
    limits: { fileSize: 5 * 1024 * 1024 }, // 5MB per image
    fileFilter: (_req, file, cb) => {
        if (!file.mimetype.startsWith("image/")) {
        return cb(new Error("Only image files are allowed"));
        }
        cb(null, true);
    },
});