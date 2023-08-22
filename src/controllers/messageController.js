import asyncHandler from '../asyncHandler.js'
import Message from '../models/messageModel.js'
import { sendChatMessage } from '../socket.js'

export const getUserMessages = asyncHandler(async (req, res, next) => {
	const messages = await Message.find({
		$or: [
			{sender: req.user.id},
			{recipient: req.user.id}
		]
	})
	res.json({ documents: messages })
})

export const postMessage = asyncHandler(async (req, res, next) => {
	const message = await new Message(req.body).save()
	res.status(201)
	res.json({ document: message })

	sendChatMessage(message)
})

export const markAsRead = asyncHandler(async (req, res, next) => {
	await Message.updateMany({
		'_id': { $in: req.body.ids }
	}, {
		isRead: true
	})
	res.sendStatus(204)
})
