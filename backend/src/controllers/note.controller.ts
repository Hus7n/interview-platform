import type { NextFunction, Request, Response } from "express";
import { notesService } from "../services/notes.service.js";
import {
    CreateNoteSchema,
    InterviewIdParamSchema,
    ListNotesSchema,
    NoteIdSchema,
    UpdateNoteSchema,
} from "../validators/notes.schema.js";
import { parseRequest, getAuthUser } from "../utils/validate.js";

export const notesController = {
    async createNote(req: Request, res: Response, next: NextFunction) {
        try {
            const { interviewId } = parseRequest(InterviewIdParamSchema, req.params);
            const input = parseRequest(CreateNoteSchema, req.body);
            const note = await notesService.createNote(interviewId, input, getAuthUser(req));

            res.status(201).json({
                success: true,
                message: "Note created successfully",
                data: { note },
            });
        } catch (error) {
            next(error);
        }
    },

    async listNotes(req: Request, res: Response, next: NextFunction) {
        try {
            const { interviewId } = parseRequest(InterviewIdParamSchema, req.params);
            const filters = parseRequest(ListNotesSchema, req.query);
            const result = await notesService.listNotes(interviewId, filters, getAuthUser(req));

            res.status(200).json({
                success: true,
                data: result,
            });
        } catch (error) {
            next(error);
        }
    },

    async getNote(req: Request, res: Response, next: NextFunction) {
        try {
            const params = parseRequest(
                InterviewIdParamSchema.extend({ noteId: NoteIdSchema.shape.noteId }),
                req.params
            );
            const note = await notesService.getNote(params.noteId, params.interviewId, getAuthUser(req));

            res.status(200).json({
                success: true,
                data: { note },
            });
        } catch (error) {
            next(error);
        }
    },

    async updateNote(req: Request, res: Response, next: NextFunction) {
        try {
            const params = parseRequest(
                InterviewIdParamSchema.extend({ noteId: NoteIdSchema.shape.noteId }),
                req.params
            );
            const input = parseRequest(UpdateNoteSchema, req.body);
            const note = await notesService.updateNote(params.noteId, params.interviewId, input, getAuthUser(req));

            res.status(200).json({
                success: true,
                message: "Note updated successfully",
                data: { note },
            });
        } catch (error) {
            next(error);
        }
    },

    async deleteNote(req: Request, res: Response, next: NextFunction) {
        try {
            const params = parseRequest(
                InterviewIdParamSchema.extend({ noteId: NoteIdSchema.shape.noteId }),
                req.params
            );
            await notesService.deleteNote(params.noteId, params.interviewId, getAuthUser(req));

            res.status(200).json({
                success: true,
                message: "Note deleted successfully",
            });
        } catch (error) {
            next(error);
        }
    },
};
