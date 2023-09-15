import { unlink } from 'fs'
import asyncHandler from '../asyncHandler.js'
import AppError from '../error.js'
import User from '../models/userModel.js'
import { getUserSocketIds } from '../socket.js'

export async function queryUserAndPopulate (query, password) {
	const populatedQuery = query
		.populate({ path: 'friends', select: 'firstname surname profilePicture' })
		.populate({ path: 'incomingFriendRequests', select: 'firstname surname profilePicture' })
		.populate({ path: 'outgoingFriendRequests', select: 'firstname surname profilePicture' })
		.populate({
			path: 'notifications',
			populate: {
				path: 'user',
				select: 'firstname surname'
			}
		})

	const selectedQuery = password ? await populatedQuery : await populatedQuery.select({ password: 0 })
	if (!selectedQuery) return null
	const user = selectedQuery.toObject()
	const friendsWithStatus = user.friends.map(friend => {
		return {
			...friend,
			isOnline: getUserSocketIds(friend.id).length ? true : false
		}
	})
	return { ...user, friends: friendsWithStatus }
}

export const getAllUsers = asyncHandler(async (req, res, next) => {
	const users = await User.find().select(['firstname', 'surname', 'profilePicture'])
	res.json({ documents: users })
})

export const getCurrentUser = asyncHandler(async (req, res, next) => {
	const user = await queryUserAndPopulate(User.findById(req.user.id))
	if (!user) return next(new AppError(404, 'User not found'))
	res.json({ document: user })
})

export const getUser = asyncHandler(async (req, res, next) => {
	// Get document of logged in user
	const loggedInUser = await User.findById(req.user.id).select({ friends: 1 })
	if (!loggedInUser) return next(new AppError(404, 'Current user not found'))

	// Get document of user sent in req.params
	let user = await User.findById(req.params.id)
		// Remove private and unneeded fields and populate basic friend data
		.select({ password: 0, incomingFriendRequests: 0, outgoingFriendRequests: 0,
			notifications: 0, isActive: 0, isDemoAccount: 0, demoAccountId: 0
		})
		.populate({ path: 'friends', select: 'firstname surname profilePicture' })

	// Determine if logged user is friend of user
	const userIsFriendOfLoggedInUser = user.friends.some(friend => friend.id === req.user.id)

	// If user is not friend then only send back mutual friends that the user and logged in user share
	if (!userIsFriendOfLoggedInUser) {
		const friends = user.friends.filter(friend => loggedInUser.friends.includes(friend.id))
		user = { ...user.toObject(), friends }
	}

	res.json({ document: user })
})

export const updateCurrentUser = asyncHandler(async (req, res, next) => {
	const updatedUser = await User.findByIdAndUpdate(req.user.id, req.body, { new: true })
	if (!updatedUser) return next(new AppError(404, 'User not found'))
	res.json({ document: updatedUser })
})

export const uploadPortrait = asyncHandler(async (req, res, next) => {
	if (!req.file) return (new AppError(400, 'Unable to save new profile picture'))

	const oldUserDocument = await User.findById(req.user.id).select('profilePicture')
	deleteOldProfilePhotoFromDisk(oldUserDocument.profilePicture)

	const updatedUserDocument = await queryUserAndPopulate(User.findByIdAndUpdate(
		req.user.id,
		{ profilePicture: '/images/' + req.file.filename },
		{ new: true }
	))
	res.json({ document: updatedUserDocument })
})

export const deletePortrait = asyncHandler(async (req, res, next) => {
	const oldUserDocument = await User.findById(req.user.id).select('profilePicture')
	deleteOldProfilePhotoFromDisk(oldUserDocument.profilePicture)

	const updatedUser = await queryUserAndPopulate(User.findByIdAndUpdate(
		req.user.id,
		{ profilePicture: '/saved/default-profile-picture.png' },
		{ new: true }
	))
	res.json({ document: updatedUser })
})

export const clearNotification = asyncHandler(async (req, res, next) => {
	const updatedUser = await queryUserAndPopulate(User.findByIdAndUpdate(
		req.user.id,
		{ $pull: { notifications: { _id: req.body.id }}},
		{ new: true }
	))
	res.json({ document: updatedUser })
})

function deleteOldProfilePhotoFromDisk (profilePicture) {
	if (profilePicture.startsWith('/saved/')) return

	const oldFile = 'public' + profilePicture
	unlink(oldFile, err => {
		if (err) console.log(err)
		else console.log('DELETE FILE: ' + oldFile)
	})
}
