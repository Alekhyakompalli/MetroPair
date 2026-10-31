import type {
  CommuterDetails,
  MatchResult,
  MatchStatus,
  MetroLine,
  StationResponse,
} from "../domain";

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(path, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...init?.headers,
    },
  });

  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(payload.error ?? "Something went wrong. Please try again.");
  }
  return payload as T;
}

export function fetchStations(line?: MetroLine): Promise<StationResponse> {
  const path = line
    ? `/api/stations?line=${encodeURIComponent(line)}`
    : "/api/stations";
  return request(path);
}

export function submitCommuter(details: CommuterDetails): Promise<MatchResult> {
  return request("/api/submissions", {
    method: "POST",
    body: JSON.stringify(details),
  });
}

export function findMatch(submissionId: string): Promise<MatchResult> {
  return request("/api/matches/find", {
    method: "POST",
    body: JSON.stringify({ submissionId }),
  });
}

export function checkMatch(submissionId: string): Promise<MatchStatus> {
  return request(`/api/matches/${encodeURIComponent(submissionId)}`);
}
