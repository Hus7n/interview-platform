import { adminRepository } from "../repositories/admin.repository.js";
import type { AdminListUsersInput, AdminUpdateUserInput } from "../validators/admin.schema.js";
import { notFound } from "../utils/error.js";

export const adminService = {
    async listUsers(filters: AdminListUsersInput) {
        const [users, total] = await Promise.all([
            adminRepository.findUsers(filters),
            adminRepository.countUsers(filters),
        ]);

        return {
            users,
            pagination: {
                page: filters.page,
                limit: filters.limit,
                total,
                totalPages: Math.ceil(total / filters.limit),
            },
        };
    },

    async updateUser(userId: string, input: AdminUpdateUserInput) {
        const user = await adminRepository.updateUser(userId, { role: input.role, is_active: input.is_active });
        if (!user) throw notFound("User not found");
        return user;
    },

    async deleteUser(userId: string) {
        const user = await adminRepository.deleteUser(userId);
        if (!user) throw notFound("User not found");
        return user;
    },

    async getUser(userId: string) {
        const user = await adminRepository.findUserById(userId);
        if (!user) throw notFound("User not found");
        return user;
    },

    async listAllInterviews(filters: { page: number; limit: number; status?: string | undefined }) {
        const [interviews, total] = await Promise.all([
            adminRepository.getAllInterviews(filters),
            adminRepository.countAllInterviews(filters.status),
        ]);

        return {
            interviews,
            pagination: {
                page: filters.page,
                limit: filters.limit,
                total,
                totalPages: Math.ceil(total / filters.limit),
            },
        };
    },
};
