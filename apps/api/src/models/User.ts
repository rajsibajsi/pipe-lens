import { Document, Schema, model } from 'mongoose';

export interface IUser extends Document {
	_id: string;
	email: string;
	password: string;
	name: string;
	avatar?: string;
	plan: 'free' | 'pro' | 'enterprise';
	createdAt: Date;
	updatedAt: Date;
	lastLoginAt?: Date;
	isActive: boolean;
	preferences: {
		theme: 'light' | 'dark' | 'auto';
		language: string;
		notifications: {
			email: boolean;
			pipelineUpdates: boolean;
		};
	};
}

const userSchema = new Schema<IUser>({
	email: {
		type: String,
		required: true,
		unique: true,
		lowercase: true,
		trim: true,
		index: true
	},
	password: {
		type: String,
		required: true,
		minlength: 8
	},
	name: {
		type: String,
		required: true,
		minlength: 2,
		trim: true
	},
	avatar: {
		type: String,
		trim: true
	},
	plan: {
		type: String,
		enum: ['free', 'pro', 'enterprise'],
		default: 'free',
		index: true
	},
	createdAt: {
		type: Date,
		default: Date.now,
		index: true
	},
	updatedAt: {
		type: Date,
		default: Date.now
	},
	lastLoginAt: {
		type: Date
	},
	isActive: {
		type: Boolean,
		default: true,
		index: true
	},
	preferences: {
		theme: {
			type: String,
			enum: ['light', 'dark', 'auto'],
			default: 'auto'
		},
		language: {
			type: String,
			default: 'en'
		},
		notifications: {
			email: {
				type: Boolean,
				default: true
			},
			pipelineUpdates: {
				type: Boolean,
				default: true
			}
		}
	}
}, {
	timestamps: true,
	toJSON: {
		transform: function(doc, ret) {
			delete ret.password;
			return ret;
		}
	}
});

// Indexes
userSchema.index({ email: 1 });
userSchema.index({ createdAt: -1 });
userSchema.index({ isActive: 1 });

// Pre-save middleware
userSchema.pre('save', function(next) {
	this.updatedAt = new Date();
	next();
});

export const User = model<IUser>('User', userSchema);
