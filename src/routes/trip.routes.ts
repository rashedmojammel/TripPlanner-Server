import { Router } from "express";
import { requireAuth } from "../middleware/requireAuth";
import { validateBody, validateQuery } from "../middleware/validate";
import { createTripSchema, listTripsQuerySchema } from "../validators/trip.schema";
import {
  getTrips,
  getMyTrips,
  getTripById,
  createTrip,
  deleteTrip,
} from "../controllers/trip.controller";

const router = Router();

router.get("/", validateQuery(listTripsQuerySchema), getTrips);
router.get("/mine", requireAuth, getMyTrips); // BEFORE /:id
router.get("/:id", getTripById);
router.post("/", requireAuth, validateBody(createTripSchema), createTrip);
router.delete("/:id", requireAuth, deleteTrip);

export default router;