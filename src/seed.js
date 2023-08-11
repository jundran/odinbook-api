import mongoose from 'mongoose'
import dotenv from 'dotenv'
import { LoremIpsum } from 'lorem-ipsum'
import usersData from './data/users.js'
import User from './models/userModel.js'
import Post from './models/postModel.js'
import Comment from './models/commentModel.js'

dotenv.config()
await connectToDatabase().catch(() => process.exit(1))
await dropDatabase().catch(() => closeConnection())
populateDatabase().finally(() => closeConnection())

async function connectToDatabase () {
	try {
		const db = await mongoose.connect(process.env.MONGO_DB_CONNECTION_STRING)
		console.log(`Connected to MongoDB on port ${db.connections[0].port}`)
	} catch (err) {
		console.log('Error connecting to database:', err)
	}
}

async function dropDatabase () {
	return mongoose.connection.dropDatabase()
		.then(() => console.log('Database dropped'))
		.catch(err => console.log('Error dropping database:', err))
}

async function closeConnection () {
	return mongoose.connection.close()
		.then(console.log('Connection closed'))
		.catch(err => console.log('Error closing connection:', err))
}

async function populateDatabase () {
	console.log('Populating database')
	const users = await populateUsers()
	await populatePosts(users)
}

async function populateUsers () {
	console.log('Populating users')
	try {
		const userDocuments = usersData.map(user => new User(user))
		await User.bulkSave(userDocuments)
		return userDocuments
	} catch (error) {
		console.log(error)
	}
}

async function populatePosts (users) {
	console.log('Populating posts')
	try {
		await generateSetOfPostsWithImages(users)
		await generateSetOfPosts(users)
	} catch (error) {
		console.log(error)
	}
}

async function generateSetOfPostsWithImages (users) {
	for (const user of users) {
		await new Post({
			user: user._id,
			text: new LoremIpsum({ wordsPerSentence: { max: 16,	min: 10	} }).generateSentences(2),
			likes: getLikes(user, users),
			image: '/saved/' + user.firstname.toLowerCase() + '-post.jpg',
			comments: await generatePostComments(user, users)
		}).save()
	}
}

async function generateSetOfPosts (users) {
	for (const user of users) {
		await new Post({
			user: user._id,
			text: new LoremIpsum({ wordsPerSentence: { max: 16,	min: 10	} }).generateParagraphs(5),
			likes: getLikes(user, users),
			comments: await generatePostComments(user, users)
		}).save()
	}
}


async function generatePostComments (postAuthor, users) {
	const commentIds = []
	for (const user of users) {
		if (user.id === postAuthor.id) continue
		const comment = await new Comment({
			user,
			text: new LoremIpsum({ wordsPerSentence: { max: 13, min: 9} }).generateSentences(1),
			likes: getLikes(user, users)
		}).save()
		commentIds.push(comment.id)
	}
	return commentIds
}

function getLikes (postOrCommentAuthor, users) {
	const likes = []
	for (const user of users) {
		if (user.id === postOrCommentAuthor.id) continue
		likes.push(user.id)
	}
	return likes
}
