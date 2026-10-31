import { useEffect, useRef, useState, type CSSProperties, type FormEvent } from "react";
import {
  ArrowRight,
  Check,
  ChevronDown,
  CircleHelp,
  Clock3,
  Compass,
  MapPin,
  Navigation,
  RotateCw,
  ShieldCheck,
  Sparkles,
  TrainFront,
  UserRound,
  UsersRound,
  X,
} from "lucide-react";
import { METRO_LINES, type CommuterSubmission, type MatchResult, type MetroLine } from "./domain";
import { checkMatch, fetchStations, findMatch, submitCommuter } from "./lib/api";

type StationData = { stations: string[]; source: string };
type JourneyState = "matched" | "waiting";

const LINE_COLORS: Record<MetroLine, string> = {
  Blue: "#3975bb",
  Green: "#278765",
  Red: "#d26a59",
};

function getStationsForLine(payload: Awaited<ReturnType<typeof fetchStations>>, line: MetroLine): string[] {
  if (Array.isArray(payload.stations)) return !payload.line || payload.line === line ? payload.stations : [];
  return payload.stations[line] ?? [];
}

function LoadingDots() {
  return <span className="loading-dots" aria-label="Loading"><i /><i /><i /></span>;
}

function TransitIllustration() {
  return (
    <div className="route-art" aria-label="Illustration of the Hyderabad Metro lines">
      <span className="map-label">Hyderabad · three lines, one ride home</span>
      <div className="route-lines" aria-hidden="true">
        <div className="route-line blue" />
        <div className="route-line green" />
        <div className="route-line red" />
      </div>
      <span className="station-dot d1" /><span className="station-dot d2" />
      <span className="station-dot d3" /><span className="station-dot d4" />
      <span className="station-dot d5" />
      <span className="map-pin"><MapPin size={15} strokeWidth={2.4} /></span>
      <div className="map-callout">
        <span className="map-callout-icon"><UsersRound size={15} /></span>
        <div><strong>Better together</strong><span>Find your metro companion</span></div>
      </div>
    </div>
  );
}

function MatchPanel({
  submission,
  match,
  state,
  checking,
  error,
  onRefresh,
  onStartOver,
}: {
  submission: CommuterSubmission;
  match: CommuterSubmission | null;
  state: JourneyState;
  checking: boolean;
  error: string;
  onRefresh: () => void;
  onStartOver: () => void;
}) {
  const firstName = submission.name.trim().split(/\s+/)[0] || submission.name;
  return (
    <section className="result-panel" aria-live="polite" aria-atomic="true">
      <div className="result-card">
        {state === "matched" && match ? (
          <>
            <div className="result-kicker"><Check size={14} /> A good ride starts here</div>
            <h3>You’ve found a travel companion, {firstName}.</h3>
            <p className="result-copy">You found a travel partner on the same metro line.</p>
            <div className="match-person">
              <div className="person-avatar" aria-hidden="true">{match.name.trim().charAt(0).toUpperCase()}</div>
              <div>
                <strong>{match.name}</strong>
                <span>{match.metroLine} Line <span aria-hidden="true">·</span> {match.destination}</span>
              </div>
              <Check size={17} color="#278765" style={{ marginLeft: "auto" }} />
            </div>
          </>
        ) : (
          <>
            <div className="result-kicker"><span className="waiting-indicator" /> Looking for your match</div>
            <h3>Your ride is in the works.</h3>
            <p className="result-copy">No travel partner found yet. Waiting for another commuter on the same line.</p>
            <div className="match-person">
              <div className="person-avatar" aria-hidden="true" style={{ background: "#d8e9de", color: "#287265" }}><Clock3 size={19} /></div>
              <div><strong>Waiting for a match</strong><span>We’ll update this card as soon as one arrives</span></div>
              {checking && <LoadingDots />}
            </div>
          </>
        )}
        {error && <div className="inline-error" role="alert"><CircleHelp size={16} /> <span>{error}</span></div>}
        <div className="result-actions">
          {state === "waiting" && (
            <button className="secondary-button" type="button" onClick={onRefresh} disabled={checking}>
              <RotateCw size={13} className={checking ? "spin-icon" : ""} /> Check again
            </button>
          )}
          <button className="secondary-button" type="button" onClick={onStartOver}>
            <X size={13} /> Start a new search
          </button>
        </div>
      </div>
    </section>
  );
}

