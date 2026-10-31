import express, { type NextFunction, type Request, type Response } from "express";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createServer as createViteServer } from "vite";
import type { CommuterDetails } from "../src/domain.js";
import { STATIONS, STATION_SOURCE } from "./data/stations.js";
import {
  createSubmission,
  findAvailableMatch,
  getMatchStatus,
  isValidDestination,
  isValidLine,
} from "./matching.js";

const app = express();
const port = Number(process.env.PORT ?? 5000);
const isProduction = process.env.NODE_ENV === "production";
const currentDirectory = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(currentDirectory, isProduction ? "../.." : "..");

app.use(express.json({ limit: "10kb" }));

app.get("/api/health", (_request, response) => {
  response.json({ status: "ok" });
});

app.get("/api/stations", (request, response) => {
  const line = request.query.line;
  if (line === undefined) {
    response.json({ stations: STATIONS, source: STATION_SOURCE });
    return;
  }
  if (!isValidLine(line)) {
    response.status(400).json({ error: "Choose Blue, Green, or Red Line." });
    return;
  }
  response.json({ line, stations: STATIONS[line], source: STATION_SOURCE });
});

app.post("/api/submissions", (request, response) => {
  const { name, metroLine, destination } = request.body ?? {};
  if (typeof name !== "string" || name.trim().length < 2 || name.trim().length > 60) {
    response.status(400).json({ error: "Enter a name between 2 and 60 characters." });
    return;
  }
  if (!isValidLine(metroLine)) {
    response.status(400).json({ error: "Choose Blue, Green, or Red Line." });
    return;
  }
  if (!isValidDestination(metroLine, destination)) {
    response.status(400).json({ error: "Choose a destination on the selected line." });
    return;
  }

  const details: CommuterDetails = {
    name: name.trim(),
    metroLine,
    destination,
  };
  const submission = createSubmission(details);
  response.status(201).json(findAvailableMatch(submission.id));
});

app.post("/api/matches/find", (request, response) => {
  const { submissionId } = request.body ?? {};
  if (typeof submissionId !== "string" || !submissionId) {
    response.status(400).json({ error: "A submission ID is required." });
    return;
  }
  try {
    response.json(findAvailableMatch(submissionId));
  } catch {
    response.status(404).json({ error: "Commuter submission was not found." });
  }
});

app.get("/api/matches/:submissionId", (request, response) => {
  try {
    response.json(getMatchStatus(request.params.submissionId));
  } catch {
    response.status(404).json({ error: "Commuter submission was not found." });
  }
});

app.use((error: unknown, _request: Request, response: Response, _next: NextFunction) => {
  console.error(error);
  response.status(500).json({ error: "The server could not complete that request." });
});

async function start() {
  if (isProduction) {
    app.use(express.static(path.join(projectRoot, "dist/client")));
    app.get(/.*/, (_request, response) => {
      response.sendFile(path.join(projectRoot, "dist/client/index.html"));
    });
  } else {
    const vite = await createViteServer({
      root: projectRoot,
      server: { middlewareMode: true, allowedHosts: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  }

  app.listen(port, "0.0.0.0", () => {
    console.log(`MetroPair listening on port ${port}`);
  });
}

void start();
