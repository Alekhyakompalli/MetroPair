# MetroPair

MetroPair helps late-night Hyderabad Metro commuters find another submitted commuter on the same line. Destinations may differ; each available commuter is paired once, in submission order.

## Run in Replit

The app runs with the `Start application` workflow or locally with:

```sh
npm install
npm run dev
```

Open the app on port 5000. The API and Vite frontend are served by the same Express process.

## Production build

```sh
npm run build
npm start
```

## API

- `GET /api/stations` — station lists by line
- `GET /api/stations?line=Blue` — stations for a selected line
- `POST /api/submissions` — validate a commuter and attempt a match
- `POST /api/matches/find` — retry matching a submitted commuter
- `GET /api/matches/:submissionId` — check match status while waiting

The matching engine pairs the earliest unmatched commuter on the same line, excludes the current commuter, and allows different destinations.

## Station data

The station names and line assignments are adapted from the `metro_graph.py` file in the [Hyderabad Metro Hugging Face space](https://huggingface.co/spaces/keerthanakothoju/Hyderabad_Metro). That source currently contains only three Green Line stations and has inconsistent/incomplete route connections. The app retains that limited Green Line list rather than claiming the source provides a complete route dataset. Validate station coverage against current HMRL data before using for real journeys.

## Data and safety limits

Submissions are held in server memory and are cleared when the server restarts. This prototype does not authenticate commuters or verify identities. Do not use it to share real-time location or treat a match as a safety guarantee.
