import { Router } from "express";
import { requireAuth } from "../middleware/requireAuth";
import { validateBody } from "../middleware/validate";
import { generateSchema, chatSchema } from "../validators/ai.schema";
import { generate, chat } from "../controllers/ai.controller";

const router = Router();

router.post("/generate", requireAuth, validateBody(generateSchema), generate);
router.post("/chat", validateBody(chatSchema), chat);

export default router;