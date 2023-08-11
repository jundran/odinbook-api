import asyncHandler from '../asyncHandler.js'
import AppError from '../error.js'
import Comment from '../models/commentModel.js'
import Post from '../models/postModel.js'

export const getComment = asyncHandler(async (req, res, next) => {
	const comment = await Comment.findById(req.params.id)
	if (!comment) return next(new AppError(404, 'Comment not found'))
	res.json({ document: comment })
})

export const postComment = asyncHandler(async (req, res, next) => {
	const comment = await new Comment({
		user: req.user.id,
		text: req.body.text
	}).save()

	await comment.populate({
		path: 'user',
		select: 'firstname surname fullname profilePicture'
	})

	Post.findByIdAndUpdate(
		req.body.postId,
		{ $push: { comments: comment.id } },
		{ new: true }
	).exec()

	res.status(201)
	res.json({ document: comment })
})

async function likeOrUnlike (req, like) {
	const operation = like ? { $addToSet: { likes: req.user.id } } :
		{ $pull: { likes: req.user.id } }

	const updatedComment = await Comment.findByIdAndUpdate(
		req.body.id,
		operation,
		{ new: true }
	).populate({
		path: 'user',
		select: 'firstname surname fullname profilePicture'
	}).populate({
		path: 'likes',
		select: 'firstname surname fullname profilePicture'
	})

	return updatedComment
}

export const likeComment = asyncHandler(async (req, res, next) => {
	const updatedComment = await likeOrUnlike(req, true)
	if (!updatedComment) return next(new AppError(404, 'Comment not found'))
	res.json({ document: updatedComment })
})

export const unlikeComment = asyncHandler(async (req, res, next) => {
	const updatedComment = await likeOrUnlike(req, false)
	if (!updatedComment) return next(new AppError(404, 'Comment not found'))
	res.json({ document: updatedComment })
})

export const deleteComment = asyncHandler(async (req, res, next) => {
	const comment = await Comment.findById(req.params.id)
	if (!comment) return next(new AppError(404, 'Comment not found'))

	if (req.user.id !== comment.user.toString()) {
		return next(new AppError(403, 'This comment is not yours to delete'))
	}
	comment.deleteOne()
	res.sendStatus(204)
})
