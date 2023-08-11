import mongoose from 'mongoose'
const Schema = mongoose.Schema

export default new Schema({
	type: {
		type: String,
		default: 'general'
	},
	user: {
		type: Schema.Types.ObjectId,
		ref: 'User'
	},
	message: {
		type: String,
		require: true
	}
},
{
	timestamps: true
})
