import AppError from './error.js'

export default function asyncHandler (fn) {
	return (req, res, next) =>
		Promise.resolve(fn(req, res, next)).catch(err => {
			if (err?.code === 11000) {
				return next(new AppError(400, 'An account with this email already exists'))
			} else {
				console.log('Error caught by asyncHandler')
			}
			next(err)
		})
}
