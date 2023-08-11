import mongoose from 'mongoose'
import NotificationSchema from './notificationSchema.js'

const Schema = mongoose.Schema

const UserSchema = new Schema({
	firstname: {
		type: String,
		required: true
	},
	surname: {
		type: String,
		required: true
	},
	dob: {
		type: Date,
		required: true
	},
	profilePicture: {
		type: String,
		default: '/saved/default-profile-picture.png'
	},
	email: {
		type: String,
		required: true,
		unique: true
	},
	password: {
		type: String,
		required: true
	},
	location: { type: String },
	jobTitle: { type: String },
	company: { type: String },
	school: { type: String },
	hobbies: { type: String },
	favouriteAnimal: { type: String },
	isActive: {
		type: Boolean,
		default: true
	},
	isDemoAccount: {
		type: Boolean,
		default: false
	},
	demoAccountId: {
		type: Number
	},
	friends: [{
		type: Schema.Types.ObjectId,
		ref: 'User'
	}],
	incomingFriendRequests: [{
		type: Schema.Types.ObjectId,
		ref: 'User'
	}],
	outgoingFriendRequests: [{
		type: Schema.Types.ObjectId,
		ref: 'User'
	}],
	notifications: [{
		type: NotificationSchema
	}]
},
{
	timestamps: true
})

UserSchema.pre('save', function (next) {
	formatFields(this)
	next()
})

UserSchema.pre(['updateOne', 'findOneAndUpdate'], function (next) {
	formatFields(this._update)
	next()
})

function formatFields (document) {
	if (!document) return // client sent body with empty fields
	if (document.firstname) { // client sent body without firstname or firstname.trim() = ''
		document.firstname = document.firstname.charAt(0).toUpperCase() + document.firstname.slice(1)
	}
	if (document.surname) {
		document.surname = document.surname.charAt(0).toUpperCase() + document.surname.slice(1)
	}
}

UserSchema.index({ email: 1 }, {
	unique: true
})

UserSchema.set('toObject', { virtuals: true })
UserSchema.set('toJSON', { virtuals: true })

UserSchema.virtual('fullname').get(function () {
	return this.firstname + ' ' + this.surname
})

export default mongoose.model('User', UserSchema)
