import { Trip } from "../models/Trip";

export interface ChatFilters {
  category?: string;
  maxPrice?: number;
  minDays?: number;
  maxDays?: number;
  destination?: string;
}

export async function fetchTripsForChat(f: ChatFilters) {
  const filter: Record<string, unknown> = {};

  if (f.category) filter.category = f.category;
  if (f.maxPrice) filter.price = { $lte: f.maxPrice };
  if (f.minDays || f.maxDays) {
    const d: Record<string, number> = {};
    if (f.minDays) d.$gte = f.minDays;
    if (f.maxDays) d.$lte = f.maxDays;
    filter.durationDays = d;
  }
  if (f.destination) {
    filter.destination = new RegExp(
      f.destination.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"),
      "i"
    );
  }

  const select = "title destination price durationDays category rating _id";
  let trips = await Trip.find(filter).select(select).sort({ rating: -1 }).limit(6).lean();

  // Fallback: nothing matched → offer the top-rated trips instead
  if (trips.length === 0) {
    trips = await Trip.find({}).select(select).sort({ rating: -1 }).limit(6).lean();
  }
  return trips;
}