import { Router } from "express";
import { authenticate } from "../middleware/auth.middleware.js";
import { searchController } from "../controllers/search.controller.js";

export const searchRouter = Router();

searchRouter.use(authenticate);

searchRouter.get("/", searchController.global);
