import { randomUUID } from "node:crypto";
import type {
  CommuterDetails,
  CommuterSubmission,
  CompanionPreference,
  GenderIdentity,
  MatchResult,
  MetroLine,
  PublicCommuterSubmission,
} from "../src/domain.js";
import { STATIONS } from "./data/stations.js";

type StoredSubmission = CommuterSubmission & { matchedWithId?: string };

const submissions = new Map<string, StoredSubmission>();

function toPublicSubmission(entry: StoredSubmission): PublicCommuterSubmission {
  const {
    gender: _gender,
    companionPreference: _companionPreference,
    matchedWithId: _matchedWithId,
    ...publicSubmission
  } = entry;
  return publicSubmission;
}

export function createSubmission(details: CommuterDetails): CommuterSubmission {
  const submission: CommuterSubmission = {
    id: randomUUID(),
    name: details.name.trim(),
    gender: details.gender,
    companionPreference: details.companionPreference,
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
    return {
      submission: toPublicSubmission(current),
      match: existingMatch ? toPublicSubmission(existingMatch) : null,
    };
  }

  const candidate = [...submissions.values()].find(
    (entry) =>
      entry.id !== submissionId &&
      entry.metroLine === current.metroLine &&
      !entry.matched &&
      isCompatible(current, entry) &&
      isCompatible(entry, current),
  );

  if (!candidate) {
    return { submission: toPublicSubmission(current), match: null };
  }

  current.matched = true;
  candidate.matched = true;
  current.matchedWithId = candidate.id;
  candidate.matchedWithId = current.id;
  return {
    submission: toPublicSubmission(current),
    match: toPublicSubmission(candidate),
  };
}

export function getMatchStatus(submissionId: string): MatchResult {
  const current = submissions.get(submissionId);
  if (!current) {
    throw new Error("Commuter submission was not found.");
  }
  const match = current.matchedWithId
    ? submissions.get(current.matchedWithId) ?? null
    : null;
  return {
    submission: toPublicSubmission(current),
    match: match ? toPublicSubmission(match) : null,
  };
}

function isCompatible(requester: StoredSubmission, partner: StoredSubmission): boolean {
  return requester.companionPreference !== "female-only" || partner.gender === "female";
}

export function isValidLine(value: unknown): value is MetroLine {
  return value === "Blue" || value === "Green" || value === "Red";
}

export function isValidGender(value: unknown): value is GenderIdentity {
  return (
    value === "female" ||
    value === "male" ||
    value === "non-binary" ||
    value === "another" ||
    value === "prefer-not-to-say"
  );
}

export function isValidCompanionPreference(
  gender: GenderIdentity,
  value: unknown,
): value is CompanionPreference {
  return value === "any" || (gender === "female" && value === "female-only");
}

export function isValidDestination(line: MetroLine, destination: unknown): destination is string {
  return typeof destination === "string" && STATIONS[line].includes(destination);
}
