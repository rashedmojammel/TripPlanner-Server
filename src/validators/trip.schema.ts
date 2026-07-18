import { z } from "zod";
import { TRIP_CATEGORIES } from "../models/Trip";

export const createTripSchema = z.object({
  title: z.string().min(3).max(120),
  shortDescription: z.string().min(10).max(200),
  fullDescription: z.string().min(30),
  imageUrl: z.string().url(),
  destination: z.string().min(2),
  price: z.number().min(0),
  durationDays: z.number().int().min(1).max(60),
  category: z.enum(TRIP_CATEGORIES),
  startDate: z.coerce.date(),
});
export type CreateTripInput = z.infer<typeof createTripSchema>;

export const listTripsQuerySchema = z.object({
  search: z.string().trim().max(100).optional(),
  category: z.enum(TRIP_CATEGORIES).optional(),
  minPrice: z.coerce.number().min(0).optional(),
  maxPrice: z.coerce.number().min(0).optional(),
  sort: z.enum(["price_asc", "price_desc", "rating", "newest"]).default("newest"),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(24).default(8),
});
export type ListTripsQuery = z.infer<typeof listTripsQuerySchema>;