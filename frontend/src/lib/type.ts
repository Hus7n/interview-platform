export type Role = "admin" | "interviewer" | "candidate";
export type InterviewStatus =
  | "scheduled"
  | "in_progress"
  | "completed"
  | "cancelled";

export type User = {
  id: string;
  email: string;
  role: Role;
  displayName?: string | null;
  display_name?: string | null;
  avatarUrl?: string | null;
  avatar_url?: string | null;
  emailVerified?: boolean;
  email_verified?: boolean;
  isActive?: boolean;
  is_active?: boolean;
  createdAt?: string;
  created_at?: string;
  updatedAt?: string;
  updated_at?: string;
  lastLoginAt?: string | null;
  last_login_at?: string | null;
};
export type Interview = {
  id: string;
  title: string;
  description: string | null;
  scheduledAt: string;
  scheduled_at?: string;
  durationMinutes: number;
  duration_minutes?: number;
  status: InterviewStatus;
  roomId: string;
  room_id?: string;
  language: string;
  starterCode: string | null;
  starter_code?: string | null;
  createdBy: string;
  created_by?: string;
  participantCount: number;
  participant_count?: number;
  createdAt?: string;
  created_at?: string;
  updatedAt?: string;
  updated_at?: string;
};
export type Participant = {
  user_id: string;
  role: "interviewer" | "candidate";
  display_name?: string;
  email?: string;
};

/**
 * Mirrors the backend `InviteResult`. `emailDelivered` is authoritative: when
 * SMTP is unconfigured it is false and the UI must say so rather than implying
 * the candidate was emailed.
 */
export type InviteResult = {
  userId: string;
  email: string;
  displayName: string;
  role: "interviewer" | "candidate";
  notifiedInApp: boolean;
  emailDelivered: boolean;
  emailReason?: string;
  joinUrl: string;
};

export type CreateInterviewResponse = Interview & {
  invites: InviteResult[];
  skipped: { userId: string; reason: string }[];
};
export type Notification = {
  id: string;
  title?: string;
  message: string;
  type?: string;
  isRead?: boolean;
  is_read?: boolean;
  readAt?: string | null;
  read_at?: string | null;
  createdAt?: string;
  created_at?: string;
};
export type Pagination = {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
};

export const userName = (u: User) => u.displayName ?? u.display_name ?? u.email;
export const userActive = (u: User) => u.isActive ?? u.is_active ?? true;
