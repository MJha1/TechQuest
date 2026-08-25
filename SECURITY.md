# Security Policy

TechQuest is a learning product for children aged 8–12. We take the security of the service — and the privacy of children — seriously. This document explains how to report a vulnerability and what is in scope.

For the full engineering security & child-privacy audit, see [`docs/security.md`](docs/security.md).

## Reporting a vulnerability

**Please do not open a public issue for security reports.**

Report privately using **[GitHub Private Vulnerability Reporting](https://github.com/MJha1/TechQuest/security/advisories/new)** (Security → Advisories → *Report a vulnerability*), or email the maintainers at **security@techquest.example** *(replace with a monitored security contact before launch)*.

Please include:
- A description of the issue and its impact.
- Steps to reproduce (proof-of-concept if possible).
- Affected component (web, api, database, AI, analytics) and version/commit.

We aim to acknowledge a report within **3 business days** and to provide a remediation timeline after triage. Please give us a reasonable opportunity to fix the issue before any public disclosure. We will credit reporters who wish to be acknowledged.

### Child-safety reports get priority

Reports that could affect a child's safety or privacy — for example a way to reach another parent's child, to extract child data, to expose a secret, or to turn an AI feature into open-ended chat — are treated as **highest priority**.

## Scope

**In scope**
- Authentication / authorization flaws (including any cross-parent access to a child).
- Exposure of secrets, API keys, or personal data.
- Injection, SSRF, or similar server-side vulnerabilities.
- Ways to make an AI feature behave as an unrestricted chatbot or leak internal details.
- Analytics or logs capturing unnecessary personal information.

**Out of scope**
- Findings that require a compromised device, physical access, or social engineering.
- Denial of service from unrealistic traffic volumes.
- Reports about third-party services (Neon, Anthropic, PostHog) — please report those to the respective vendor; tell us if our configuration is the cause.
- Missing hardening headers with no demonstrated impact.

## Safe harbor

We will not pursue or support legal action against researchers who:
- Make a good-faith effort to avoid privacy violations, data destruction, and service disruption.
- Only interact with **test accounts they own** and do not access, modify, or retain other users' — especially children's — data.
- Give us reasonable time to remediate before public disclosure.

## Supported versions

TechQuest is pre-1.0 and ships from `main`. Security fixes are applied to the latest `main`; there are no long-term support branches yet.

| Version | Supported |
|---|---|
| `main` (latest) | ✅ |
| older commits | ❌ |

## A note on legal compliance

This repository documents **engineering** security and privacy controls. It does **not** constitute a claim of compliance with COPPA, GDPR/GDPR-K, the UK Age Appropriate Design Code, or any other law or standard. Compliance requires review by qualified legal/privacy counsel — see the "Areas requiring professional review" section of [`docs/security.md`](docs/security.md).
