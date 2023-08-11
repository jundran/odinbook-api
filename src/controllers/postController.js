import asyncHandler from '../asyncHandler.js'
import Post from '../models/postModel.js'
import User from '../models/userModel.js'
import AppError from '../error.js'

export const createPost = asyncHandler(async (req, res, next) => {
	const body = req.body
	if (req.file) body.image = '/images/' + req.file.filename
	const post = new Post(body)
	post.user= req.user.id
	await post.save()

	res.status(201)
	res.json({ document: post })
})

export const getUserPosts = asyncHandler(async (req, res, next) => {
	const posts = await Post.find({ user: req.params.id })
		.populate({
			path: 'user',
			select: 'firstname surname fullname profilePicture'
		})
		.populate({
			path: 'likes',
			select: 'firstname surname fullname profilePicture'
		})
		.populate({
			path: 'comments',
			populate: {
				path: 'user',
				select: 'firstname surname fullname profilePicture'
			}
		})
		.populate({
			path: 'comments',
			populate: {
				path: 'likes',
				select: 'firstname surname fullname profilePicture'
			}
		})

	res.json({ documents: posts.reverse() })
})

export const getUserFeed = asyncHandler(async (req, res, next) => {
	const user = await User.findById(req.user.id)

	const posts = await Post.find({ 'user':{ '$in': [req.user.id, ...user.friends] }})
		.populate({
			path: 'user',
			select: 'firstname surname fullname profilePicture'
		})
		.populate({
			path: 'likes',
			select: 'firstname surname fullname profilePicture'
		})
		.populate({
			path: 'comments',
			populate: {
				path: 'user',
				select: 'firstname surname fullname profilePicture'
			}
		})
		.populate({
			path: 'comments',
			populate: {
				path: 'likes',
				select: 'firstname surname fullname profilePicture'
			}
		})

	res.json({ documents: posts.reverse() })
})

async function likeOrUnlike (req, next, like) {
	const operation = like ? { $addToSet: { likes: req.user.id } } :
		{ $pull: { likes: req.user.id } }

	const updatedPost = await Post.findByIdAndUpdate(
		req.body.id,
		operation,
		{ new: true }
	).select('likes').populate({
		path: 'likes',
		select: 'firstname surname fullname'
	})

	if (!updatedPost) return next(new AppError(404, 'Post not found'))
	else return updatedPost.likes
}

export const likePost = asyncHandler(async (req, res, next) => {
	const updatedLikes = await likeOrUnlike(req, next, true)
	res.json({ document: updatedLikes })
})

export const unlikePost = asyncHandler(async (req, res, next) => {
	const updatedLikes = await likeOrUnlike(req, next, false)
	res.json({ document: updatedLikes })
})

export const deletePost = asyncHandler(async (req, res, next) => {
	const post = await Post.findById(req.params.id)
	if (post && post.user.toString() !== req.user.id) {
		return next(new AppError(403, 'This post does not belong to you'))
	}

	await Post.findByIdAndRemove(req.params.id)
	res.sendStatus(204)
})
