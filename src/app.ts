import express from "express";
import cors from "cors";
import { toNodeHandler } from "better-auth/node";
import { auth } from "./lib/auth";
import { env } from "./config/env";
import { notFound, errorHandler } from "./middleware/errorHandler";
import tripRoutes from "./routes/trip.routes";
import aiRoutes from "./routes/ai.routes";

const app = express();

app.use(
  cors({
    origin: env.CLIENT_URL,
    credentials: true, // REQUIRED for session cookies
  })
);
app.all("/api/auth/{*any}", toNodeHandler(auth));

app.use(express.json({ limit: "1mb" }));

app.get("/api/health", (_req, res) => {
  res.json({ ok: true, timestamp: new Date().toISOString() });
});

app.use("/api/trips", tripRoutes);
app.use("/api/ai", aiRoutes);
app.use(notFound);
app.use(errorHandler);


export default app;