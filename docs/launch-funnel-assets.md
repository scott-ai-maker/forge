# Launch Funnel Assets (Gordon Athletic Advisory)

This document serves as the deploy-ready source of truth for the Gordon Athletic Advisory (GAA) launch funnel:

1. Landing page headline and CTA architecture
2. Biomechanical diagnostic & tier-alignment quiz (offer matching)
3. 5-day automated sports science nurture sequence
4. Canonical advisory tier retainers & modular telemetry add-ons
5. Funnel performance KPI benchmarks

---

## 1) Landing Page Headline + CTA Blocks

### Primary Hero Copy (Clinical Sports Science & Advisory Positioning)

- **Eyebrow**: "CLINICAL-GRADE HUMAN PERFORMANCE ADVISORY"
- **Headline**: "Precision Biomechanics. Master Periodization. Proven Performance."
- **Subhead**: "Eliminate guesswork with NASM OPT™ 5-phase macrocycles, 33-point MediaPipe 3D biomechanical screening, and real-time biometric telemetry. Private advisory built for high-performing executives."

### Primary CTA
- **Button label**: "Explore Retainer Tiers"
- **Destination**: `/packages` (or `/async-coaching`)

### Secondary CTA
- **Button label**: "Take 2-Min Diagnostic Audit"
- **Destination**: `/apply` (Interactive Biomechanical Diagnostic Quiz)

### Trust / Evidence Row (Below Hero)
- "MediaPipe 33-Point 3D Postural Screening"
- "NASM OPT™ 5-Phase Periodization Engine"
- "Apple HealthKit & Health Connect Telemetry"
- "WebRTC 1:1 Live Video Consultation Studio"

### Offer Tier Overview Blocks

Card 0:
- **Name**: "Autonomous Digital Lab" ($59/mo)
- **One-liner**: "Algorithmic OPT™ macrocycle training engine with in-gym Cadence HUD and passive telemetry."
- **CTA**: "Enroll in Lab"

Card 1:
- **Name**: "Performance Protocol" ($349/mo)
- **One-liner**: "Full asynchronous advisory with 48h video reviews, macrocycle adjustments, and monthly audits."
- **CTA**: "Select Protocol"

Card 2 (Flagship):
- **Name**: "Hybrid Concierge" ($649/mo)
- **One-liner**: "Bi-weekly 1:1 WebRTC video consultations with live telestrator analysis and weekly Sunday Dossiers."
- **CTA**: "Apply for Concierge"

Card 3 (Executive Private):
- **Name**: "Executive 1:1 Master Retainer" ($1,495/mo)
- **One-liner**: "Dedicated private advisory retainer with weekly WebRTC consults, daily Slack VIP access, and travel recalibration."
- **CTA**: "Apply for Master Retainer"

### Objection Handling / Diagnostic Block

- **Title**: "Unsure Which Advisory Tier Matches Your Training Load?"
- **Body**: "Complete the 2-minute diagnostic audit. We analyze your training history, kinetic chain limitations, schedule constraints, and required advisory touchpoints to match your optimal protocol."
- **CTA**: "Launch Diagnostic Audit"

### Bottom CTA

- **Headline**: "Ready to Engineer Your High-Performance Operating System?"
- **Body**: "Active advisory retainers are strictly capped to ensure 100% clinician attention and uncompromised telemetry monitoring."
- **Primary CTA**: "Explore Retainer Tiers"
- **Secondary CTA**: "Complete Intake Diagnostic"

---

## 2) Biomechanical Diagnostic Quiz + Routing Logic

Interactive multi-step assessment hosted at `/apply` (2-3 minutes).

### Diagnostic Questions

1. **Primary Performance Objective**
   - Structural Body Recomposition & Hypertrophy
   - Kinetic Chain Restoration & Joint Resilience
   - Peak Athletic Power & Cardiovascular Conditioning (Tanaka Stage)
   - Executive Longevity & Sustained Daily Energy

2. **Target Adaptation Horizon**
   - Rapid Diagnostic & Realignment (30 Days)
   - 12-Week OPT™ Macrocycle Transformation (90 Days)
   - Multi-Cycle Annual Periodization (6–12 Months)
   - Permanent High-Performance Operating System

3. **Weekly Training Commitment**
   - 2 High-Density Sessions / Week
   - 3 Periodized OPT™ Sessions / Week
   - 4 Split-Routine Sessions / Week
   - 5+ Athlete-Level Sessions / Week

