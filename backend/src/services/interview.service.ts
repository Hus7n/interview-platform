import { nanoid } from 'nanoid';
import { interviewRepository } from '../repositories/interview.repository';
import { notificationRepository } from '../repositories/notification.repository';
import { AppError } from '../utils/errors';

export const interviewService = {
  async create(
    data: {
      title: string;
      description?: string;
      scheduledAt: string;
      durationMinutes: number;
      language: string;
      interviewerId: string;
      candidateId: string;
    },
    createdBy: string
  ) {
    const roomId = nanoid(10);
    const interview = await interviewRepository.create({
      ...data,
      roomId,
      createdBy,
    });

    await notificationRepository.create(
      data.candidateId,
      `Interview scheduled: ${data.title} on ${new Date(data.scheduledAt).toLocaleString()}`
    );
    await notificationRepository.create(
      data.interviewerId,
      `You are assigned to interview: ${data.title}`
    );

    return interview;
  },

  async list(userId: string, role: string) {
    if (role === 'admin') return interviewRepository.findAll();
    return interviewRepository.findForUser(userId);
  },

  async get(id: string, userId: string, role: string) {
    const interview = await interviewRepository.findById(id);
    if (!interview) throw new AppError(404, 'Interview not found');

    if (role !== 'admin') {
      const isParticipant = await interviewRepository.isParticipant(id, userId);
      if (!isParticipant) throw new AppError(403, 'Forbidden');
    }

    const participants = await interviewRepository.getParticipants(id);
    return { ...interview, participants };
  },

  async getByRoom(roomId: string, userId: string) {
    const interview = await interviewRepository.findByRoomId(roomId);
    if (!interview) throw new AppError(404, 'Interview not found');

    const isParticipant = await interviewRepository.isParticipantByRoom(roomId, userId);
    if (!isParticipant) throw new AppError(403, 'Forbidden');

    const participants = await interviewRepository.getParticipants(interview.id);
    return { ...interview, participants };
  },

  async update(
    id: string,
    data: {
      title?: string;
      scheduledAt?: string;
      status?: string;
      description?: string;
      durationMinutes?: number;
      language?: string;
    },
    userId: string,
    role: string
  ) {
    const interview = await interviewRepository.findById(id);
    if (!interview) throw new AppError(404, 'Interview not found');

    if (interview.status === 'cancelled') {
      throw new AppError(400, 'Cannot update a cancelled interview');
    }

    if (role !== 'admin' && interview.created_by !== userId) {
      throw new AppError(403, 'Forbidden');
    }

    const updated = await interviewRepository.update(id, {
      title: data.title,
      scheduled_at: data.scheduledAt,
      status: data.status,
      description: data.description,
      duration_minutes: data.durationMinutes,
      language: data.language,
    });

    const participants = await interviewRepository.getParticipants(id);
    for (const p of participants) {
      await notificationRepository.create(p.user_id, `Interview updated: ${interview.title}`);
    }

    return updated;
  },

  async cancel(id: string, userId: string, role: string) {
    const interview = await interviewRepository.findById(id);
    if (!interview) throw new AppError(404, 'Interview not found');

    if (interview.status === 'cancelled') {
      throw new AppError(400, 'Interview is already cancelled');
    }

    if (role !== 'admin' && interview.created_by !== userId) {
      throw new AppError(403, 'Forbidden');
    }

    const updated = await interviewRepository.update(id, { status: 'cancelled' });

    const participants = await interviewRepository.getParticipants(id);
    for (const p of participants) {
      await notificationRepository.create(p.user_id, `Interview cancelled: ${interview.title}`);
    }

    return updated;
  },
};
