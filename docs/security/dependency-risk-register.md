# Dependency Risk Register

## DR-001 — Unpatched production dependency chain
- **Date:** 2026-07-26
- **Severity:** High / release-blocking
- **Affected:** Next.js → PostCSS and Sharp dependency chain.
- **Evidence:** `npm audit --omit=dev` after upgrade to Next.js 16.2.12 reports 3 high findings (`next`, `postcss`, `sharp`) and no critical findings. The package registry currently reports the latest stable Next.js as 16.2.12; the audit report does not offer a safe non-breaking automated remediation.
- **Mitigation applied:** upgraded from Next.js 15.x to 16.2.12; removed unused AI SDK runtime dependencies from Sprint 0 to reduce the attack surface; production image uses non-root user and no application file upload endpoint exists yet.
- **Residual risk:** The application must not be promoted to Production while this finding remains high severity.
- **Decision:** Sprint 0 is code-complete but release-gated. Continue only with non-production groundwork after an explicit security review; do not open public/file-ingestion features until DR-001 is resolved or formally risk-accepted by the project owner and Security Owner.
- **Owner:** CTO / Security Engineer
- **Review trigger:** patched upstream release or a validated mitigation that removes the vulnerable runtime dependency.
