import multer from 'multer'
import AppError from './error.js'
const storage = multer.diskStorage({
	destination: function (req, file, cb) {
		cb(null, 'public/images')
	},
	filename: function (req, file, cb) {
		// Ensure filename is unique to make client aware that user document has changed
		const filename = `${req.user.id}-${Date.now()}-${file.originalname}`
		cb(null, filename)
	}
})

function fileFilter (req, file, cb) {
	if (!file.mimetype.startsWith('image/')) {
		cb(new AppError(400, 'File is not of type image. File rejected.'))
	} else {
		cb(null, true) // Accept file
	}
}

export const upload = multer({ storage, fileFilter })
