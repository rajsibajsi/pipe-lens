import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { User, type IUser } from '../models/User';
import { UserSession } from '../models/UserSession';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || 'your-refresh-secret';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '1h';
const JWT_REFRESH_EXPIRES_IN = process.env.JWT_REFRESH_EXPIRES_IN || '7d';

export interface AuthResult {
	user: IUser;
	accessToken: string;
	refreshToken: string;
}

export interface LoginCredentials {
	email: string;
	password: string;
}

export interface RegisterData {
	email: string;
	password: string;
	name: string;
}

export class AuthService {
	/**
	 * Register a new user
	 */
	async register(data: RegisterData): Promise<AuthResult> {
		const { email, password, name } = data;

		// Check if user already exists
		const existingUser = await User.findOne({ email });
		if (existingUser) {
			throw new Error('User with this email already exists');
		}

		// Hash password
		const saltRounds = 12;
		const hashedPassword = await bcrypt.hash(password, saltRounds);

		// Create user
		const user = new User({
			email,
			password: hashedPassword,
			name,
			plan: 'free'
		});

		await user.save();

		// Generate tokens
		const tokens = await this.generateTokens(user._id.toString());

		return {
			user,
			...tokens
		};
	}

	/**
	 * Login user
	 */
	async login(credentials: LoginCredentials): Promise<AuthResult> {
		const { email, password } = credentials;

		// Find user
		const user = await User.findOne({ email, isActive: true });
		if (!user) {
			throw new Error('Invalid email or password');
		}

		// Verify password
		const isValidPassword = await bcrypt.compare(password, user.password);
		if (!isValidPassword) {
			throw new Error('Invalid email or password');
		}

		// Update last login
		user.lastLoginAt = new Date();
		await user.save();

		// Generate tokens
		const tokens = await this.generateTokens(user._id.toString());

		return {
			user,
			...tokens
		};
	}

	/**
	 * Refresh access token
	 */
	async refreshToken(refreshToken: string): Promise<{ accessToken: string; refreshToken: string }> {
		// Verify refresh token
		const decoded = jwt.verify(refreshToken, JWT_REFRESH_SECRET) as { userId: string };
		
		// Find session
		const session = await UserSession.findOne({
			refreshToken,
			isActive: true,
			expiresAt: { $gt: new Date() }
		});

		if (!session) {
			throw new Error('Invalid refresh token');
		}

		// Find user
		const user = await User.findById(decoded.userId);
		if (!user || !user.isActive) {
			throw new Error('User not found or inactive');
		}

		// Generate new tokens
		const tokens = await this.generateTokens(user._id.toString());

		// Deactivate old session
		session.deactivate();

		return tokens;
	}

	/**
	 * Logout user
	 */
	async logout(token: string): Promise<void> {
		const session = await UserSession.findOne({ token, isActive: true });
		if (session) {
			await session.deactivate();
		}
	}

	/**
	 * Logout from all devices
	 */
	async logoutAll(userId: string): Promise<void> {
		await UserSession.updateMany(
			{ userId, isActive: true },
			{ isActive: false }
		);
	}

	/**
	 * Verify access token
	 */
	async verifyToken(token: string): Promise<IUser> {
		const decoded = jwt.verify(token, JWT_SECRET) as { userId: string };
		
		// Check if session exists and is valid
		const session = await UserSession.findOne({
			token,
			isActive: true,
			expiresAt: { $gt: new Date() }
		});

		if (!session) {
			throw new Error('Invalid or expired token');
		}

		// Find user
		const user = await User.findById(decoded.userId);
		if (!user || !user.isActive) {
			throw new Error('User not found or inactive');
		}

		// Update last used
		await session.refresh();

		return user;
	}

	/**
	 * Generate access and refresh tokens
	 */
	private async generateTokens(userId: string): Promise<{ accessToken: string; refreshToken: string }> {
		// Generate access token
		const accessToken = jwt.sign(
			{ userId },
			JWT_SECRET,
			{ expiresIn: JWT_EXPIRES_IN }
		);

		// Generate refresh token
		const refreshToken = jwt.sign(
			{ userId },
			JWT_REFRESH_SECRET,
			{ expiresIn: JWT_REFRESH_EXPIRES_IN }
		);

		// Calculate expiration date
		const expiresAt = new Date();
		expiresAt.setDate(expiresAt.getDate() + 7); // 7 days

		// Create session
		const session = new UserSession({
			userId,
			token: accessToken,
			refreshToken,
			expiresAt
		});

		await session.save();

		return { accessToken, refreshToken };
	}

	/**
	 * Get user by ID
	 */
	async getUserById(userId: string): Promise<IUser | null> {
		return await User.findById(userId);
	}

	/**
	 * Update user profile
	 */
	async updateProfile(userId: string, updateData: Partial<IUser>): Promise<IUser> {
		const user = await User.findById(userId);
		if (!user) {
			throw new Error('User not found');
		}

		// Remove sensitive fields
		delete updateData.password;
		delete updateData._id;

		Object.assign(user, updateData);
		await user.save();

		return user;
	}

	/**
	 * Change password
	 */
	async changePassword(userId: string, currentPassword: string, newPassword: string): Promise<void> {
		const user = await User.findById(userId);
		if (!user) {
			throw new Error('User not found');
		}

		// Verify current password
		const isValidPassword = await bcrypt.compare(currentPassword, user.password);
		if (!isValidPassword) {
			throw new Error('Current password is incorrect');
		}

		// Hash new password
		const saltRounds = 12;
		const hashedPassword = await bcrypt.hash(newPassword, saltRounds);

		// Update password
		user.password = hashedPassword;
		await user.save();

		// Logout from all devices
		await this.logoutAll(userId);
	}

	/**
	 * Delete user account
	 */
	async deleteAccount(userId: string): Promise<void> {
		// Deactivate user
		await User.findByIdAndUpdate(userId, { isActive: false });

		// Deactivate all sessions
		await this.logoutAll(userId);

		// Note: In a real application, you might want to soft delete
		// or keep the user data for a certain period
	}
}
