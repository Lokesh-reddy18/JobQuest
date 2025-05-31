import jwt from 'jsonwebtoken';
import Company from '../models/Company.js';

export const protectCompany = async (req, res, next) => {
    try {
        // Get token from header
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(401).json({
                success: false,
                message: "Not authorized. Please login."
            });
        }

        const token = authHeader.split(' ')[1];
        if (!token) {
            return res.status(401).json({
                success: false,
                message: "Not authorized. Please login."
            });
        }

        try {
            // Verify token
            const decoded = jwt.verify(token, process.env.JWT_SECRET);
            if (!decoded || !decoded.id) {
                return res.status(401).json({
                    success: false,
                    message: "Invalid token. Please login again."
                });
            }

            // Get company from token
            const company = await Company.findById(decoded.id).select('-password');
            if (!company) {
                return res.status(401).json({
                    success: false,
                    message: "Company not found. Please login again."
                });
            }

            // Add company to request
            req.company = company;
            next();
        } catch (jwtError) {
            console.error('JWT verification error:', jwtError);
            return res.status(401).json({
                success: false,
                message: "Invalid token. Please login again."
            });
        }
    } catch (error) {
        console.error('Auth middleware error:', error);
        return res.status(500).json({
            success: false,
            message: "Authentication error. Please try again."
        });
    }
};