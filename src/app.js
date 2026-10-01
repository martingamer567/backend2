import passport from "passport";
import { initializePassport } from "./config/passport.config.js";
import cookieParser from "cookie-parser";
import express from "express";
import healthRouter from "./routes/health.router.js";
import eventsRouter from "./routes/events.router.js";
import sessionsRouter from "./routes/sessions.router.js";

const app = express();

app.use(express.json());
app.use(cookieParser());
initializePassport();
app.use(passport.initialize());

app.use("/api/health", healthRouter);
app.use("/api/events", eventsRouter);
app.use("/api/sessions", sessionsRouter);

export default app;
