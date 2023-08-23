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
				connectedClients[index].socketIds.push(socket.id)
			} else {
				connectedClients.unshift({ // Adding new client to array
					userId: tokenObject.user.id,
					socketIds: [socket.id],
					offlineSince: 0
				})
				index = 0
			}
			console.log(`CONNECT: userId:[${userId}], socketId:[${socket.id}]`)
			// Length will be one if user has no other connected clients so register as coming online
			if (connectedClients[index].socketIds.length === 1) {
				notifyFriendsOfUserStatusChange(index, true)
			}
		})

		// Send a welcome message
		socket.emit('message', 'Connected to socketIO server with id '
			+ socket.id)

		// Listen for messages
		socket.on('message', message => console.log(message))

		// Handle client disconnection
		socket.on('disconnect', () => {
			console.log(`DISCONNECT: userId:[${userId}], socketId:[${socket.id}]`)
			const index = getClientIndex(userId)
			connectedClients[index].socketIds = connectedClients[index].socketIds.filter(id => id !== socket.id)
			// Only register user as offline if no clients are connected
			if (!connectedClients[index].socketIds.length) {
				connectedClients[index].offlineSince = Date.now()
				notifyFriendsOfUserStatusChange(index, false)
			}
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
			if (isOnline === (connectedClients[arrayIndex].socketIds.length > 0)) {
				sendUpdate(connectedClients[arrayIndex].userId, isOnline)
			}
		}, 1000)
	}
}

async function sendUpdate (userId, isOnline) {
	const user = await User.findById(userId).select('friends')
	for (const friend of user.friends) {
		const onlineFriendSocketIds = getUserSocketIds(friend._id.toString())
		sendMessageToAllSockets(onlineFriendSocketIds, 'friendStatusUpdate', { id: userId, isOnline })
	}
}

export function getUserSocketIds (userId) {
	const user = connectedClients.find(client => client.userId === userId)
	return user ? user.socketIds : []
}

export function notifyUser (updatedUserDocument) {
	const socketIds = getUserSocketIds(updatedUserDocument.id)
	sendMessageToAllSockets(socketIds, 'userUpdate', updatedUserDocument)
}

export function sendChatMessage (messageDocument) {
	const socketIds = getUserSocketIds(messageDocument.recipient.toString())
	sendMessageToAllSockets(socketIds, 'chatMessage', messageDocument)
}

function sendMessageToAllSockets (socketIds, channel, message) {
	for (const id of socketIds) {
		io.to(id).emit(channel, message)
	}
}
