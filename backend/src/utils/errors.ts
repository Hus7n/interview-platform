import { env } from "../config/env.js";
export type ErrorCode = 
| "BAD_REQUEST"
| "UNAUTHORIZED"
| "FORBIDDEN"
| "NOT_FOUND"
| "CONFLICT"
| "VALIDATION_ERROR"
| "WEAK_PASSWORD"
| "INVALID_TOKEN"
| "EMAIL_NOT_VERIFIED"
| "ACCOUNT_DISABLED"
| "TOKEN_EXPIRED"
| "DATABASE_ERROR"
| "RATE_LIMITED"
| "FILE_TOO_LARGE"
| "INVALID_FILE_TYPE"
| "INTERNAL_SERVER_ERROR";

export type ApiError = {
    statusCode : number;
    code : ErrorCode;
    message: string;
    expose : boolean;
    stack ?: string | undefined;
};

export function createError(message : string, 
                            statusCode = 500 , 
                            code : ErrorCode = "INTERNAL_SERVER_ERROR" , expose = statusCode < 500) :ApiError {
    const stack = new Error(message).stack;
    return{
        statusCode,
        code,
        message,
        expose,
        stack,
    };
}

export function badRequest(message = "Bad request", code : ErrorCode = "BAD_REQUEST"){
    return createError(message , 400 , code);
}

export function unauthorized(message = "Unauthorized" , code : ErrorCode = "UNAUTHORIZED"){
    return createError(message , 401 , code);
    
}

export function forbidden(message ="Forbidden" , code : ErrorCode = "FORBIDDEN"){
    return createError(message , 403 , code);
}

export function notFound(message = "Not found" , code : ErrorCode = "NOT_FOUND"){
    return createError(message , 404 , code);
}

export function conflict(message = "Conflict" , code : ErrorCode = "CONFLICT"){
    return createError(message , 409 , code);
}

export function validationError (message = "Validation error" ,code : ErrorCode = "VALIDATION_ERROR"){
    return createError(message , 400 , code);
}

export function emailNotVerified(message = "Email is not verified" , code : ErrorCode = "EMAIL_NOT_VERIFIED"){
    return createError(message , 403 , code);
}

export function accountDisabled(message = "Account is disabled" , code : ErrorCode = "ACCOUNT_DISABLED"){
    return createError(message , 403 , code);
}

export function tokenExpired(message = "Token has expired" , code : ErrorCode = "TOKEN_EXPIRED"){
    return createError(message , 401 , code)
}
export function databaseError(message = "Database error" , code : ErrorCode = "DATABASE_ERROR"){
    return createError(message , 500 , code)
}
export function rateLimited(message = "Too many request" , code : ErrorCode ="RATE_LIMITED"){
    return createError(message , 429 , code)
}
export function fileTooLarge(message = "File is too large" , code : ErrorCode ="FILE_TOO_LARGE"){
    return createError(message , 413 , code)
}
export function invalidFileType(message : "Invalid file type" , code : ErrorCode = "INVALID_FILE_TYPE"){
    return createError (message , 415 , code)
}
export function isApiError(error : unknown) : error is ApiError{
    if(typeof error !== "object" || error === null){
        return false;
    }
    const candidate = error as Record<string , unknown>;
    return(
        typeof candidate.statusCode === "number" &&
        Number.isInteger(candidate.statusCode) &&
        candidate.statusCode >= 400 &&
        candidate.statusCode <= 599 &&
        typeof candidate.code === "string" &&
        typeof candidate.message === "string" &&
        typeof candidate.expose === "boolean" &&
        (candidate.stack === undefined || typeof candidate.stack === "string")
    );
}

const DEFAULT_CODE_BY_STATUS : Partial<Record<number , ErrorCode>> = {
    400 : "BAD_REQUEST",
    401 : "UNAUTHORIZED",
    403 : "FORBIDDEN",
    404 : "NOT_FOUND",
    409 : "CONFLICT",
    413 : "FILE_TOO_LARGE",
    415 : "INVALID_FILE_TYPE",
    429 : "RATE_LIMITED",
};

/**
 * Several modules raise ad-hoc errors as `Object.assign(new Error(msg), {statusCode})`
 * to avoid a circular import on the HTTP helpers. Those never carry `expose`,
 * so they used to fail the `isApiError` shape check and collapse into a blanket
 * "Internal server error" 500 - hiding messages such as the password-policy
 * failures that the client genuinely needs to show. Honour the status they
 * declare and expose any 4xx message.
 */
function normalizeError(error : unknown) : ApiError | null{
    if(isApiError(error)){
        return error;
    }

    if(error instanceof Error){
        const candidate = error as Error & {statusCode ?: unknown; code ?: unknown};
        const statusCode = typeof candidate.statusCode === "number"
            ? candidate.statusCode
            : 500;

        if(statusCode >= 400 && statusCode <= 599){
            return{
                statusCode,
                code : typeof candidate.code === "string"
                    ? (candidate.code as ErrorCode)
                    : DEFAULT_CODE_BY_STATUS[statusCode] ?? "INTERNAL_SERVER_ERROR",
                message : candidate.message,
                expose : statusCode < 500,
                stack : candidate.stack,
            };
        }
    }

    return null;
}

export function errorResponse(error : unknown){
    const isDevelopment = env.nodeEnv !== "production";
    const normalized = normalizeError(error);

    if(normalized){
        const body:{
            error : ErrorCode;
            message : string;
            stack ?: string;
        }={
            error : normalized.code,
            message : normalized.expose ? normalized.message : "Internal server error",
        };
        if(isDevelopment && normalized.stack){
            body.stack = normalized.stack;
        }
        return{
            statusCode : normalized.statusCode,
            body,
        };
    }
    const body : {
        error : "INTERNAL_SERVER_ERROR";
        message : string ;
        stack ?: string;
    }={
        error : "INTERNAL_SERVER_ERROR",
        message : "Internal server error",
    };

    if(isDevelopment && error instanceof Error && error.stack){
        body.stack = error.stack;
    }
    return{
        statusCode : 500,
        body,
    };
}