export default function App() {
  const [name, setName] = useState("");
  const [metroLine, setMetroLine] = useState<MetroLine>("Blue");
  const [destination, setDestination] = useState("");
  const [stations, setStations] = useState<string[]>([]);
  const [stationSource, setStationSource] = useState("");
  const [directorySource, setDirectorySource] = useState("");
  const [availableLines, setAvailableLines] = useState<MetroLine[]>([...METRO_LINES]);
  const [stationsLoading, setStationsLoading] = useState(true);
  const [stationRetry, setStationRetry] = useState(0);
  const [stationError, setStationError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [journey, setJourney] = useState<{ submission: CommuterSubmission; match: CommuterSubmission | null } | null>(null);
  const [journeyState, setJourneyState] = useState<JourneyState>("waiting");
  const [checking, setChecking] = useState(false);
  const [matchError, setMatchError] = useState("");
  const inFlight = useRef(false);

  useEffect(() => {
    let alive = true;
    fetchStations()
      .then((response) => {
        if (!alive) return;
        setDirectorySource(response.source);
        const stationDirectory = response.stations;
        if (!Array.isArray(stationDirectory)) {
          const fromApi = METRO_LINES.filter((line) => Array.isArray(stationDirectory[line]));
          if (fromApi.length) setAvailableLines(fromApi);
        }
      })
      .catch(() => {
        if (alive) setStationError("We couldn’t load the metro directory just yet. Please try again.");
      });
    return () => { alive = false; };
  }, []);

  useEffect(() => {
    let alive = true;
    setStationsLoading(true);
    setStationError("");
    setDestination("");
    fetchStations(metroLine)
      .then((response) => {
        if (!alive) return;
        const lineStations = getStationsForLine(response, metroLine);
        setStations(lineStations);
        setStationSource(response.source);
        if (!lineStations.length) setStationError("There are no destination stations available for this line right now.");
      })
      .catch((error: unknown) => {
        if (!alive) return;
        setStations([]);
        setStationSource("");
        setStationError(error instanceof Error ? error.message : "We couldn’t load stations. Please try again.");
      })
      .finally(() => { if (alive) setStationsLoading(false); });
    return () => { alive = false; };
  }, [metroLine, stationRetry]);

  useEffect(() => {
    if (!journey || journey.match) return;
    let alive = true;
    const poll = async () => {
      if (!alive || inFlight.current) return;
      inFlight.current = true;
      setChecking(true);
      try {
        const status = await checkMatch(journey.submission.id);
        if (!alive) return;
        if (status.match) {
          setJourney({ submission: status.submission, match: status.match });
          setJourneyState("matched");
          setMatchError("");
        }
      } catch (error: unknown) {
        if (alive) setMatchError(error instanceof Error ? error.message : "We couldn’t check for a match. We’ll keep trying.");
      } finally {
        inFlight.current = false;
        if (alive) setChecking(false);
      }
    };
    const timer = window.setInterval(poll, 5000);
    return () => { alive = false; window.clearInterval(timer); };
  }, [journey]);

  async function refreshMatch() {
    if (!journey || inFlight.current) return;
    inFlight.current = true;
    setChecking(true);
    setMatchError("");
    try {
      const status = await checkMatch(journey.submission.id);
      if (status.match) {
        setJourney({ submission: status.submission, match: status.match });
        setJourneyState("matched");
      } else {
        const result = await findMatch(journey.submission.id);
        setJourney({ submission: result.submission, match: result.match });
        if (result.match) setJourneyState("matched");
      }
    } catch (error: unknown) {
      setMatchError(error instanceof Error ? error.message : "We couldn’t check for a match. Please try again.");
    } finally {
      inFlight.current = false;
      setChecking(false);
    }
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitError("");
    if (!name.trim() || !destination) return;
    setSubmitting(true);
    try {
      const result: MatchResult = await submitCommuter({
        name: name.trim(),
        metroLine,
        destination,
      });
      setJourney(result);
      setJourneyState(result.match ? "matched" : "waiting");
      setMatchError("");
      if (!result.match) {
        try {
          const refreshed = await findMatch(result.submission.id);
          setJourney(refreshed);
          if (refreshed.match) setJourneyState("matched");
        } catch {
          // The status poll below remains available if the first match lookup is temporarily unavailable.
        }
      }
    } catch (error: unknown) {
      setSubmitError(error instanceof Error ? error.message : "We couldn’t save your journey. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  function startOver() {
    setJourney(null);
    setJourneyState("waiting");
    setMatchError("");
    setSubmitError("");
  }

  const lineHasStations = stations.length > 0;
  const canSubmit = name.trim().length > 0 && !!destination && !submitting && !stationsLoading && lineHasStations;
  const attribution = stationSource || directorySource;

  return (
    <main className="app-shell">
      <header className="topbar">
        <a className="brand" href="/" aria-label="MetroPair home">
          <span className="brand-mark"><TrainFront size={19} strokeWidth={2.2} /></span>
          <span className="brand-name">metro<span>pair</span></span>
        </a>
        <div className="topbar-note"><ShieldCheck size={15} /> Shared journeys, thoughtfully</div>
      </header>

      <div className="page-wrap">
        <section className="hero">
          <div>
            <div className="eyebrow"><span className="eyebrow-dot" /> Hyderabad after hours</div>
            <h1>Make the ride<br />home feel <em>closer.</em></h1>
            <p className="hero-copy">Find a fellow commuter on your metro line for a safer journey home.</p>
            <div className="hero-stats">
              <span className="avatar-stack" aria-hidden="true">
                <span className="mini-avatar">A</span><span className="mini-avatar">S</span><span className="mini-avatar">R</span>
              </span>
              <span>Good company for the way home</span>
            </div>
          </div>
          <TransitIllustration />
        </section>

        <section className="main-grid" aria-label="Find a metro companion">
          <div className="form-card">
            <div className="card-heading">
              <div><h2>Plan your ride together</h2><p>Tell us where you’re headed tonight.</p></div>
              <span className="step-badge"><Sparkles size={12} /> Free to join</span>
            </div>

            {submitError && (
              <div className="inline-error" role="alert">
                <CircleHelp size={16} /><span>{submitError}</span><button type="button" onClick={() => setSubmitError("")}>Dismiss</button>
              </div>
            )}

            <form onSubmit={handleSubmit}>
              <div className="form-field">
                <label className="form-label" htmlFor="commuter-name">Your name <small>What should your companion call you?</small></label>
                <div className="input-wrap">
                  <UserRound size={16} />
                  <input
                    id="commuter-name"
                    className="field-control"
                    type="text"
                    placeholder="e.g. Asha"
                    autoComplete="name"
                    maxLength={60}
                    value={name}
                    onChange={(event) => setName(event.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="form-field">
                <label className="form-label" htmlFor="metro-line">Metro line <small>Choose your route</small></label>
                <div className="input-wrap">
                  <TrainFront size={16} />
                  <select
                    id="metro-line"
                    className="field-control"
                    value={metroLine}
                    onChange={(event) => setMetroLine(event.target.value as MetroLine)}
                    aria-label="Metro line"
                  >
                    {availableLines.map((line) => <option key={line} value={line}>{line} Line</option>)}
                  </select>
                  <ChevronDown className="select-chevron" size={16} />
                </div>
                <p className="line-hint">Destinations are shown from the current metro station directory.</p>
              </div>

              <div className="form-field">
                <label className="form-label" htmlFor="destination">Your destination <small>Where are you getting off?</small></label>
                <div className="input-wrap">
                  <Navigation size={16} />
                  <select
                    id="destination"
                    className="field-control"
                    value={destination}
                    onChange={(event) => setDestination(event.target.value)}
                    disabled={stationsLoading || !stations.length}
                    required
                  >
                    <option value="">{stationsLoading ? "Loading stations…" : stations.length ? "Choose a destination station" : "No stations available"}</option>
                    {stations.map((station) => <option key={station} value={station}>{station}</option>)}
                  </select>
                  <ChevronDown className="select-chevron" size={16} />
                </div>
                {stationError && <div className="inline-error" role="alert" style={{ marginTop: 9, marginBottom: 0 }}>
                  <CircleHelp size={15} /><span>{stationError}</span>
                  <button type="button" onClick={() => setStationRetry((attempt) => attempt + 1)}>Retry</button>
                </div>}
              </div>

              <button className="submit-button" type="submit" disabled={!canSubmit}>
                {submitting ? <><LoadingDots /> Finding your person</> : <>Find my travel companion <ArrowRight size={16} /></>}
              </button>
              <p className="privacy-note"><ShieldCheck size={13} /> Your journey details are only used to find a compatible commuter.</p>
            </form>

            {journey && (
              <MatchPanel
                submission={journey.submission}
                match={journey.match}
                state={journeyState}
                checking={checking}
                error={matchError}
                onRefresh={refreshMatch}
                onStartOver={startOver}
              />
            )}
          </div>

          <aside className="side-column">
            <section className="info-card">
              <div className="info-title"><span className="info-icon"><Compass size={17} /></span><h3>Three lines. One shared ride.</h3></div>
              <div className="line-list">
                <div className="line-row" style={{ "--line-color": LINE_COLORS.Blue } as CSSProperties}><span className="swatch" /><strong>Blue</strong><span>Choose a destination</span></div>
                <div className="line-row" style={{ "--line-color": LINE_COLORS.Green } as CSSProperties}><span className="swatch" /><strong>Green</strong><span>Choose a destination</span></div>
                <div className="line-row" style={{ "--line-color": LINE_COLORS.Red } as CSSProperties}><span className="swatch" /><strong>Red</strong><span>Choose a destination</span></div>
              </div>
              <div className="divider" />
              <p className="small-copy">Pick a line and destination. We’ll look for another commuter travelling on the same line.</p>
            </section>

            <section className="safety-card">
              <span className="safety-icon"><ShieldCheck size={17} /></span>
              <div><h3>Travel at your comfort</h3><p>Meet in a public station area, share your plans with someone you trust, and only continue if it feels right.</p></div>
            </section>
            {attribution && <p className="source-note">Station information: {attribution}</p>}
          </aside>
        </section>

        <footer className="footer">
          <span className="footer-brand"><TrainFront size={13} /> MetroPair <span>·</span> A calmer way home</span>
          <span>Designed for late-night Hyderabad Metro journeys</span>
        </footer>
      </div>
    </main>
  );
}
