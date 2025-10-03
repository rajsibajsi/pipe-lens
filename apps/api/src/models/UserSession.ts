import { Schema, model, type Document, type Types } from 'mongoose';

export interface IUserSession extends Document {
	_id: Types.ObjectId;
	userId: Types.ObjectId;
	token: string;
	refreshToken: string;
	expiresAt: Date;
	createdAt: Date;
	lastUsedAt: Date;
	userAgent?: string;
	ipAddress?: string;
	isActive: boolean;
	isValid(): boolean;
	refresh(): Promise<IUserSession>;
	deactivate(): Promise<IUserSession>;
}

const userSessionSchema = new Schema<IUserSession>(
	{
		userId: {
			type: Schema.Types.ObjectId,
			ref: 'User',
			required: true,
			index: true,
		},
		token: {
			type: String,
			required: true,
			unique: true,
			index: true,
		},
		refreshToken: {
			type: String,
			required: true,
			unique: true,
			index: true,
		},
		expiresAt: {
			type: Date,
			required: true,
			index: { expireAfterSeconds: 0 }, // TTL index
		},
		createdAt: {
			type: Date,
			default: Date.now,
		},
		lastUsedAt: {
			type: Date,
			default: Date.now,
		},
		userAgent: {
			type: String,
			trim: true,
		},
		ipAddress: {
			type: String,
			trim: true,
		},
		isActive: {
			type: Boolean,
			default: true,
			index: true,
		},
	},
	{
		timestamps: true,
	},
);

// Indexes
userSessionSchema.index({ token: 1 }, { unique: true });
userSessionSchema.index({ refreshToken: 1 }, { unique: true });
userSessionSchema.index({ userId: 1, isActive: 1 });
userSessionSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

// Method to check if session is valid
userSessionSchema.methods.isValid = function () {
	return this.isActive && this.expiresAt > new Date();
};

// Method to refresh session
userSessionSchema.methods.refresh = function () {
	this.lastUsedAt = new Date();
	return this.save();
};

// Method to deactivate session
userSessionSchema.methods.deactivate = function () {
	this.isActive = false;
	return this.save();
};

export const UserSession = model<IUserSession>('UserSession', userSessionSchema);
