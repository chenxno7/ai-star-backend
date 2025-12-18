import { Request, Response, NextFunction } from 'express';

export interface AuthRequest extends Request {
  user?: {
    openid: string;
  };
}

export const authMiddleware = (req: AuthRequest, res: Response, next: NextFunction) => {
  const openid = req.headers['x-wx-openid'] as string;
  const debugOpenid = req.headers['x-debug-openid'] as string;

  // In production (WeChat Cloud), x-wx-openid is trusted.
  // In development, we might use x-debug-openid if configured.
  
  const finalOpenid = openid || (process.env.NODE_ENV === 'development' ? debugOpenid : null);

  if (finalOpenid) {
    req.user = { openid: finalOpenid };
    next();
  } else {
    // If no openid is found, we might want to reject, 
    // BUT for some public endpoints (if any), we might allow.
    // However, this app seems fully user-centric.
    // Let's block by default for API routes.
    res.status(401).json({ code: 401, message: 'Unauthorized: Missing OpenID' });
  }
};
