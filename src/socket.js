import jwt from 'jsonwebtoken'
import User from './models/userModel.js'

const connectedClients = []
let io = null

function getClientIndex (userId) {
	return connectedClients.findIndex(client => client.userId === userId)
}

export function socketCallbacks (server) {
	io = server
	io.on('connection', socket => { // Called when any client connects
		let userId
		jwt.verify(socket.handshake.auth.token, process.env.ACCESS_TOKEN_SECRET, (err, tokenObject) => {
			if (err) {
				socket.emit('message', 'Unauthenticated: invalid token.')
				socket.disconnect()
				return console.error('TOKEN ERROR', err)
			}
			userId = tokenObject.user.id

			// Update or add client with new socket id
			let index = getClientIndex(userId)
			if (index > -1) { // Client is already in array
				connectedClients[index].socketId = socket.id
			} else {
				connectedClients.unshift({ // Adding new client to array
					userId: tokenObject.user.id,
					socketId: socket.id,
					isOnline: true,
					offlineSince: 0
				})
				index = 0
			}
			console.log(`CONNECT: userId:[${userId}], socketId:[${socket.id}]`)
			notifyFriendsOfUserStatusChange(index, true)
		})

		// Send a welcome message
		socket.emit('message', 'Connected to socketIO server with id '
			+ connectedClients[0].socketId)

		// Listen for messages
		socket.on('message', message => console.log(message))

		// Handle client disconnection
		socket.on('disconnect', () => {
			console.log(`DISCONNECT: userId:[${userId}], socketId:[${socket.id}]`)
			const index = getClientIndex(userId)
			connectedClients[index].socketId = null
			connectedClients[index].offlineSince = Date.now()
			notifyFriendsOfUserStatusChange(index, false)
		})
	})
}

function notifyFriendsOfUserStatusChange (arrayIndex, isOnline) {
	// If client page is refreshed then this will quickly disconnect and reconnect the user
	if (isOnline) { // Coming online
		const offlineFor = Date.now() - connectedClients[arrayIndex].offlineSince
		if (offlineFor > 1000) {
			sendUpdate(connectedClients[arrayIndex].userId, isOnline)
		}
	} else { // Going offline
		setTimeout(() => {
			// Match passed in status with actual status after 1 second to see if it changed
			if (isOnline === (connectedClients[arrayIndex].socketId ? true : false)) {
				sendUpdate(connectedClients[arrayIndex].userId, isOnline)
			}
		}, 1000)
	}
}

async function sendUpdate (userId, isOnline) {
	const user = await User.findById(userId).select('friends')
	for (const friend of user.friends) {
		const onlineFriendSocketId = getUserSocketId(friend._id.toString())
		if (onlineFriendSocketId) {
			io.to(onlineFriendSocketId).emit('friendStatusUpdate', {
				id: userId,
				isOnline
			})
		}
	}
}

export function getUserSocketId (userId) {
	const user = connectedClients.find(client => client.userId === userId)
	return user?.socketId // Returns undefined if user is offline
}

export function notifyUser (updatedUserDocument) {
	const socketId = getUserSocketId(updatedUserDocument.id)
	if (socketId) {
		const hadListener = io.to(socketId).emit('userUpdate', updatedUserDocument)
		if (hadListener) console.log(`Sent update to ${updatedUserDocument.fullname} `)
	}
}
