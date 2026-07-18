import { Schema, model, Document } from "mongoose";

export const TRIP_CATEGORIES = [
  "adventure",
  "beach",
  "cultural",
  "city-break",
  "nature",
] as const;
export type TripCategory = (typeof TRIP_CATEGORIES)[number];

export interface ITrip extends Document {
  title: string;
  shortDescription: string;
  fullDescription: string;
  imageUrl: string;
  destination: string;
  price: number;
  durationDays: number;
  category: TripCategory;
  rating: number;
  startDate: Date;
  createdBy: string;
}

const tripSchema = new Schema<ITrip>(
  {
    title: { type: String, required: true, trim: true, maxlength: 120 },
    shortDescription: { type: String, required: true, maxlength: 200 },
    fullDescription: { type: String, required: true },
    imageUrl: { type: String, required: true },
    destination: { type: String, required: true, trim: true },
    price: { type: Number, required: true, min: 0 },
    durationDays: { type: Number, required: true, min: 1 },
    category: { type: String, required: true, enum: TRIP_CATEGORIES },
    rating: { type: Number, default: 4.5, min: 0, max: 5 },
    startDate: { type: Date, required: true },
    createdBy: { type: String, required: true, index: true },
  },
  { timestamps: true }
);

tripSchema.index({ category: 1, price: 1 });

export const Trip = model<ITrip>("Trip", tripSchema);