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
    await aiService.chatStream(req.body, res);
  } catch (err) {
    // if streaming already started we can't send JSON — just end
    if (res.headersSent) return res.end();
    next(err);
  }
}