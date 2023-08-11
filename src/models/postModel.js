import mongoose from 'mongoose'

const Schema = mongoose.Schema

const PostSchema = new Schema({
	user: {
		type: Schema.Types.ObjectId,
		ref: 'User',
		required: true
	},
	text: {
		type: String
	},
	image: {
		type: String
	},
	likes: [{
		type: Schema.Types.ObjectId,
		ref: 'User'
	}],
	comments: [{
		type: Schema.Types.ObjectId,
		ref: 'Comment'
	}]
},
{
	timestamps: true
})

export default mongoose.model('Post', PostSchema)
