# Instructions for coding agents

Applies to the MediMate AI frontend and backend repositories.

## Read before changing code

1. `README.md`
2. `07-policies.md`
3. `03-constraints.md`
4. `02-business-rules.md`
5. The relevant requirements/standards/conventions/guidelines
6. `08-traceability-and-release-gates.md`

## Non-negotiable rules

- Preserve the product boundary: pre-consultation guidance, not diagnosis, prescribing, or a
  replacement for licensed clinical care.
- Never weaken emergency guidance, clinical safety, object authorization, privacy, audit, or
  payment verification to make a feature pass.
- Treat symptoms, lab documents/results, medications, recovery plans, linked location, and patient
  profiles as sensitive data. Never place them in logs, analytics, URLs, screenshots, fixtures,
  crash reports, or public storage.
- Enforce authentication, role/capability, ownership/assignment, and account status on the server.
  A frontend guard is not authorization.
- Do not present model-generated scores as calibrated disease probabilities. Do not invent missing
  clinical fields, reference ranges, ICD codes, confidence, or “normal/low risk” fallbacks.
- Validate model/vendor output and fail closed. Raw model output must never be returned directly.
- Do not add a vendor or send a new data field to an existing vendor without an approved data-flow
  and vendor review.
- Never hard-code or commit secrets. Assume all `VITE_*` values are public.

## Change workflow

1. State the affected rule IDs and risk (`P0/P1/P2`) before implementation.
2. Inspect both repositories when changing an API contract or shared business rule.
3. For P0 changes, update risk/threat documentation and require the relevant Clinical, Privacy,
   Security, or AI owner review. If no owner is designated, do not invent approval.
4. Add positive, boundary, failure, and unauthorized/unsafe-output tests proportional to risk.
5. Run the relevant quality gates in `04-standards.md` and record evidence.
6. Provide rollback/kill-switch instructions for P0 changes.

## Architecture boundaries

- Frontend: page/route -> feature hook/service -> domain API -> shared API client -> backend.
- Backend: API -> Application -> Domain, with Infrastructure implementing boundaries.
- Do not change API meaning, role semantics, entitlement, clinical status, or payment outcome in a
  UI-only refactor.
- Prefer small, reviewable changes. Do not combine a medical-rule change with unrelated cleanup.

## Stop and escalate

Stop implementation and request a decision when a change would expand intended medical use,
publish AI-generated treatment, expose patient data to a new actor/vendor, choose a legal retention
period, classify the product, or bypass a P0 control. Record the decision in an ADR before resuming.
