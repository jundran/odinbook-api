import express from 'express'
import morgan from 'morgan'
import cors from 'cors'
import indexRouter from './routes/indexRouter.js'
import AppError from './error.js'

export default function expressCallbacks (app) {
	// ENVIRONMENT
	const production = process.env.NODE_ENV === 'production'
	if (production) console.log('NODE_ENV:', process.env.NODE_ENV)

	// EXPRESS SETUP
	app.use(morgan('dev'))
	app.use(cors({
		credentials: true,
		origin: [
			'http://localhost:4173',
			'http://localhost:5173',
			'https://jundran.github.io'
		]
	}))
	app.use(express.static('public'))
	app.use(express.json())

	// ROUTES
	app.get('/health-check', (req, res) => res.sendStatus(200))
	app.use('/api/v1', indexRouter)

	// CATCH 404
	app.use((req, res, next) => {
		next(new AppError(501, 'API route does not exist'))
	})

	// ERROR HANDLER
	app.use(async (err, req, res, next) => {
		// Internally created error
		if (err instanceof AppError) {
			console.error('APP ERROR', err)
			res.status(err.status)
			res.json(err)
		}
		// Handle badly formatted id - will not be caught as a 404 but treat as such
		else if (err.name === 'CastError') {
			res.status(404)
			res.json(new AppError(404, 'Resource not found', err))
		}
		// Mongoose or Express error
		else {
			console.error('EXPRESS ERROR:', production ? `${err?.name}: ${err?.message}` : err)
			const code = err.status || err.statusCode || 500
			res.status(code)
			res.json(new AppError(code, 'Something went wrong with your request', err))
		}
	})
}
