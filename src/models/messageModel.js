import mongoose from 'mongoose'

const Schema = mongoose.Schema

const MessageSchema = new Schema({
	sender: {
		type: Schema.Types.ObjectId,
		ref: 'User',
		required: true
	},
	recipient: {
		type: Schema.Types.ObjectId,
		ref: 'User',
		required: true
	},
	text: {
		type: String,
		required: true
	},
	isRead: {
		type: Boolean,
		default: false
	}
},
{
	timestamps: true
})

export default mongoose.model('Message', MessageSchema)
