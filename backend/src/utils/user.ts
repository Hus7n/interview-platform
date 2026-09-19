import type { SafeUser , UserRecord } from "../types/user.js";
export function isUserActive(user : Pick<UserRecord ,"is_active">){
    return user.is_active === true;
}
export function isAccountDisabled(user:Pick<UserRecord , "is_active">){
    return !isUserActive(user);
}

export function sanitizeUser(user : UserRecord) : SafeUser{
    return{
        id:user.id,
        email:user.email,
        role:user.role,
        displayName:user.display_name ?? null,
        avatarUrl : user.avatar_url ?? null,
        emailVerified : user.email_verified ?? false,
        isActive :user.is_active,
        createdAt : user.created_at ?? new Date(),
        updatedAt : user.updated_at ?? new Date(),
        lastLoginAt : user.last_login_at ?? null,
    };
}