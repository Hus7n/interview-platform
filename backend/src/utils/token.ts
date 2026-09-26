import { createHash , randomBytes , timingSafeEqual } from "node:crypto";
import jwt from "jsonwebtoken";
import {env} from "../config/env.js";
import {badRequest , unauthorized} from "./errors.js";

export type JwtUserRole = "admin" | "interviewer" | "candidate";

export type AuthTokenPayload = {
    userId : string ;
    role : JwtUserRole;
};

const DEFAULT_TOKEN_BYTES = 32;
const ACCESS_TOEKN_EXPIRES_IN = "15m";
const REFRESH_TOKEN_EXPIRES_IN = "7d";
const JWT_USER_ROLES : ReadonlySet<JwtUserRole> = new Set(["admin" , "interviewer" , "candidate"]);

type TokenType = "access" | "refresh";

type SignedAuthTokenPayload = AuthTokenPayload & {
    tokenType : TokenType;
};

function isJwtUserRole(role:unknown) : role is JwtUserRole{
    return typeof role === "string" && JWT_USER_ROLES.has(role as JwtUserRole);
}

function isSignedAuthtokenPayload(payload : string | jwt.JwtPayload,
                                 tokenType : TokenType
) : payload is jwt.JwtPayload & SignedAuthTokenPayload{
    return(
        typeof payload === "object" &&
        typeof payload.userId === "string" &&
        isJwtUserRole(payload.role) &&
        payload.tokenType === tokenType
    );
}

function verifyJwt(token : string) : string | jwt.JwtPayload{
    try{
        return jwt.verify(token , env.jwtSecret);
    }catch{
        throw unauthorized("Invalid or expired token" , "INVALID_TOKEN");
    }
}

export function generateToken(byteLength = DEFAULT_TOKEN_BYTES) : string{
    if(!Number.isInteger(byteLength) || byteLength < 16){
        throw badRequest("Token byte length must be at least 16" , "INVALID_TOKEN");
    }
    return randomBytes(byteLength).toString("base64url");
}

export function hashToken(token : string) : string {
    if(!token){
        throw badRequest("Token is required " , "INVALID_TOKEN");
    }
    return createHash("sha256").update(token , "utf-8").digest("hex");
}

export function compareTokenHash(token : string , tokenHash : string) : boolean{
    if(!token || !tokenHash){
        return false;
    }

    const currentHash = hashToken(token);
    const currentBuffer = Buffer.from(currentHash,"hex");
    const savedBuffer = Buffer.from(tokenHash,"hex");

    if(currentBuffer.length !== savedBuffer.length){
        return false;
    }
    return timingSafeEqual(currentBuffer , savedBuffer);
}

export function expiresInMinutes(minutes:number):Date{
    if(!Number.isFinite(minutes) || minutes <= 0){
        throw badRequest("Expiry hours must be greater than 0" , "BAD_REQUEST");
    }
    return new Date(Date.now() + minutes * 60 * 1000);
}

export function expireInHours(hours:number) : Date {
    if(!Number.isFinite(hours) || hours <= 0){
        throw badRequest("Expiry ours must be greater than 0" , "BAD_REQUEST");
    }
    return new Date(Date.now() + hours * 60 * 60 * 1000);
}

export function expiresInDays(days : number) : Date{
    if(!Number.isFinite(days) || days <= 0){
        throw badRequest("Expiary days must be greater than 0" , "BAD_REQUEST");
    }
    return new Date(Date.now() + days * 24 * 60 * 60 * 1000);
}

export function generateAccessToken(payload : AuthTokenPayload) : string {
    return jwt.sign({...payload , tokenType : "access"},env.jwtSecret,{
        expiresIn : ACCESS_TOEKN_EXPIRES_IN,
    });
}

export function generateRefreshToken(payload : AuthTokenPayload) : string{
    return jwt.sign({...payload , tokenType : "refresh"},env.jwtSecret,{
        expiresIn:REFRESH_TOKEN_EXPIRES_IN,
    });
}

export function verifyAccessToken(token:string):AuthTokenPayload{
    const payload = verifyJwt(token);
    if(!isSignedAuthtokenPayload(payload,"access")){
        throw unauthorized("Invalid refresh token" , "INVALID_TOKEN")
    }
    return{
        userId:payload.userId,
        role:payload.role,
    };
}

export function verifyRefreshToken(token:string):AuthTokenPayload{
    const payload = verifyJwt(token);
    if(!isSignedAuthtokenPayload(payload,"refresh")){
        throw unauthorized("Invalid refresh token","INVALID_TOKEN")
    }
    return{
        userId:payload.userId,
        role:payload.role,
    };
}