export default class AppError extends Error {
	constructor (status, message, error) {
		super()
		this.name = error?.name || 'AppError'
		this.status = status
		this.message = message
		if (error) this.originalError = error.message
	}
}
