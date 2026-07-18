import { Request, Response, NextFunction } from "express";
import { isValidObjectId } from "mongoose";
import { Trip } from "../models/Trip";
import { listTrips } from "../services/trip.service";
import { ApiError } from "../utils/ApiError";

export async function getTrips(req: Request, res: Response, next: NextFunction) {
  try {
    const result = await listTrips(res.locals.query);
    res.json(result);
  } catch (err) {
    next(err);
  }
}

export async function getMyTrips(req: Request, res: Response, next: NextFunction) {
  try {
    const data = await Trip.find({ createdBy: req.user!.id })
      .sort({ createdAt: -1 })
      .lean();
    res.json({ data });
  } catch (err) {
    next(err);
  }
}

export async function getTripById(req: Request, res: Response, next: NextFunction) {
  try {
    if (!isValidObjectId(req.params.id)) throw new ApiError(404, "Trip not found");
    const trip = await Trip.findById(req.params.id).lean();
    if (!trip) throw new ApiError(404, "Trip not found");

    const related = await Trip.find({
      category: trip.category,
      _id: { $ne: trip._id },
    })
      .sort({ rating: -1 })
      .limit(4)
      .lean();

    res.json({ data: trip, related });
  } catch (err) {
    next(err);
  }
}

export async function createTrip(req: Request, res: Response, next: NextFunction) {
  try {
    const trip = await Trip.create({ ...req.body, createdBy: req.user!.id });
    res.status(201).json({ data: trip });
  } catch (err) {
    next(err);
  }
}

export async function deleteTrip(req: Request, res: Response, next: NextFunction) {
  try {
    if (!isValidObjectId(req.params.id)) throw new ApiError(404, "Trip not found");
    const trip = await Trip.findById(req.params.id);
    if (!trip) throw new ApiError(404, "Trip not found");
    if (trip.createdBy !== req.user!.id)
      throw new ApiError(403, "You can only delete your own trips");

    await trip.deleteOne();
    res.json({ success: true, message: "Trip deleted" });
  } catch (err) {
    next(err);
  }
}