4. **Biomechanical & Postural Assessment Baseline**
   - Significant kinetic imbalances, chronic aches, or restricted mobility
   - Minor compensations during compound lifts (squats, presses)
   - Mechanically sound but require micro-adjustments and load balancing
   - Never undergone formal 3D computer vision postural screening

5. **Wearable Telemetry & Health Integration**
   - Apple Watch / Ultra with Apple HealthKit
   - Android Wear / Pixel Watch with Health Connect
   - WHOOP, Oura Ring, or Garmin Ecosystem
   - No wearable currently (App-based telemetry logging only)

6. **Prior Advisory & Coaching Experience**
   - Previous 1:1 private coaching with measurable success
   - Followed static PDF templates or generic subscription apps with diminishing returns
   - Self-programmed with inconsistent progress plateaus
   - First time working with a formal sports science advisory

7. **Monthly Advisory Investment Allocation**
   - Under $100/mo (Digital Engine & Autonomous Execution)
   - $200–$400/mo (Asynchronous Telemetry & Biomechanical Review)
   - $500–$800/mo (Hybrid Concierge with Live Consultations)
   - $1,000+/mo (Private Executive 1:1 Retainer)

8. **Onboarding & Diagnostic Readiness**
   - Immediate (This Week)
   - Within Next 14 Days
   - Within 30 Days
   - Diagnostic Review / Educational Research

### Scoring & Tier Alignment Matrix

- **Autonomous Digital Lab ($59/mo)**
  - Investment: Under $100/mo
  - Experience: Self-programmed or generic apps
  - Need: Algorithmic programming, Cadence HUD, passive HealthKit sync

- **Performance Protocol ($349/mo)**
  - Investment: $200–$400/mo
  - Experience: Any
  - Need: 48h asynchronous biomechanical video review, weekly load modulation, monthly audit

- **Hybrid Concierge ($649/mo - Flagship)**
  - Investment: $500–$800/mo
  - Experience: Any
  - Need: Bi-weekly WebRTC live studio reviews, weekly Sunday Dossier, active wearable tracking

- **Executive 1:1 Master Retainer ($1,495/mo)**
  - Investment: $1,000+/mo
  - Need: Weekly live WebRTC consults, daily VIP messaging, travel recalibration, executive concierge

### Diagnostic Routing Actions
- Under $100/mo budget -> Route to Autonomous Digital Lab ($59/mo) checkout or diagnostic sequence.
- $200–$400/mo budget -> Route to Performance Protocol ($349/mo).
- $500–$800/mo budget -> Route to Hybrid Concierge ($649/mo) flagship application.
- $1,000+/mo budget -> Route to Executive Master ($1,495/mo) priority intake.
- Low readiness / research -> Route to 5-day educational nurture sequence + $97 Standalone Biomechanical Audit.

---

## 3) 5-Day Sports Science Launch Email Sequence

Automated delivery (1 email every 24 hours) via `lib/marketing-email.ts`.

### Day 1 - The 5-Phase Architecture: Why Traditional Workouts Fail
- **Subject**: "The 5-Phase Architecture: Why Traditional Workouts Fail"
- **Preview**: "How NASM OPT™ methodology eliminates plateaus and injury risk."
- **Core Message**: Most programs fail because they skip foundational stabilization and jump straight into progressive overload. GAA applies the NASM Optimum Performance Training (OPT™) model—stabilization endurance, strength endurance, muscular development, maximal strength, and power—sequenced to your physiological baseline.
- **CTA**: Complete Your Diagnostic Intake (`/apply`)

### Day 2 - Computer Vision Biomechanics: What Your Movement Pattern Reveals
- **Subject**: "Computer Vision Biomechanics: What Your Movement Pattern Reveals"
- **Preview**: "33-point skeletal tracking finds what the naked eye misses."
- **Core Message**: Explains how MediaPipe computer vision analyzes the kinetic chain during overhead squats to detect heel elevation, knee valgus, asymmetrical weight shift, and shoulder elevation before loads are added.
- **CTA**: View Advisory Protocols (`/packages`)

### Day 3 - Closed-Loop Telemetry: Training Guided by Physiology, Not Guesswork
- **Subject**: "Closed-Loop Telemetry: Training Guided by Physiology, Not Guesswork"
- **Preview**: "Connecting Apple Health and Health Connect to real-time programming."
- **Core Message**: Bi-directional wearable synchronization monitors resting heart rate, HRV, active energy expenditure, and recovery scores. Workouts dynamically adapt based on biological readiness, not rigid calendars.
- **CTA**: Explore Retainer Options (`/packages`)

