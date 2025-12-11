import express, { Request, Response } from "express";
import cors from "cors";
import { gameRouter } from "./routes/game";
import { ghostRouter } from "./routes/ghost";
import { matchmakingRouter } from "./routes/matchmaking";
import { leaguesRouter } from "./routes/leagues";

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Health check
app.get("/api/health", (req: Request, res: Response) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

// Game routes
app.use("/api/game", gameRouter);

// Multiplayer routes
app.use("/api/ghost", ghostRouter);
app.use("/api/multiplayer", matchmakingRouter);
app.use("/api/leagues", leaguesRouter);

// Error handling
app.use((err: Error, req: Request, res: Response, next: Function) => {
  console.error(err.stack);
  res.status(500).json({ error: "Internal server error" });
});

// Start server
app.listen(PORT, () => {
  console.log(`Express server running on http://localhost:${PORT}`);
});

export default app;
