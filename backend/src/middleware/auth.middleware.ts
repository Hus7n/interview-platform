import type { NextFunction , Request , Response } from "express";
import { authRepository } from "../repositories/auth.repository.js";
import type {UserRecord , UserRole} from "../types/user.js";
import { accountDisabled , forbidden , unauthorized } from "../utils/error.js";
import { verifyAccessToken } from "../utils/token.js";
import { isAccountDisabled } from "../utils/user.js";

export type AuthenticatedUser = {
    userId : string;
    role : UserRole;
};

function getAccessToken(req : Request){
    const header = req.header("authorization");
    if(!header ?.startsWith("Bearer ")){
        return null;
    }
    return header.slice("Bearer".length).trim();
}

async function loadActiveUser(userId : string){
    const user = (await authRepository.findById(userId)) as UserRecord | null;
    if(!user){
        throw unauthorized("Invalid access token");
    }
    if(isAccountDisabled(user)){
        throw accountDisabled();
    }
    return user;
}

export async function authenticate(req : Request , _res : Response , next : NextFunction){
    try{
        const token = getAccessToken(req);
        if(!token){
            throw unauthorized("Access token is required");
        }
        const payload = verifyAccessToken(token);
        const user = await loadActiveUser(payload.userId);

        req.user = {
            userId : user.id,
            role: user.role,
        };
        next();
    }catch(error){
        next(error);
    }
}

export async function optionalAuthenticate(req : Request , _res : Response , next : NextFunction){
    try{
        const token = getAccessToken(req);
        if(!token){
            next();
            return;
        }
        const payload = verifyAccessToken(token);
        const user = await loadActiveUser(payload.userId);

        req.user = {
            userId : user.id,
            role : user.role,
        };
        next();
    }catch(error){
        next(error)
    }
}

export function authorize(...allowedRole : UserRole[]){
    return (req : Request , _res : Response , next : NextFunction) => {
        if(!req.user){
            next(unauthorized("Authentication is required"));
            return;
        }
        if(!allowedRole.includes(req.user.role)){
            next(forbidden("You do not have permission to access this resource"));
            return;
        }
        next();
    };
}
