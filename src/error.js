export default class AppError extends Error {
	constructor (statusCode, message, error) {
		super()
		this.name = error?.name || 'AppError'
		this.statusCode = statusCode
		this.message = message
		if (error) this.originalError = error
	}
}

export const ErrorHandler = (err, req, res, next) => {
	if (err instanceof AppError) {
		// Error already created so just set status code an return response
		res.statusCode = err.statusCode
		res.json(err)
	} else {
		// Try to find error cause and return appropriate response
		handleDuplicateFieldError(err, res) ||
		handleValidationError(err, res) ||
		handleCastError(err, res) ||
		handleUnknownError(err, res)
	}
}

function returnHTTPErrorResponse (err, res, statusCode, message) {
	res.statusCode = statusCode
	res.json(new AppError(statusCode, message, err))
}

function handleDuplicateFieldError (err, res) {
	if (err?.code === 11000) {
		// At present, email is the only field that is required to be unique
		returnHTTPErrorResponse(err, res, 400, 'An account with that email already exists.')
		return true
	}
	return false
}

function handleValidationError (err, res) {
	if (err.name === 'ValidationError') {
		returnHTTPErrorResponse(err, res, 400, err.message)
		return true
	}
	return false
}

function handleCastError (err, res) {
	if (err.name === 'CastError') {
		returnHTTPErrorResponse(err, res, 404, 'Resource not found')
		return true
	}
	return false
}

function handleUnknownError (err, res) {
	const isProduction = process.env.NODE_ENV === 'production'
	console.error('EXPRESS ERROR:', isProduction ? `${err?.name}: ${err?.message}` : err)
	const statusCode = err.statusCode || err.statusCode || 500
	returnHTTPErrorResponse(err, res, statusCode, 'Something went wrong with your request')
}

// type mongooseValidationExample = {
// 	errors: {
// 		text: {
// 			name: 'ValidatorError',
// 			message: 'Path `text` is required.',
// 			properties: {
// 				message: 'Path `text` is required.',
// 				type: 'required',
// 				path: 'text'
// 			},
// 			kind: 'required',
// 			path: 'text'
// 		}
// 	},
// 	_message: 'Message validation failed',
// 	name: 'ValidationError',
// 	message: 'Message validation failed: text: Path `text` is required.'
// }
