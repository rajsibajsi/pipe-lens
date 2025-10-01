import { Router, Request, Response } from 'express';
import { AuthService } from '../services/auth.service';
import { authenticate, rateLimit } from '../middleware/auth.middleware';

const router = Router();
const authService = new AuthService();

// Rate limiting for auth endpoints
const authRateLimit = rateLimit(5, 15 * 60 * 1000); // 5 requests per 15 minutes

/**
 * @route POST /api/auth/register
 * @desc Register a new user
 * @access Public
 */
router.post('/register', authRateLimit, async (req: Request, res: Response) => {
	try {
		const { email, password, name } = req.body;

		// Validate input
		if (!email || !password || !name) {
			return res.status(400).json({
				success: false,
				message: 'Email, password, and name are required'
			});
		}

		// Validate email format
		const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
		if (!emailRegex.test(email)) {
			return res.status(400).json({
				success: false,
				message: 'Invalid email format'
			});
		}

		// Validate password strength
		if (password.length < 8) {
			return res.status(400).json({
				success: false,
				message: 'Password must be at least 8 characters long'
			});
		}

		// Validate name
		if (name.trim().length < 2) {
			return res.status(400).json({
				success: false,
				message: 'Name must be at least 2 characters long'
			});
		}

		const result = await authService.register({
			email: email.toLowerCase().trim(),
			password,
			name: name.trim()
		});

		res.status(201).json({
			success: true,
			message: 'User registered successfully',
			data: {
				user: result.user,
				accessToken: result.accessToken,
				refreshToken: result.refreshToken
			}
		});
	} catch (error) {
		console.error('Registration error:', error);
		res.status(400).json({
			success: false,
			message: error instanceof Error ? error.message : 'Registration failed'
		});
	}
});

/**
 * @route POST /api/auth/login
 * @desc Login user
 * @access Public
 */
router.post('/login', authRateLimit, async (req: Request, res: Response) => {
	try {
		const { email, password } = req.body;

		// Validate input
		if (!email || !password) {
			return res.status(400).json({
				success: false,
				message: 'Email and password are required'
			});
		}

		const result = await authService.login({
			email: email.toLowerCase().trim(),
			password
		});

		res.json({
			success: true,
			message: 'Login successful',
			data: {
				user: result.user,
				accessToken: result.accessToken,
				refreshToken: result.refreshToken
			}
		});
	} catch (error) {
		console.error('Login error:', error);
		res.status(401).json({
			success: false,
			message: error instanceof Error ? error.message : 'Login failed'
		});
	}
});

/**
 * @route POST /api/auth/refresh
 * @desc Refresh access token
 * @access Public
 */
router.post('/refresh', async (req: Request, res: Response) => {
	try {
		const { refreshToken } = req.body;

		if (!refreshToken) {
			return res.status(400).json({
				success: false,
				message: 'Refresh token is required'
			});
		}

		const tokens = await authService.refreshToken(refreshToken);

		res.json({
			success: true,
			message: 'Token refreshed successfully',
			data: tokens
		});
	} catch (error) {
		console.error('Token refresh error:', error);
		res.status(401).json({
			success: false,
			message: error instanceof Error ? error.message : 'Token refresh failed'
		});
	}
});

/**
 * @route POST /api/auth/logout
 * @desc Logout user
 * @access Private
 */
router.post('/logout', authenticate, async (req: Request, res: Response) => {
	try {
		const authHeader = req.headers.authorization;
		const token = authHeader?.substring(7);

		if (token) {
			await authService.logout(token);
		}

		res.json({
			success: true,
			message: 'Logout successful'
		});
	} catch (error) {
		console.error('Logout error:', error);
		res.status(500).json({
			success: false,
			message: 'Logout failed'
		});
	}
});

/**
 * @route POST /api/auth/logout-all
 * @desc Logout from all devices
 * @access Private
 */
router.post('/logout-all', authenticate, async (req: Request, res: Response) => {
	try {
		await authService.logoutAll(req.user!._id);

		res.json({
			success: true,
			message: 'Logged out from all devices'
		});
	} catch (error) {
		console.error('Logout all error:', error);
		res.status(500).json({
			success: false,
			message: 'Logout failed'
		});
	}
});

/**
 * @route GET /api/auth/me
 * @desc Get current user profile
 * @access Private
 */
router.get('/me', authenticate, async (req: Request, res: Response) => {
	try {
		const user = await authService.getUserById(req.user!._id);
		
		if (!user) {
			return res.status(404).json({
				success: false,
				message: 'User not found'
			});
		}

		res.json({
			success: true,
			data: { user }
		});
	} catch (error) {
		console.error('Get profile error:', error);
		res.status(500).json({
			success: false,
			message: 'Failed to get user profile'
		});
	}
});

/**
 * @route PUT /api/auth/profile
 * @desc Update user profile
 * @access Private
 */
router.put('/profile', authenticate, async (req: Request, res: Response) => {
	try {
		const { name, avatar, preferences } = req.body;
		const updateData: any = {};

		if (name !== undefined) {
			if (name.trim().length < 2) {
				return res.status(400).json({
					success: false,
					message: 'Name must be at least 2 characters long'
				});
			}
			updateData.name = name.trim();
		}

		if (avatar !== undefined) {
			updateData.avatar = avatar;
		}

		if (preferences !== undefined) {
			updateData.preferences = preferences;
		}

		const user = await authService.updateProfile(req.user!._id, updateData);

		res.json({
			success: true,
			message: 'Profile updated successfully',
			data: { user }
		});
	} catch (error) {
		console.error('Update profile error:', error);
		res.status(400).json({
			success: false,
			message: error instanceof Error ? error.message : 'Profile update failed'
		});
	}
});

/**
 * @route PUT /api/auth/change-password
 * @desc Change user password
 * @access Private
 */
router.put('/change-password', authenticate, async (req: Request, res: Response) => {
	try {
		const { currentPassword, newPassword } = req.body;

		if (!currentPassword || !newPassword) {
			return res.status(400).json({
				success: false,
				message: 'Current password and new password are required'
			});
		}

		if (newPassword.length < 8) {
			return res.status(400).json({
				success: false,
				message: 'New password must be at least 8 characters long'
			});
		}

		await authService.changePassword(req.user!._id, currentPassword, newPassword);

		res.json({
			success: true,
			message: 'Password changed successfully'
		});
	} catch (error) {
		console.error('Change password error:', error);
		res.status(400).json({
			success: false,
			message: error instanceof Error ? error.message : 'Password change failed'
		});
	}
});

/**
 * @route DELETE /api/auth/account
 * @desc Delete user account
 * @access Private
 */
router.delete('/account', authenticate, async (req: Request, res: Response) => {
	try {
		await authService.deleteAccount(req.user!._id);

		res.json({
			success: true,
			message: 'Account deleted successfully'
		});
	} catch (error) {
		console.error('Delete account error:', error);
		res.status(500).json({
			success: false,
			message: 'Account deletion failed'
		});
	}
});

export default router;
