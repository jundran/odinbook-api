import jwt from 'jsonwebtoken'

let connectedClients = []
let io = null

export function socketCallbacks (server) {
	io = server
	io.on('connection', socket => { // Called when any client connects
		let userId
		jwt.verify(socket.handshake.auth.token, process.env.ACCESS_TOKEN_SECRET, (err, tokenObject) => {
			if (err) return console.error('TOKEN ERROR', err)
			userId = tokenObject.user.id

			// Remove any duplicates - redundant check
			connectedClients = connectedClients.filter(client => client.userId !== userId)

			// Add client with new socket id
			connectedClients.unshift({
				userId: tokenObject.user.id,
				socketId: socket.id
			})
			console.log(`CONNECT: userId:[${userId}], socketId:[${socket.id}]`)
		})

		// Send a welcome message
		socket.emit('message', 'Connected to socketIO server with id '
			+ connectedClients[0].socketId)

		// Listen for messages
		socket.on('message', value => console.log(value))

		// Handle client disconnection
		socket.on('disconnect', () => {
			console.log(`DISCONNECT: userId:[${userId}], socketId:[${socket.id}]`)
			connectedClients = connectedClients.filter(client => client.socketId !== socket.id)
		})
	})
}

function getUserSocketId (userId) {
	const user = connectedClients.find(client => client.userId === userId)
	return user?.socketId
}

export function notifyUser (updatedUserDocument) {
	const socketId = getUserSocketId(updatedUserDocument.id)
	if (socketId) {
		const hadListener = io.to(socketId).emit('userUpdate', updatedUserDocument)
		if (hadListener) console.log(`Sent update to ${updatedUserDocument.fullname} `)
	}
}
