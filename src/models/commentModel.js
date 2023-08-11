import mongoose from 'mongoose'

const Schema = mongoose.Schema

const CommentSchema = new Schema({
	user: {
		type: Schema.Types.ObjectId,
		ref: 'User',
		required: true
	},
	text: {
		type: String,
		required: true
	},
	likes: [{
		type: Schema.Types.ObjectId,
		ref: 'User'
	}]
},
{
	timestamps: true
})

export default mongoose.model('Comment', CommentSchema)
