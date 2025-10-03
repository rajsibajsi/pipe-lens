import type { NextFunction, Request, Response } from 'express';
import type { IUser } from '../models/User';
import { AuthService } from '../services/auth.service';

// Extend Express Request interface to include user
declare global {
	namespace Express {
		interface Request {
			user?: IUser;
		}
	}
}

const authService = new AuthService();

/**
 * Authentication middleware
 * Verifies JWT token and adds user to request
 */
export const authenticate = async (req: Request, res: Response, next: NextFunction) => {
	try {
		const authHeader = req.headers.authorization;
		
		if (!authHeader || !authHeader.startsWith('Bearer ')) {
			return res.status(401).json({
				success: false,
				message: 'Access token required'
			});
		}

		const token = authHeader.substring(7); // Remove 'Bearer ' prefix
		
		const user = await authService.verifyToken(token);
		req.user = user;
		
		return next();
	} catch (_error) {
		return res.status(401).json({
			success: false,
			message: 'Invalid or expired token'
		});
	}
};

/**
 * Optional authentication middleware
 * Adds user to request if token is valid, but doesn't require it
 */
export const optionalAuth = async (req: Request, _res: Response, next: NextFunction) => {
	try {
		const authHeader = req.headers.authorization;
		
		if (authHeader?.startsWith('Bearer ')) {
			const token = authHeader.substring(7);
			const user = await authService.verifyToken(token);
			req.user = user;
		}
		
		next();
	} catch (_error) {
		// Continue without user if token is invalid
		next();
	}
};

/**
 * Admin authentication middleware
 * Requires user to be authenticated and have admin privileges
 */
export const requireAdmin = async (req: Request, res: Response, next: NextFunction) => {
	try {
		if (!req.user) {
			return res.status(401).json({
				success: false,
				message: 'Authentication required'
			});
		}

		// Check if user has admin privileges
		// This would depend on your admin system implementation
		if (req.user.plan !== 'enterprise') {
			return res.status(403).json({
				success: false,
				message: 'Admin privileges required'
			});
		}

		return next();
	} catch (_error) {
		return res.status(500).json({
			success: false,
			message: 'Authentication error'
		});
	}
};

/**
 * Rate limiting middleware
 * Limits requests per user per endpoint
 */
export const rateLimit = (maxRequests: number, windowMs: number) => {
	const requests = new Map<string, { count: number; resetTime: number }>();

	return (req: Request, res: Response, next: NextFunction) => {
		const userId = req.user?._id?.toString() || req.ip || 'anonymous';
		const now = Date.now();
		const windowStart = now - windowMs;

		// Clean up old entries
		for (const [key, value] of requests.entries()) {
			if (value.resetTime < windowStart) {
				requests.delete(key);
			}
		}

		const userRequests = requests.get(userId);
		
		if (!userRequests) {
			requests.set(userId, { count: 1, resetTime: now });
			return next();
		}

		if (userRequests.resetTime < windowStart) {
			// Reset window
			userRequests.count = 1;
			userRequests.resetTime = now;
			return next();
		}

		if (userRequests.count >= maxRequests) {
			return res.status(429).json({
				success: false,
				message: 'Too many requests, please try again later',
				retryAfter: Math.ceil((userRequests.resetTime + windowMs - now) / 1000)
			});
		}

		userRequests.count++;
		return next();
	};
};

/**
 * Plan-based access control middleware
 */
export const requirePlan = (requiredPlan: 'free' | 'pro' | 'enterprise') => {
	return (req: Request, res: Response, next: NextFunction) => {
		if (!req.user) {
			return res.status(401).json({
				success: false,
				message: 'Authentication required'
			});
		}

		const planHierarchy = { free: 0, pro: 1, enterprise: 2 };
		const userPlanLevel = planHierarchy[req.user.plan];
		const requiredPlanLevel = planHierarchy[requiredPlan];

		if (userPlanLevel < requiredPlanLevel) {
			return res.status(403).json({
				success: false,
				message: `${requiredPlan} plan required`,
				upgradeRequired: true,
				currentPlan: req.user.plan,
				requiredPlan
			});
		}

		return next();
	};
};
