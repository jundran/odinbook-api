import bcrypt from 'bcrypt'
import jwt from 'jsonwebtoken'
import asyncHandler from '../asyncHandler.js'
import AppError from '../error.js'
import User from '../models/userModel.js'
import { queryUserAndPopulate } from './userController.js'

export function validateUser (req, res, next) {
	const token = req.get('Authorization')?.split('Bearer ')[1]
	if (!token) return next(new AppError(401, 'Missing access token'))

	jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, tokenObject) => {
		if (err) return next(new AppError(403, 'Unable to verify access token', err))
		req.user = { id: tokenObject.user.id }
		next()
	})
}

export const createAccount = asyncHandler(async (req, res, next) => {
	const hashedPassword = await bcrypt.hash(req.body.password, 10)
	req.body.password = hashedPassword
	const user = await new User(req.body).save()
	const populatedUser = await queryUserAndPopulate(User.findById(user.id))
	res.statusCode = 201
	res.json({ document: populatedUser, token: createToken(user.id) })
})

export const login = asyncHandler(async (req, res, next) => {
	const user = await queryUserAndPopulate(User.findOne({ email: req.body.email }), true)
	if (!user) return next(new AppError(404, 'Account not found with this email'))

	const match = await bcrypt.compare(req.body.password, user.password)
	if (!match) return next(new AppError(401, 'Password is wrong'))

	const token = createToken(user._id)
	res.json({ document: user, token })
})

export const loginDemoAccount = asyncHandler(async (req, res, next) => {
	const user = await queryUserAndPopulate(User.findOne({ demoAccountId: req.params.id }))
	if (!user) next(new AppError(404, 'User not found'))
	const token = createToken(user._id)
	res.json({ document: user, token })
})

export const updatePassword = asyncHandler(async (req, res, next) => {
	const user = await User.findById(req.user.id).select('password')
	if (!user) return next(new AppError(404, 'User not found'))

	const match = await bcrypt.compare(req.body.currentPassword, user.password)
	if (!match) return next(new AppError(401, 'Current password is wrong'))

	await user.updateOne({ password: req.body.password })
	res.sendStatus(204)
})

export const deleteAccount = asyncHandler(async (req, res, next) => {
	const user = await User.findById(req.user.id).select('password isDemoAccount')
	if (!user) return next(new AppError(404, 'Account not found'))

	const match = await bcrypt.compare(req.body.password, user.password)
	if (!match) return next(new AppError(403, 'Password is wrong'))

	if (!user.isDemoAccount) await User.findByIdAndRemove(req.user.id)
	res.sendStatus(204)
})

function createToken (userId) {
	// payload could be an object literal, buffer or string representing valid JSON
	return jwt.sign(
		{ user: { id : userId.toString() } },
		process.env.ACCESS_TOKEN_SECRET,
		{ expiresIn: '28d' }
	)
}
