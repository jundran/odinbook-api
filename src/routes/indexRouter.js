import express from 'express'
import { upload } from '../multer.js'
import {
	validateUser,
	login,
	loginDemoAccount,
	updatePassword,
	deleteAccount,
	createAccount
} from '../controllers/authController.js'
import {
	getAllUsers,
	getCurrentUser,
	getUser,
	uploadPortrait,
	deletePortrait,
	updateCurrentUser,
	clearNotification
} from '../controllers/userController.js'
import {
	removeFriend,
	addFriendRequest,
	cancelFriendRequest,
	acceptFriendRequest,
	rejectFriendRequest
} from '../controllers/friendController.js'
import {
	getUserPosts,
	createPost,
	getUserFeed,
	likePost,
	unlikePost,
	deletePost
} from '../controllers/postController.js'
import {
	getComment,
	postComment,
	likeComment,
	unlikeComment,
	deleteComment
} from '../controllers/commentController.js'

const router = express.Router()
router.get('/', (req, res) => {
	res.json({ message: 'Welcome to the Blog API version 1' })
})

// function log (req, res, next) {
// 	console.log('REQUEST BODY', req.body)
// 	next()
// }

// Authentication
router.post('/auth/', createAccount)
router.post('/auth/demo/:id', loginDemoAccount)
router.post('/auth/login', login)
router.post('/auth/deleteAccount', validateUser, deleteAccount)
router.put('/auth/updatePassword', validateUser, updatePassword)

// User
router.get('/user/', validateUser, getAllUsers)
router.get('/user/current', validateUser, getCurrentUser)
router.get('/user/:id', validateUser, getUser)
router.patch('/user/current', validateUser, updateCurrentUser)
router.patch('/user/clearNotification', validateUser, clearNotification)
router.post('/user/', createAccount)
router.post('/user/portrait', validateUser, upload.single('file'), uploadPortrait)
router.delete('/user/portrait', validateUser, deletePortrait)

// Friend
router.put('/friend/add', validateUser, addFriendRequest)
router.put('/friend/remove', validateUser, removeFriend)
router.put('/friend/cancel', validateUser, cancelFriendRequest)
router.put('/friend/accept', validateUser, acceptFriendRequest)
router.put('/friend/reject', validateUser, rejectFriendRequest)

// Posts
router.get('/post/user/:id', validateUser, getUserPosts)
router.get('/post/feed', validateUser, getUserFeed)
router.post('/post', validateUser, upload.single('file'), createPost)
router.patch('/post/like', validateUser, likePost)
router.patch('/post/unlike', validateUser, unlikePost)
router.delete('/post/:id', validateUser, deletePost)


//Comment
router.get('/comment/:id', validateUser, getComment)
router.post('/comment', validateUser, postComment)
router.patch('/comment/like', validateUser, likeComment)
router.patch('/comment/unlike', validateUser, unlikeComment)
router.delete('/comment/:id', validateUser, deleteComment)

export default router
