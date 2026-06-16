# Dependency policy

Sovi pins every dependency and keeps it current, modern, and patched. Three
rules apply to **all** ecosystems (npm, Python, Rust):

1. **Pinned to an exact version.** No floating ranges (`^`, `~`, `>=`, `*`,
   `"1"`). A given commit always resolves to the same versions.
2. **At least 72 hours old.** We never adopt a release younger than 72h. This
   is supply-chain protection — compromised or malicious releases are usually
   caught and yanked within that window.
3. **Latest, within the rule above.** We track the newest release that is ≥72h
   old, so we get modern code and security/CVE fixes. Major upgrades that
   require code migration are reviewed individually, never auto-merged.

## How each ecosystem enforces it

| Ecosystem | Manifest | Pinning |
|---|---|---|
| Frontend (npm) | `frontend/package.json` + `frontend/.npmrc` (`save-exact=true`) | exact versions; `npm install` writes exact, never `^` |
| Shared TS lib (npm) | `shared/payoff/package.json` + `shared/payoff/.npmrc` | exact versions |
| API (Python) | `api/requirements.txt` | exact `==` |
| Worker (Python) | `worker/requirements.txt` | exact `==` |
| Desktop (Rust) | `src-tauri/Cargo.toml` | exact `=x.y.z` |

Ongoing upgrades are automated by **Renovate** (`renovate.json`):

- `rangeStrategy: "pin"` — keeps everything pinned (rule 1).
- `minimumReleaseAge: "72 hours"` + `internalChecksFilter: "strict"` — holds
  every PR until the release clears the cooldown (rule 2).
- Tracks latest; `major.dependencyDashboardApproval: true` gates breaking
  majors behind manual approval (rule 3).
- `osvVulnerabilityAlerts` + `vulnerabilityAlerts` raise prioritized PRs for
  CVEs (still subject to the 72h cooldown).
- `lockFileMaintenance` keeps lockfiles refreshed.

## Audit results (2026-06-16)

A full audit (`npm audit`, `pip-audit`) was run and remediated. All findings
with an available fix are patched; everything is pinned to the latest ≥72h-old
release.

| Surface | Before | After | Notes |
|---|---|---|---|
| API (Python) | 21 CVEs / 4 pkgs | **0** | see below |
| Worker (Python) | 5 CVEs / 1 pkg | **0** | cryptography |
| Frontend (npm) | 3 (2 high, 1 mod) | **0** | esbuild dev-server RCE via Vite |
| shared/payoff (npm) | 19 moderate | 18 moderate | single **unfixable** dev-only advisory (below) |

### Security fixes applied

- **cryptography** `43.0.1 → 49.0.0` (api + worker) — PYSEC-2026-35,
  CVE-2024-12797, CVE-2026-26007, GHSA-537c-gmf6-5ccf.
- **python-multipart** `0.0.9 → 0.0.32` (api) — CVE-2024-53981 plus six later
  multipart CVEs.
- **FastAPI** `0.115.0 → 0.136.3` (api) — pulls **starlette 1.3.1**, patching
  eight starlette CVEs (CVE-2024-47874, CVE-2025-54121, PYSEC-2026-161,
  CVE-2026-48818/48817/54283/54282).
- **pytest** `8.3.2 → 9.0.3` + **pytest-asyncio** `0.24.0 → 1.4.0` (api) —
  CVE-2025-71176.
- **Vite** `5 → 8.0.16`, **@vitejs/plugin-react** `4 → 6.0.2`,
  **vite-plugin-pwa** `0.20 → 1.3.0` (frontend) — GHSA-67mh-4wv8-2f99 and
  GHSA-gv7w-rqvm-qjhr (esbuild dev-server request smuggling / RCE).
- **jest** `29 → 30.4.2` (shared/payoff) — reduced the js-yaml transitive blast
  radius.

Verification performed in-sandbox: `pip-audit` clean on both Python sets; API
app imports cleanly (38 routes) and the payoff test suite passes under
pytest 9; `npm audit` clean on the frontend; frontend production build passes
under Vite 8; payoff jest suite passes under jest 30. The Python backend could
not be integration-tested here (no Postgres/Redis), so run the full API test
suite against a live database before deploying the FastAPI/starlette bump.

### Accepted / unfixable

- **GHSA-h67p-54hq-rp68** — js-yaml quadratic-complexity DoS. Pulled
  transitively by `@istanbuljs/load-nyc-config` (unmaintained) inside jest's
  coverage tooling. The advisory range is `<= 4.1.1`, i.e. **no patched
  release exists**, and we are already on the latest 3.x (3.14.2). It is
  **dev/test-only** (never in the runtime or production bundle) and only
  triggers when parsing attacker-controlled YAML, which the test runner never
  does. Tracked for upgrade the moment a fixed js-yaml ships.

### Deferred majors (Renovate, review individually)

React 18 → 19, recharts 2 → 3, TypeScript 5 → 6, react-router-dom 6 → 7,
Tauri 1 → 2, and various backend majors (uvicorn, redis-py 5 → 8, SQLAlchemy
minor, etc.). These need code migration and are surfaced on the Renovate
dependency dashboard for individual review.

## Running the audits locally

```bash
# Frontend + shared TS
cd frontend && npm audit
cd shared/payoff && npm audit

# Python (no install needed)
pip install pip-audit
pip-audit -r api/requirements.txt
pip-audit -r worker/requirements.txt

# Rust (recommended in CI; commit Cargo.lock for reproducibility)
cargo install cargo-audit && cargo audit --file src-tauri/Cargo.lock
```
