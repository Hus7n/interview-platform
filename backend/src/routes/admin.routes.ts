import { Router } from "express";
import { authenticate, authorize } from "../middleware/auth.middleware.js";
import { adminController } from "../controllers/admin.controller.js";

export const adminRouter = Router();

adminRouter.use(authenticate);
adminRouter.use(authorize("admin"));

adminRouter.get("/users", adminController.listUsers);
adminRouter.get("/users/:id", adminController.getUser);
adminRouter.patch("/users/:id", adminController.updateUser);
adminRouter.delete("/users/:id", adminController.deleteUser);

adminRouter.get("/interviews", adminController.listInterviews);
