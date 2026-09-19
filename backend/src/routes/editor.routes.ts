import { Router } from "express";
import { authenticate } from "../middleware/auth.middleware.js";
import { editorController } from "../controllers/editor.controller.js";

export const editorRouter = Router();

editorRouter.use(authenticate);

editorRouter.get("/:id/code", editorController.getCode);
editorRouter.put("/:id/code", editorController.saveCode);
editorRouter.post("/:id/code/restore", editorController.restoreCode);
