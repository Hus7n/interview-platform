import { Router } from "express";
import { authenticate } from "../middleware/auth.middleware.js";
import { notesController } from "../controllers/note.controller.js";

export const notesRouter = Router({ mergeParams: true });

notesRouter.use(authenticate);

notesRouter.post("/", notesController.createNote);
notesRouter.get("/", notesController.listNotes);
notesRouter.get("/:noteId", notesController.getNote);
notesRouter.patch("/:noteId", notesController.updateNote);
notesRouter.delete("/:noteId", notesController.deleteNote);
