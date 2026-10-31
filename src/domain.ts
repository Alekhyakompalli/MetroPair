export const METRO_LINES = ["Blue", "Green", "Red"] as const;

export type MetroLine = (typeof METRO_LINES)[number];

export interface CommuterDetails {
  name: string;
  metroLine: MetroLine;
  destination: string;
}

export interface CommuterSubmission extends CommuterDetails {
  id: string;
  createdAt: string;
  matched: boolean;
}

export interface MatchResult {
  submission: CommuterSubmission;
  match: CommuterSubmission | null;
}

export interface MatchStatus {
  submission: CommuterSubmission;
  match: CommuterSubmission | null;
}

export type StationDirectory = Record<MetroLine, string[]>;

export interface StationResponse {
  stations: StationDirectory | string[];
  source: string;
  line?: MetroLine;
}