### Day 4 - High-Touch Execution: Live WebRTC Studios & Weekly Dossiers
- **Subject**: "High-Touch Execution: Live WebRTC Studios & Weekly Dossiers"
- **Preview**: "Inside our private consultation suite and Sunday morning protocol reviews."
- **Core Message**: Showcases the 1:1 WebRTC studio with interactive telestrator frame capture and the Sunday Dossier—a comprehensive weekly analysis of load volume, compliance, and upcoming microcycle targets.
- **CTA**: Align Your Advisory Tier (`/apply`)

### Day 5 - Advisory Enrollment Status: Cohort Capacity & Final Allocation
- **Subject**: "Advisory Enrollment Status: Cohort Capacity & Final Allocation"
- **Preview**: "Active client caps preserve our 48-hour SLA and live studio access."
- **Core Message**: Explains that client retainers are strictly limited to protect advisory quality. Outlines paths: immediate onboarding or joining the waitlist for the next microcycle cohort.
- **CTA**: Secure Your Advisory Tier (`/apply`)

---

## 4) Canonical Retainer Tiers & Deliverables

Source of truth: `lib/stripe.ts`

### Tier 0 - Autonomous Digital Lab ($59/mo)
- **Deliverables**:
  - Algorithmic OPT™ 5-phase macrocycle progression engine
  - In-gym Cadence Pulse HUD with live tempo pacing & Taptic Engine cues
  - 24/7 background telemetry sync (Apple HealthKit & Android Health Connect)
  - Full exercise video library with biomechanical cueing notes
  - Digital workout logging with automated volume & 1RM PR tracking
- **Best For**: Disciplined, self-directed lifters who want clinical programming and digital telemetry without 1:1 clinician check-ins.

### Tier 1 - Performance Protocol ($349/mo)
- **Deliverables**:
  - Everything in Autonomous Digital Lab
  - 100% bespoke periodized macrocycles adapted to home/travel/gym setups
  - Asynchronous biomechanical video reviews (48-hour clinician SLA)
  - Weekly macrocycle load recalibrations based on wearable recovery scores
  - Monthly comprehensive athletic performance & body composition audit
  - In-app priority messaging with Coach Scott Gordon
- **Best For**: Driven executives seeking elite periodization and form correction with asynchronous flexibility.

### Tier 2 - Hybrid Concierge ($649/mo · Flagship)
- **Deliverables**:
  - Everything in Performance Protocol
  - Bi-weekly 1:1 WebRTC live video consultation studio with Coach Scott
  - Interactive video telestrator analysis & real-time frame capture diagnostics
  - Weekly Sunday Performance Dossier with deep biometric & load volume analytics
  - Travel & jetlag workout recalibrations with on-the-fly hotel gym adaptations
  - Same-day priority message SLA
- **Best For**: High performers and business leaders demanding maximum accountability and hands-on video diagnostics.

### Tier 3 - Executive 1:1 Master Retainer ($1,495/mo · Limited to 5 Clients)
- **Deliverables**:
  - Everything in Hybrid Concierge
  - Weekly 1:1 WebRTC live consultation & movement optimization studio
  - Direct private VIP Slack channel with Coach Scott (real-time access)
  - Bi-weekly 3D MediaPipe AI computer-vision kinematic movement scans
  - Daily continuous biometric telemetry monitoring & active recovery dosing
  - Complete concierge travel, dining, and executive lifestyle architecture
- **Best For**: C-suite executives, founders, and elite athletes requiring white-glove, continuous advisory oversight.

### Standalone Diagnostics & Modular Add-ons
- **3D AI Biomechanical Audit**: $97 (One-time, 100% credited toward any advisory retainer within 30 days)
- **1:1 WebRTC Live Studio Session (60-min)**: $149 (Interactive telestrator & kinematic capture)
- **Kinematic Video Review Pack (3 Submissions)**: $59 (Asynchronous 48h turnaround with annotated breakdown)
- **Nutritional & Ergogenic Chrono-Dosing Protocol**: $99/mo (Micronutrient timing & circadian alignment)

---

## 5) Funnel Performance KPI Targets

- **Landing Page -> Intake Diagnostic**: 8–12%
- **Diagnostic Start -> Completion Rate**: 65–75%
- **Diagnostic Completion -> Retainer Application**: 15–22%
- **Retainer Application -> Active Client**: 35–50%
- **90-Day Retainer Retention Rate**: 85%+
- **12-Month Lifetime Value (LTV)**: $3,200+
