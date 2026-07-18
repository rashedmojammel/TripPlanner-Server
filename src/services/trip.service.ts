import { Trip } from "../models/Trip";
import { ListTripsQuery } from "../validators/trip.schema";

export function buildFilterQuery(q: ListTripsQuery): Record<string, unknown> {
  const filter: Record<string, unknown> = {};

  if (q.search) {
    const regex = new RegExp(q.search.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i");
    filter.$or = [{ title: regex }, { destination: regex }];
  }
  if (q.category) filter.category = q.category;
  if (q.minPrice !== undefined || q.maxPrice !== undefined) {
    const price: Record<string, number> = {};
    if (q.minPrice !== undefined) price.$gte = q.minPrice;
    if (q.maxPrice !== undefined) price.$lte = q.maxPrice;
    filter.price = price;
  }
  return filter;
}

const SORT_MAP: Record<ListTripsQuery["sort"], Record<string, 1 | -1>> = {
  price_asc: { price: 1 },
  price_desc: { price: -1 },
  rating: { rating: -1 },
  newest: { createdAt: -1 },
};

export async function listTrips(q: ListTripsQuery) {
  const filter = buildFilterQuery(q);
  const skip = (q.page - 1) * q.limit;

  const [data, total] = await Promise.all([
    Trip.find(filter).sort(SORT_MAP[q.sort]).skip(skip).limit(q.limit).lean(),
    Trip.countDocuments(filter),
  ]);

  return {
    data,
    total,
    page: q.page,
    totalPages: Math.max(1, Math.ceil(total / q.limit)),
  };
}