import { z } from "zod";
import { TRIP_CATEGORIES } from "../models/Trip";

export const generateSchema = z.object({
  destination: z.string().min(2).max(100),
  durationDays: z.number().int().min(1).max(60),
  category: z.enum(TRIP_CATEGORIES),
  tone: z.enum(["exciting", "relaxing", "luxurious", "budget-friendly"]).default("exciting"),
  length: z.enum(["short", "medium", "long"]).default("medium"),
});
export type GenerateInput = z.infer<typeof generateSchema>;

export const chatSchema = z.object({
  messages: z
    .array(
      z.object({
        role: z.enum(["user", "assistant"]),
        content: z.string().min(1).max(1000),
      })
    )
    .min(1)
    .max(20),
});
export type ChatInput = z.infer<typeof chatSchema>;