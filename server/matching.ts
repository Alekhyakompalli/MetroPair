import { randomUUID } from "node:crypto";
import type {
  CommuterDetails,
  CommuterSubmission,
  MatchResult,
  MetroLine,
} from "../src/domain.js";
import { STATIONS } from "./data/stations.js";

const submissions = new Map<string, CommuterSubmission & { matchedWithId?: string }>();

export function createSubmission(details: CommuterDetails): CommuterSubmission {
  const submission: CommuterSubmission = {
    id: randomUUID(),
    name: details.name.trim(),
    metroLine: details.metroLine,
    destination: details.destination,
    createdAt: new Date().toISOString(),
    matched: false,
  };
  submissions.set(submission.id, submission);
  return { ...submission };
}

export function findAvailableMatch(submissionId: string): MatchResult {
  const current = submissions.get(submissionId);
  if (!current) {
    throw new Error("Commuter submission was not found.");
  }

  if (current.matchedWithId) {
    const existingMatch = submissions.get(current.matchedWithId);
    return { submission: { ...current }, match: existingMatch ? { ...existingMatch } : null };
  }

  const candidate = [...submissions.values()].find(
    (entry) =>
      entry.id !== submissionId &&
      entry.metroLine === current.metroLine &&
      !entry.matched,
  );

  if (!candidate) {
    return { submission: { ...current }, match: null };
  }

  current.matched = true;
  candidate.matched = true;
  current.matchedWithId = candidate.id;
  candidate.matchedWithId = current.id;
  return { submission: { ...current }, match: { ...candidate } };
}

export function getMatchStatus(submissionId: string): MatchResult {
  const current = submissions.get(submissionId);
  if (!current) {
    throw new Error("Commuter submission was not found.");
  }
  const match = current.matchedWithId
    ? submissions.get(current.matchedWithId) ?? null
    : null;
  return { submission: { ...current }, match: match ? { ...match } : null };
}

export function isValidLine(value: unknown): value is MetroLine {
  return value === "Blue" || value === "Green" || value === "Red";
}

export function isValidDestination(line: MetroLine, destination: unknown): destination is string {
  return typeof destination === "string" && STATIONS[line].includes(destination);
}
