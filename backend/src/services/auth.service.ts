import { authRepository } from "../repositories/auth.repository.js";
import type { UserRecord , UserRole } from "../types/user.js";
import { comparePassword , hashPassword } from "../utils/password.js";
import {
    expiresInDays,
    expireInHours,
    expiresInMinutes,
    generateAccessToken,
    generateRefreshToken,
    generateToken,
    hashToken,
    verifyRefreshToken
} from "../utils/token.js";
import { isAccountDisabled , sanitizeUser } from "../utils/user.js";
import {
    accountDisabled,
    badRequest,
    conflict,
    emailNotVerified,
    notFound,
    unauthorized
} from "../utils/errors.js";
import { mailService } from "../mail/mail.service.js";

type RegisterInput = {
    email : string;
    password : string;
    displayName : string;
    role ?: UserRole | undefined;
};

type LoginInput = {
    email : string;
    password : string;
};

type ResetPasswordInput = {
    token : string;
    password : string;
};

function normalizeEmail(email : string){
    return email.trim().toLowerCase();
}

function createAuthResponse(user : UserRecord , refreshToken : string){
    const jwtPayload = {
        userId : user.id,
        role: user.role,
    };
    return{
        user: sanitizeUser(user),
        accessToken : generateAccessToken(jwtPayload),
        refreshToken,
    };
}

export const authService = {
    async register({email , password , displayName , role = 'candidate'}:RegisterInput){
        const normalizedEmail = normalizeEmail(email);
        const existingUSer = await authRepository.findByEmail(normalizedEmail);
        if(existingUSer){
            throw conflict("Email is already registered");
        }

        const passwordHash = await hashPassword(password);
        const user = await authRepository.create({
            email : normalizedEmail,
            passwordHash,
            displayName,
            role,
        });

        const verificationToken = generateToken();
        await authRepository.setVerifyToken(user.id , hashToken(verificationToken),expireInHours(24));
        await mailService.sendVerificationEmail(normalizedEmail, displayName, verificationToken).catch(() => {});
        return{
            user:sanitizeUser(user),
        };
    },

    async login({email , password}:LoginInput){
        const user = (await authRepository.findByEmail(normalizeEmail(email))) as UserRecord | null;
        if(!user){
            throw unauthorized("Invalid email or password");
        }

        if(isAccountDisabled(user)){
            throw accountDisabled();
        }

        const passwordMatches = await comparePassword(password , user.password_hash);
        if(!passwordMatches){
            throw unauthorized("Invalid email or password");
        } 

        if(user.email_verified === false){
            throw emailNotVerified();
        }

        const refreshToken = generateRefreshToken({
            userId : user.id,
            role : user.role,
        });

        await authRepository.createSession(user.id , hashToken(refreshToken) , expiresInDays(7));
        await authRepository.updateLastLogin(user.id);
        return createAuthResponse(user , refreshToken);
    },

    async refresh(refreshToken : string){
        if(!refreshToken){
            throw unauthorized("Refresh token is required");
        }

        const payload = verifyRefreshToken(refreshToken);
        const refreshTokenHash = hashToken(refreshToken);
        const session = await authRepository.findSession(refreshTokenHash);

        if(!session){
            throw unauthorized("Invalid or expired refresh token");
        }
        const user = (await authRepository.findById(payload.userId)) as UserRecord | null;
        if(!user){
            await authRepository.deleteSession(refreshTokenHash);
            throw unauthorized("Invalid refresh token");
        }

        if(isAccountDisabled(user)){
            await authRepository.deleteAllSessions(user.id);
            throw accountDisabled();
        }

        const nextRefreshToken = generateRefreshToken({
            userId : user.id,
            role : user.role,
        });

        await authRepository.deleteSession(refreshTokenHash);
        await authRepository.createSession(user.id , hashToken(nextRefreshToken) , expiresInDays(7));
        return createAuthResponse(user , nextRefreshToken);
    },

    async logout(refreshToken : string){
        if(!refreshToken){
            return;
        }
        await authRepository.deleteSession(hashToken(refreshToken));
    },
    async logoutAll(userId : string){
        await authRepository.deleteAllSessions(userId);
    },

    async getMe(userId : string){
        const user = (await authRepository.findById(userId)) as UserRecord | null;
        if(!user){
            throw notFound("User not found");
        }
        if(isAccountDisabled(user)){
            throw accountDisabled()
        }
        return sanitizeUser(user);
    },

    async verifyEmail(token : string){
        if(!token){
            throw badRequest("Verification token is required" , "INVALID_TOKEN");
        }
        const user = (await authRepository.verifyEmailByTokenHash(hashToken(token))) as UserRecord | null;
        if(!user){
            throw unauthorized("Invalid or expired verification token" , "INVALID_TOKEN");
        }
        return sanitizeUser(user);
    },

    async forgotPassword(email:string){
        const user = (await authRepository.findByEmail(normalizeEmail(email))) as UserRecord | null;
        if(!user || isAccountDisabled(user)){
            return;
        }

        const resetToken = generateToken();
        await authRepository.setResetToken(user.id , hashToken(resetToken) , expiresInMinutes(30));
        await mailService.sendResetPasswordEmail(user.email, user.display_name ?? user.email, resetToken).catch(() => {});
    },

    async resetPassword ({token , password} : ResetPasswordInput){
        if(!token){
            throw badRequest("Reset token is required" , "INVALID_TOKEN");
        }

        const user = (await authRepository.findByResetTokenHash(hashToken(token))) as UserRecord | null;
        if(!user){
            throw unauthorized("Invalid or expired reset token" , "INVALID_TOKEN");
        }

        if(isAccountDisabled(user)){
            throw accountDisabled();
        }

        const passwordHash = await hashPassword(password);
        await authRepository.resetPassword(user.id , passwordHash);
    }

}