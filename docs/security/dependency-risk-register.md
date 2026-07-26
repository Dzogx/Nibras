# Dependency Risk Register

## DR-001 — Unpatched production dependency chain
- **Date:** 2026-07-26
- **Severity:** High / production-release-blocking; **not a development execution blocker**.
- **Affected:** Next.js → PostCSS and Sharp dependency chain.
- **Evidence:** `npm audit --omit=dev` after upgrade to Next.js 16.2.12 reports 3 high findings (`next`, `postcss`, `sharp`) and no critical findings. The package registry reports Next.js 16.2.12 as the latest stable version available to this environment; the audit report does not offer a safe non-breaking automated remediation.

### Classification
| Item | Environment | Exploitability in current Nibras scope | Current status |
|---|---|---|---|
| PostCSS advisories | Build/development pipeline, inherited by Next.js | Requires attacker-controlled CSS/source-map content to be processed. Nibras has no user CSS upload or CSS compilation feature. | Mitigated by trusted repository-only CSS and CI review; still release-blocking until upstream patch/validated exception. |
| Sharp/libvips advisories | Runtime dependency inherited by Next.js | Relevant primarily to processing attacker-controlled images. MVP has no image upload, transformation, or image optimization need. | Runtime mitigation enabled: `images.unoptimized = true`; private document upload remains disabled until its own security gate. |
| Next.js umbrella advisory | Production dependency | Depends on the affected PostCSS/Sharp paths above; no direct vulnerable endpoint is enabled in the current MVP baseline. | Latest stable installed; monitor upstream advisory. |

### Mitigations applied
1. Upgraded from Next.js 15.x to stable Next.js 16.2.12.
2. Removed unused AI SDK runtime dependencies from Sprint 0, reducing attack surface.
3. Disabled Next.js runtime image optimization (`images.unoptimized = true`).
4. No image upload, image transformation, or public document upload endpoint is enabled.
5. File storage is private and direct browser writes are denied in the Sprint 0 migration.
6. CI continues to run `npm audit`; the finding is visible rather than suppressed.

### Residual risk and decision
- **Residual risk:** high upstream dependency findings remain; risk is constrained in the current feature set but not eliminated.
- **Decision:** Continue Sprint 1 development with synthetic/local data only. Do not enable public uploads or promote to Production while DR-001 remains unresolved, unless a Security Owner formally accepts a time-limited exception with compensating controls.
- **Production Release Gate:** `npm audit --omit=dev` must show no high/critical production vulnerabilities, or a signed, time-limited exception must document exploitability, mitigations, owner, expiry, and rollback plan.
- **Owner:** CTO / Security Engineer.
- **Review trigger:** patched upstream release, new enabled image/file feature, new exploit evidence, or release candidate.
