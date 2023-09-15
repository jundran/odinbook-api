import express from 'express'
import morgan from 'morgan'
import cors from 'cors'
import indexRouter from './routes/indexRouter.js'
import AppError, { ErrorHandler } from './error.js'

export default function expressCallbacks (app) {
	// ENVIRONMENT
	const isProduction = process.env.NODE_ENV === 'production'
	if (isProduction) console.log('NODE_ENV:', process.env.NODE_ENV)

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
		if (req.path.startsWith('/api')) next(new AppError(501, 'API route does not exist'))
		else next(new AppError(404, 'Resource not found'))
	})

	// ERROR HANDLER
	app.use((err, req, res, next) => ErrorHandler(err, req, res, next))
}

// TODO - make separate commits for all things changed
