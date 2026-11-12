# Forge Athletic Performance LLC — Written Information Security Program (WISP) & Health Breach Incident Runbook

**Entity:** Forge Athletic Performance LLC (Massachusetts Secretary of the Commonwealth ID `#002010312`)
**Principal Place of Business:** Boston, Massachusetts
**Statutory Frameworks:** Massachusetts `201 CMR 17.00` · `M.G.L. c. 93H` · FTC Health Breach Notification Rule (`16 CFR Part 318`) · Washington MHMDA (`RCW 19.373`) · Illinois BIPA (`740 ILCS 14/`) · HIPAA Security Safeguard Parity (`45 CFR § 164.308–312`)
**Document Version:** `wisp-2026.11.11`

---

## 1. Designated Data Security Coordinator (`201 CMR 17.03(2)(a)`)

- **Information Security & Privacy Officer:** Scott Gordon, Founder & Managing Member (`scott@forge-athletic.app`)
- **Core Mandate:** Maintain administrative, technical, and physical safeguards over personal information, consumer health data, PAR-Q+ medical readiness records, Emergency Response Action Plans (ERAP), movement assessment media, and wearable telemetry stored or processed by Forge Athletic.

---

## 2. Scope of Protected Records

1. **Statutory Personal Information (`201 CMR 17.02`):** Full name paired with payment tokens (delegated exclusively to Stripe PCI-DSS Level 1), authentication credentials, or financial billing identifiers.
2. **Consumer Health & Fitness Records (`16 CFR Part 318` / `RCW 19.373`):** PAR-Q+ intake questionnaires, orthopedic contraindications, medication screening flags, NASM Overhead Squat Assessment (OHSA) findings, workout logs, body-composition entries, S.O.A.P. coaching notes, and synchronized Apple HealthKit / Google Health Connect / Vital wearable metrics.
3. **Private Assessment Media:** Movement screen videos, posture photos, and live WebRTC coaching studio clips stored exclusively in private Supabase Storage buckets accessed via short-lived cryptographic signed URLs.

---

## 3. Technical & Administrative Safeguards (`201 CMR 17.04`)

| Safeguard Domain | Production Control | Verification Cadence |
| :--- | :--- | :--- |
| **Encryption in Transit** | Mandatory HTTPS / TLS 1.3 (HSTS preload) across all web, API, WebRTC (DTLS-SRTP), and subprocessor connections. | Continuous |
| **Encryption at Rest** | AES-256 encryption across PostgreSQL database volumes (`fitness_profiles`, `client_intake_forms`, `nasm_assessments`, `legal_consent_audit_log`) and private object storage buckets. | Continuous |
| **Access Control & Least Privilege** | PostgreSQL Row-Level Security (RLS) restricting athlete queries to `auth.uid() = user_id` and restricting coach queries to `requireCoachAssignedClient` (`designated_coach_id === authz.user.id`). | Automated CI / Vitest suite |
| **Zero Ad-Tech / Tracking Sanctuary** | Complete prohibition on Google Analytics 4, Meta Pixel, TikTok Pixel, and third-party behavioral ad trackers across the entire platform. | Verified at build time (`app/layout.tsx`) |
| **Client-Side Pose Landmarking** | 33-point skeletal joint angle inference runs locally inside the user's browser via WebAssembly/WebGL (`MediaPipe Pose`); raw biometric templates are never sold or retained as facial/voiceprint identifiers. | Continuous |
| **Authentication & MFA** | Hardware passkey / WebAuthn + TOTP multi-factor authentication required on GitHub, Vercel, Supabase, Stripe, Google Cloud/Workspace, Resend, Twilio, and DNS registrar accounts. | Quarterly audit |
| **Endpoint Security** | Full-disk FileVault encryption, automatic OS security patching, password manager vaulting, and automatic screen lock (`<= 5` minutes) on all developer/coach workstations. | Quarterly audit |

---

## 4. Subprocessor Zero-Data-Retention (ZDR) & DPA Checklist (`201 CMR 17.03(2)(f)`)

Before transmitting athlete data to any cloud or AI vendor, the Data Security Coordinator must verify and archive signed Data Processing Addenda (DPAs) and Zero-Data-Retention settings:

- [ ] **Supabase:** Enterprise/Pro DPA executed; PostgreSQL RLS enabled on 100% of `public` tables; Storage buckets set to `public = false`.
- [ ] **Google Gemini API / Vertex AI:** Strictly bound to **Paid Billing Tier** or **Google Cloud Vertex AI** (`GEMINI_API_KEY`) where API prompts and responses are contractually excluded from human review and public foundation model training. Never attach a Free-Tier AI Studio key in production.
- [ ] **OpenAI API:** Organization Data Sharing / Model Training toggles disabled (`Zero Data Retention` API tier).
- [ ] **ElevenLabs:** API Zero-Retention / Enterprise privacy mode verified; custom voice clones limited exclusively to authorized W-2 personnel with written right-of-publicity consent.
- [ ] **Leonardo AI (`predict-look`):** Invoked strictly upon per-request opt-in by verified 18+ adult athletes; prompt/image privacy settings locked to private/non-public generation.
- [ ] **Stripe:** PCI-DSS Level 1 attestation; raw card/bank numbers never touch Forge Athletic servers.
- [ ] **Vital / Apple HealthKit / Google Health Connect:** Read-only physiological scopes limited to recovery/training calibration; strict adherence to Google Health Connect Limited Use and Apple App Store Guideline `5.1.3`.

---

## 5. 60-Day Security & Health Breach Incident Response Runbook

In the event of suspected or confirmed unauthorized acquisition of unencrypted personal information (`M.G.L. c. 93H`) or unauthorized disclosure/exfiltration of unsecured PHR identifiable health information (`16 CFR Part 318` — including unauthorized pixel/SDK transmission or credential compromise):

### Phase 1: Containment & Forensics (Hours `0–24`)
1. Rotate affected API secrets (`SUPABASE_SERVICE_ROLE_KEY`, `STRIPE_SECRET_KEY`, `GEMINI_API_KEY`, webhook secrets) immediately in Vercel and provider consoles.
2. Revoke compromised sessions and preserve immutable PostgreSQL, Vercel, and Supabase audit logs (do not overwrite forensic evidence).
3. Document incident timestamp, affected tables/buckets, affected user count, and state of residence breakdown.

### Phase 2: Legal & Insurance Triage (Hours `24–72`)
1. Notify **Cyber Liability & Breach Response Insurance Carrier** before engaging external forensic vendors to preserve panel coverage.
2. Engage outside privacy counsel to evaluate statutory notification triggers across jurisdictions.

### Phase 3: Mandatory Statutory Notifications (Without Unreasonable Delay; Strictly `<= 60` Calendar Days)
1. **FTC Health Breach Notification Rule (`16 CFR § 318.4–318.5`):**
   - Notify each affected U.S. individual via first-class mail or verified email within **60 calendar days** of discovery.
   - **Under 500 individuals affected:** Submit electronic breach report to the FTC within 60 days following the end of the calendar year.
   - **500 or more individuals affected:** Notify the FTC **contemporaneously** (no later than 10 business days after discovery) AND notify prominent media outlets in affected states/jurisdictions.
2. **Massachusetts `M.G.L. c. 93H, § 3(b)`:**
   - Deliver simultaneous written notice to the **Massachusetts Attorney General**, the **Office of Consumer Affairs and Business Regulation (OCABR)**, and affected Massachusetts residents (`<= 60` days; note that under Massachusetts law, breach notices to residents **must not** include the nature of the breach or number of residents affected, while notices to AG/OCABR **must** include full technical details and WISP attestation).
3. **Biometric & Consumer Health State Addenda:** Cross-check Washington (`RCW 19.373`), California (`Cal. Civ. Code § 1798.82`), New York (`SHIELD Act`), and Texas (`Tex. Bus. & Com. Code § 521.053`) timelines.

---

## 6. Annual Review & Retention Destruction Audit

Every 12 months (or upon any material platform architecture change), the Data Security Coordinator executes:
1. Automated test suite verification (`npm run test`) confirming RLS, CSRF, 18+ age gate, and append-only `legal_consent_audit_log` integrity.
2. Automated biometric/assessment media purge verification (`IL BIPA 740 ILCS 14/15(a)`): permanent cryptographic destruction immediately upon user-initiated account deletion or within **3 years** of the athlete's last interaction with Forge Athletic.

