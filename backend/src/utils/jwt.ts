import jwt from 'jsonwebtoken';
import { SignOptions } from 'jsonwebtoken';

const JWT_SECRET: string = process.env.JWT_SECRET || 'your-secret-key';
const JWT_EXPIRES_IN: string | number = process.env.JWT_EXPIRES_IN || '7d';

export interface JWTPayload {
  userId: string;
  email: string;
  role: string;
}

export function generateToken(payload: JWTPayload): string {
  const options: SignOptions = { expiresIn: JWT_EXPIRES_IN };
  return jwt.sign(payload, JWT_SECRET, options);
}

export function verifyToken(token: string): JWTPayload {
  return jwt.verify(token, JWT_SECRET) as JWTPayload;
}
