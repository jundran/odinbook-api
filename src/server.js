import dotenv from 'dotenv'
import mongoose from 'mongoose'
import { createServer	} from 'http'
import express from 'express'
import { Server } from 'socket.io'
import expressCallbacks from './app.js'
import { socketCallbacks } from './socket.js'

// Load environment variables
dotenv.config()

// Create Express application
const app = express()

// Create the HTTP server, passing in the Express application
const httpServer = createServer(app)

// Start SocketIO, attaching the HTTP server
const io = new Server(httpServer, {
	cors: {
		origin: [
			'http://localhost:4173',
			'http://localhost:5173',
			'https://jundran.github.io'
		]
	}
})

// Connect to MongoDB - ensure Mongo is connected before listening on HTTP server
mongoose.connect(process.env.MONGO_DB_CONNECTION_STRING)
	.then(db => {
		console.log(`Connected to MongoDB on port ${db.connections[0].port}`)

		// Start listening for requests on HTTP server
		httpServer.listen(process.env.PORT || 5001, () => {
			const host = httpServer.address().address
			const port = httpServer.address().port
			console.log('HTTP server listening at http://%s:%s', host, port)
		})

		// Specify callbacks for Express and SocketIO
		expressCallbacks(app)
		socketCallbacks(io)
	})
	.catch(error => console.log(error))
