import { z } from "zod";

export const registerSchema = z.object({
    email : z.string().email(),
    password :z.string().min(8).max(100),
    displayName : z.string().min(2),
    role : z.enum(["admin" , "interviewer" , "candidate"]).optional(),
});

export const loginSchema = z.object({
    email : z.string().email(),
    password : z.string().min(8).max(100)
})

export const refreshTokenSchema=z.object({
    refreshToken : z.string().min(1),
})

export const verifyEmailSchema = z.object({
    token : z.string().min(1),
})

export const forgotPasswordSchema = z.object({
    email : z.string().trim().toLowerCase().email(),
})

export const resetPasswordSchema = z.object({
    token : z.string().min(1),
    password : z.string(),
})