import bcrypt from "bcrypt";
import { env } from "../config/env.js";
import {badRequest} from "./error.js";

const MIN_PASSWORD_LENGTH = 8;
const MAX_PASSWORD_LENGTH = 128;
const SPECIAL_CHARACTER_REGEX = /[@$!%*?&]/;

export type PasswordValidationResult = {
    valid : boolean;
    message ?: string;
};

export function validatePassword(password : string):PasswordValidationResult{
    if(typeof password !== "string"){
        return {valid : false , message : "Password is required"};
    }

    if(password.length < MIN_PASSWORD_LENGTH){
        return{
            valid : false , 
            message : `Password must be at least ${MIN_PASSWORD_LENGTH} characters long`
        };
    }

    if(password.length > MAX_PASSWORD_LENGTH){
        return{
            valid : false ,
            message : `Password must be no more than ${MAX_PASSWORD_LENGTH} characters long`
        };
    }

    if(!/[A-Z]/.test(password)){
        return{
            valid : false ,
            message : `Password must include at least one uppercase letter`
        };
    }

    if(!/[a-z]/.test(password)){
        return{
            valid : false ,
            message :  `Password must include at least one lowercase letter`
        }
    };

    if(!/\d/.test(password)){
        return{
            valid : false ,
            message : "Password must include at least one number"
        }
    };

    if(!SPECIAL_CHARACTER_REGEX.test(password)){
        return{
            valid : false ,
            message : "Password must include at least one special character"
        };
    }
    return {valid : true};
}

export async function hashPassword(password : string) : Promise<string>{
    const result = validatePassword(password);
    if(!result.valid){
        throw badRequest(result.message ?? "Invalid Password" , "WEAK_PASSWORD");
    }
    return bcrypt.hash(password , env.passwordSaltRounds);
}

export async function comparePassword(password : string , passwordHash : string ) : Promise<boolean>{
    if(!password || !passwordHash){
        return false;
    }
    return bcrypt.compare(password , passwordHash);
}