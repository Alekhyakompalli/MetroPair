export const METRO_LINES = ["Blue", "Green", "Red"] as const;
export const GENDER_IDENTITIES = [
  "female",
  "male",
  "non-binary",
  "another",
  "prefer-not-to-say",
] as const;

export type MetroLine = (typeof METRO_LINES)[number];
export type GenderIdentity = (typeof GENDER_IDENTITIES)[number];
export type CompanionPreference = "any" | "female-only";

export const GENDER_IDENTITY_LABELS: Record<GenderIdentity, string> = {
  female: "Female",
  male: "Male",
  "non-binary": "Non-binary",
  another: "Another identity",
  "prefer-not-to-say": "Prefer not to say",
};

export interface CommuterDetails {
  name: string;
  gender: GenderIdentity;
  companionPreference: CompanionPreference;
  metroLine: MetroLine;
  destination: string;
}

export interface CommuterSubmission extends CommuterDetails {
  id: string;
  createdAt: string;
  matched: boolean;
}

export type PublicCommuterSubmission = Omit<
  CommuterSubmission,
  "gender" | "companionPreference"
>;

export interface MatchResult {
  submission: PublicCommuterSubmission;
  match: PublicCommuterSubmission | null;
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
