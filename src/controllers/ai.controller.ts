import { Request, Response, NextFunction } from "express";
import * as aiService from "../services/ai.service";

export async function generate(req: Request, res: Response, next: NextFunction) {
  try {
    const result = await aiService.generateDescription(req.body);
    res.json({ data: result });
  } catch (err) {
    next(err);
  }
}

export async function chat(req: Request, res: Response, next: NextFunction) {
  try {
    const reply = await aiService.chat(req.body);
    res.json({ data: { reply } });
  } catch (err) {
    next(err);
  }
}