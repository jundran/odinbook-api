import asyncHandler from '../asyncHandler.js'
import User from '../models/userModel.js'
import Message from '../models/messageModel.js'
import { queryUserAndPopulate } from './userController.js'
import { notifyUser } from '../socket.js'

export const removeFriend = asyncHandler(async (req, res, next) => {
	const user = await queryUserAndPopulate(User.findByIdAndUpdate(
		req.user.id,
		{ $pull: { friends: req.body.id } },
		{ new : true }
	))

	const notification = {
		type: 'friend-update',
		user: req.user.id,
		message: 'removed you as a friend'
	}

	const removedFriend = await queryUserAndPopulate(User.findByIdAndUpdate(
		req.body.id,
		{
			$pull: { friends: req.user.id },
			$push: { notifications: notification }
		},
		{ new: true }
	))

	// Delete messages between user and removed friend
	// In future they could be marked as inactive to keep them without returning them in queries
	await Message.deleteMany({
		$or: [{
			$and: [
				{sender: req.user.id},
				{recipient: req.body.id}
			]
		}, {
			$and: [
				{sender: req.body.id},
				{recipient: req.user.id}
			]
		}]
	})

	notifyUser(removedFriend)
	res.json({ document: user })
})

export const addFriendRequest = asyncHandler(async (req, res, next) => {
	const updatedUser = await queryUserAndPopulate(User.findByIdAndUpdate(
		req.user.id,
		{ $addToSet: { outgoingFriendRequests: req.body.id } },
		{ new: true }
	))

	const potentialFriend = await queryUserAndPopulate(User.findByIdAndUpdate(
		req.body.id,
		{ $addToSet: { incomingFriendRequests: req.user.id } },
		{ new: true }
	))

	notifyUser(potentialFriend)
	res.json({ document: updatedUser })
})

export const cancelFriendRequest = asyncHandler(async (req, res, next) => {
	const user = await queryUserAndPopulate(User.findByIdAndUpdate(
		req.user.id,
		{ $pull: { outgoingFriendRequests: req.body.id } },
		{ new: true }
	))

	const potentialFriend = await queryUserAndPopulate(User.findByIdAndUpdate(
		req.body.id,
		{ $pull: { incomingFriendRequests: req.user.id } },
		{new: true}
	))

	notifyUser(potentialFriend)
	res.json({ document: user })
})

export const acceptFriendRequest = asyncHandler(async (req, res, next) => {
	// For user and potential friend, handle case where both users send a request to each other
	// Avoid possibility of a race condition by pulling from incoming and outgoing for each
	const user = await queryUserAndPopulate(User.findByIdAndUpdate(
		req.user.id,
		{
			$pull: {
				incomingFriendRequests: req.body.id,
				outgoingFriendRequests: req.body.id
			},
			$addToSet: { friends: req.body.id  }
		},
		{ new : true }
	))

	const notification = {
		type: 'friend-update',
		user: req.user.id,
		message: 'accepted your friend request'
	}

	const acceptedFriend = await queryUserAndPopulate(User.findByIdAndUpdate(
		req.body.id,
		{
			$pull: {
				outgoingFriendRequests: req.user.id,
				incomingFriendRequests: req.user.id
			},
			$push: { notifications: notification },
			$addToSet: { friends: req.user.id }
		},
		{ new: true }
	))

	notifyUser(acceptedFriend)
	res.json({ document: user })
})

export const rejectFriendRequest = asyncHandler(async (req, res, next) => {
	const user = await queryUserAndPopulate(User.findByIdAndUpdate(
		req.user.id,
		{
			$pull: { incomingFriendRequests: req.body.id }
		},
		{ new : true }
	))

	const notification = {
		type: 'friend-update',
		user: req.user.id,
		message: 'rejected your friend request'
	}

	const rejectedFriend = await queryUserAndPopulate(User.findByIdAndUpdate(
		req.body.id,
		{
			$pull: { outgoingFriendRequests: req.user.id },
			$push: { notifications: notification }
		},
		{ new : true}
	))

	notifyUser(rejectedFriend)
	res.json({ document: user })
})
