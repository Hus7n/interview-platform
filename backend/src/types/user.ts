export type UserRole = "admin" | "interviewer" | "candidate";

export type AuthUser = {
    userId: string;
    role: UserRole;
};

export type UserRecord = {
    id : string ;
    email : string ;
    password_hash : string;
    role : UserRole;
    is_active : boolean;
    display_name ?: string | null;
    avatar_url ?: string | null;
    resume_url ?: string | null;
    resume_original_name ?: string | null;
    email_verified ?:boolean;
    created_at ?: Date | string ;
    updated_at ?: Date | string;
    last_login_at ?: Date | string | null;
};

export type SafeUser = {
    id : string ;
    email : string;
    role : UserRole ;
    displayName : string | null;
    avatarUrl : string | null;
    resumeUrl : string | null;
    resumeOriginalName : string | null;
    emailVerified : boolean ;
    isActive : boolean ;
    createdAt ?: Date | string;
    updatedAt ?: Date | string;
    lastLoginAt : Date | string | null;
};