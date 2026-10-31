---
name: Production runtime mode
description: Ensure MetroPair's deployed Node server serves the built client, not Vite development middleware.
---

MetroPair's published Node process must start with `NODE_ENV=production`; do not assume Replit Autoscale sets it automatically.

**Why:** published logs showed Vite re-optimizing dependencies during startup while the health check for `/` returned 500, despite a successful build.

**How to apply:** preserve the explicit production environment in the deployment run command whenever changing deployment configuration, and verify `/` and `/api/health` before publishing.
