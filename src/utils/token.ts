import jwt from "jsonwebtoken";
import { env } from "../config/env.js";
import { Role } from "../config/constants.js";

export interface TokenPayload {
    userId: string;
    role: Role;
}

export function signAccessToken(payload: TokenPayload): string {
    return jwt.sign(payload, env.JWT_ACCESS_SECRET, {
        expiresIn: env.JWT_ACCESS_EXPIRES_IN,
    } as jwt.SignOptions);
}

export function signRefreshToken(payload: TokenPayload): string {
    return jwt.sign(payload, env.JWT_REFRESH_SECRET, {
        expiresIn: env.JWT_REFRESH_EXPIRES_IN,
    } as jwt.SignOptions);
}

export function verifyAccessToken(token: string): TokenPayload {
    return jwt.verify(token, env.JWT_ACCESS_SECRET) as TokenPayload;
}

export function verifyRefreshToken(token: string): TokenPayload {
    return jwt.verify(token, env.JWT_REFRESH_SECRET) as TokenPayload;
}