import type { Metadata } from 'next'
import Link from 'next/link'
import { FORGE_MEMBERSHIPS } from '@/lib/forge-memberships'
import SiteHeader from '@/components/ui/SiteHeader'
import SiteFooter from '@/components/ui/SiteFooter'
import MarketingLoginActions from '@/components/ui/MarketingLoginActions'
import GaaIcon from '@/components/ui/GaaIcon'
import { LEGAL_DOCUMENTS, MA_HEALTH_CLUB_STATUTORY_NOTICE } from '@/lib/legal-compliance'

export const metadata: Metadata = {
  title: 'Terms of Service & Proprietary Rights | Forge Athletic',
  description:
    'Membership terms, 18+ eligibility, Massachusetts statutory consumer rights, liability screening conditions, and intellectual property protections for Forge Athletic.',
}

export default function TermsOfServicePage() {
  return (
    <>
      <SiteHeader
        fixed
        links={[
          { href: '/', label: 'Home' },
          { href: '/packages', label: 'Memberships' },
          { href: '/apply', label: 'Apply' },
        ]}
        actions={<MarketingLoginActions />}
      />
      <main
        id="main-content"
        style={{
          maxWidth: 900,
          margin: '0 auto',
          padding: 'clamp(5rem, 8vw, 7rem) clamp(16px, 3vw, 24px) 4rem',
          fontFamily: 'Raleway, sans-serif',
          color: '#F5F0E8',
          lineHeight: 1.65,
          boxSizing: 'border-box',
        }}
      >
        <div style={{ borderBottom: '1px solid rgba(197, 160, 89, 0.3)', paddingBottom: '1.5rem', marginBottom: '2.5rem' }}>
          <span style={{ fontSize: '0.75rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.18em', color: 'var(--gold-lt)' }}>
            Legal &amp; Intellectual Property Protection
          </span>
          <h1 style={{ fontFamily: 'var(--font-serif, Cinzel), Georgia, serif', fontSize: '2.5rem', letterSpacing: '0.04em', margin: '0.5rem 0 0', color: '#FFFFFF' }}>
            Terms of Service &amp; Proprietary Rights
          </h1>
          <p style={{ color: '#94A3B8', margin: '0.5rem 0 0', fontSize: '0.9rem' }}>
            Effective &amp; Last Updated: November 11, 2026 · Version {LEGAL_DOCUMENTS.terms_of_service.version} · Forge Athletic Performance LLC (MA ID #002010312)
          </p>
        </div>

        <section style={{ marginBottom: '2.5rem' }}>
          <h2 style={{ fontFamily: 'var(--font-serif, Cinzel), Georgia, serif', fontSize: '1.4rem', letterSpacing: '0.04em', color: 'var(--gold-lt)', marginBottom: '0.75rem' }}>
            1. Acceptance of Terms &amp; Binding Electronic Agreement
          </h2>
          <p>
            By checking the affirmative consent box upon registration, executing an electronic signature under the federal ESIGN Act (15 U.S.C. § 7001) and Massachusetts Uniform Electronic Transactions Act (M.G.L. c. 110G), subscribing to, or utilizing any website, software application, live video consultation studio, or digital advisory service provided by <strong>Forge Athletic Performance LLC d/b/a Forge Athletic</strong> (&quot;Forge Athletic&quot;, &quot;we&quot;, &quot;us&quot;, or &quot;our&quot;), you (&quot;Client&quot;, &quot;Athlete&quot;, &quot;Coach&quot;, or &quot;User&quot;) agree to be legally bound by these Terms of Service, our{' '}
            <Link href="/privacy" style={{ color: 'var(--gold-lt)', textDecoration: 'underline' }}>Privacy Policy</Link>, and our{' '}
            <Link href="/health-privacy" style={{ color: 'var(--gold-lt)', textDecoration: 'underline' }}>Consumer Health &amp; Biometric Data Policy</Link>. If you do not unconditionally agree to these terms, you are strictly prohibited from using the platform.
          </p>
          <h3 style={{ fontFamily: 'var(--font-serif, Cinzel), Georgia, serif', fontSize: '1.15rem', color: '#FFFFFF', margin: '1.25rem 0 0.5rem', letterSpacing: '0.03em' }}>
            1.1 Strict Adult Eligibility (18+ Years of Age Only)
          </h3>
          <p style={{ fontSize: '0.95rem' }}>
            Forge Athletic is designed exclusively for adults. You must be at least <strong>18 years of age</strong>—or the legal age of majority in your state or province of residence (including 19 in Alabama and Nebraska, and 21 in Mississippi)—with full legal capacity to enter into binding contracts and execute liability releases. Individuals under 18 years of age (or under the applicable age of legal majority) are strictly prohibited from registering an account, uploading photos or videos, or using any Forge Athletic service.
          </p>
        </section>

        <section style={{ marginBottom: '2.5rem' }}>
          <h2 style={{ fontFamily: 'var(--font-serif, Cinzel), Georgia, serif', fontSize: '1.4rem', letterSpacing: '0.04em', color: 'var(--gold-lt)', marginBottom: '0.75rem' }}>
            2. Intellectual Property, Trademarks, Trade Secrets &amp; DMCA
          </h2>
          <div style={{ background: 'rgba(14, 23, 38, 0.7)', border: '1px solid rgba(197, 160, 89, 0.35)', borderRadius: 8, padding: '1.25rem 1.5rem', marginBottom: '1rem' }}>
            <p style={{ margin: '0 0 0.75rem', fontWeight: 700, color: '#FFFFFF', display: 'inline-flex', alignItems: 'center', gap: 6 }}>
              <GaaIcon name="lock" size={14} tone="gold" />
              <span>Exclusive Ownership of Proprietary Software, Algorithms &amp; Methodologies</span>
            </p>
            <p style={{ margin: 0, fontSize: '0.92rem', color: '#CBD5E1' }}>
              The Forge Athletic digital platform, including without limitation its software source code, object code, system architecture, database schemas, proprietary algorithms (including the <strong>Forge Adaptive Training Engine™</strong>, <strong>Forge Kinetic Periodization Architect™</strong>, <strong>AI Postural Distortion Mesh Scanner™</strong>, <strong>Chrono-Dosing Ergogenic Protocol™</strong>, <strong>Live Kinetic Telestrator HUD™</strong>, <strong>Sanctuary Mode™</strong>, and <strong>Executive Sunday Intelligence Dossier™</strong>), clean-room sports-science knowledge bases, prompt engineering pipelines, visual interfaces, UI design components, 3D badges, video analytics, audio cadences, and coaching protocols (collectively, the &quot;Proprietary IP&quot;), are the exclusive property and confidential trade secrets of Forge Athletic Performance LLC.
            </p>
          </div>

          <h3 style={{ fontFamily: 'var(--font-serif, Cinzel), Georgia, serif', fontSize: '1.15rem', color: '#FFFFFF', margin: '1.25rem 0 0.5rem', letterSpacing: '0.03em' }}>
            2.1 Trademarks, Trade Dress &amp; Visual Brand Identity
          </h3>
          <p style={{ fontSize: '0.95rem' }}>
            &quot;Forge Athletic™&quot;, &quot;Forge Athletic Performance™&quot;, &quot;Executive Sunday Dossier™&quot;, &quot;Sanctuary Mode™&quot;, the <strong>Forge Crest &amp; Anvil Mark™</strong>, our distinctive midnight-obsidian and burnished-gold visual trade dress, custom clinical movement card layouts, and all associated original logos, product names, and brand badges are proprietary trademarks, service marks, and trade dress of <strong>Forge Athletic Performance LLC</strong>. All Rights Reserved.
          </p>

          <h3 style={{ fontFamily: 'var(--font-serif, Cinzel), Georgia, serif', fontSize: '1.15rem', color: '#FFFFFF', margin: '1.25rem 0 0.5rem', letterSpacing: '0.03em' }}>
            2.2 Strict Prohibition Against Reverse Engineering, Media Ripping &amp; AI Scraping
          </h3>
          <p style={{ fontSize: '0.95rem' }}>
            You explicitly covenant and agree that you will not, under any circumstances:
          </p>
          <ul style={{ paddingLeft: '1.25rem', margin: '0.5rem 0 1rem', fontSize: '0.92rem' }}>
            <li style={{ marginBottom: '0.4rem' }}>
              Decompile, disassemble, reverse engineer, decrypt, extract, or attempt to derive the source code, underlying logic, or trade secret algorithms of the platform;
            </li>
            <li style={{ marginBottom: '0.4rem' }}>
              Download, screen-record, hotlink, rip, redistribute, or remove watermarks/copyright metadata from any Forge Athletic exercise demonstration video, studio loop, clinical movement card, or original athletic photography;
            </li>
            <li style={{ marginBottom: '0.4rem' }}>
              Scrape, crawl, harvest, data-mine, or ingest any portion of the platform, training programs, exercise databases, visual assets, prompt chains, or client telemetry using automated bots, crawlers, or AI systems;
            </li>
            <li style={{ marginBottom: '0.4rem' }}>
              Feed, input, or train any third-party artificial intelligence, machine learning model, large language model (LLM), computer vision model, or neural network on Forge Athletic proprietary images, videos, workout structures, periodization logic, or coaching protocols;
            </li>
            <li style={{ marginBottom: '0.4rem' }}>
              Create derivative works, clone software, white-label services, or commercial coaching applications incorporating or copying Forge Athletic&apos;s advisory structure, live telestrator HUD, or chrono-dosing engines.
            </li>
          </ul>

          <h3 style={{ fontFamily: 'var(--font-serif, Cinzel), Georgia, serif', fontSize: '1.15rem', color: '#FFFFFF', margin: '1.25rem 0 0.5rem', letterSpacing: '0.03em' }}>
            2.3 Limited, Revocable User License
          </h3>
          <p style={{ fontSize: '0.95rem' }}>
            Upon active subscription and good standing, Forge Athletic grants you a non-exclusive, non-transferable, non-sublicensable, revocable, personal license to access and use the platform strictly for your personal, non-commercial athletic training and human performance advisory.
          </p>

          <h3 style={{ fontFamily: 'var(--font-serif, Cinzel), Georgia, serif', fontSize: '1.15rem', color: '#FFFFFF', margin: '1.25rem 0 0.5rem', letterSpacing: '0.03em' }}>
            2.4 Legal Remedies, Statutory Damages &amp; Injunctive Relief
          </h3>
          <p style={{ fontSize: '0.95rem' }}>
            You acknowledge that any breach of these Intellectual Property provisions will cause irreparable harm to Forge Athletic Performance LLC for which monetary damages alone would be inadequate. In addition to statutory copyright damages (17 U.S.C. § 504), Defend Trade Secrets Act remedies (18 U.S.C. § 1836), Lanham Act remedies (15 U.S.C. § 1117), and attorney&apos;s fees, Forge Athletic shall be entitled to seek preliminary and permanent injunctive relief against any actual or threatened infringement.
          </p>

          <h3 style={{ fontFamily: 'var(--font-serif, Cinzel), Georgia, serif', fontSize: '1.15rem', color: '#FFFFFF', margin: '1.25rem 0 0.5rem', letterSpacing: '0.03em' }}>
            2.5 Digital Millennium Copyright Act (DMCA) Notice &amp; Takedown Policy
          </h3>
          <p style={{ fontSize: '0.95rem' }}>
            Forge Athletic respects the intellectual property rights of others in accordance with 17 U.S.C. § 512(c). If you believe any user-submitted or hosted content infringes your copyright, deliver a written notification containing the elements required by 17 U.S.C. § 512(c)(3) (identification of the copyrighted work, identification/URL of the allegedly infringing material, contact details, good-faith belief statement, statement of accuracy under penalty of perjury, and physical or electronic signature) to our DMCA Designated Agent at <a href="mailto:scott@forge-athletic.app" style={{ color: 'var(--gold-lt)', textDecoration: 'underline' }}>scott@forge-athletic.app</a> (or by mail to the Legal Department address in Section 9).
          </p>
        </section>

        <section style={{ marginBottom: '2.5rem' }}>
          <h2 style={{ fontFamily: 'var(--font-serif, Cinzel), Georgia, serif', fontSize: '1.4rem', letterSpacing: '0.04em', color: 'var(--gold-lt)', marginBottom: '0.75rem' }}>
            3. Medical Disclaimer, Scope of Practice, AI Transparency &amp; Remote Safety
          </h2>
          <div style={{ background: 'rgba(239, 68, 68, 0.08)', border: '1px solid rgba(239, 68, 68, 0.35)', borderRadius: 8, padding: '1.25rem 1.5rem', marginBottom: '1rem' }}>
            <p style={{ margin: '0 0 0.5rem', fontWeight: 700, color: '#FCA5A5', display: 'inline-flex', alignItems: 'center', gap: 6 }}>
              <GaaIcon name="alert-triangle" size={14} tone="ruby" />
              <span>Educational Performance Advisory · Not Medical or Physical Therapy Treatment</span>
            </p>
            <p style={{ margin: 0, fontSize: '0.92rem', color: '#E2E8F0' }}>
              Forge Athletic provides athletic conditioning, movement education, and general sports bioenergetics tools for apparently healthy adults. Forge Athletic is <strong>not</strong> a medical healthcare provider, licensed physical therapy clinic, medical dietetics practice, or emergency facility. Nothing on the platform constitutes medical diagnosis, physical therapy prescription, Medical Nutrition Therapy (MNT), or pharmaceutical advice.
            </p>
          </div>
          <p style={{ fontSize: '0.95rem' }}>
            <strong>Scope of Practice &amp; 50-State Non-Medical Nutrition Safe Harbor:</strong> Human coaching is led by Certified Personal Trainers operating strictly within non-medical fitness scope of practice. Pursuant to the Massachusetts Dietetics &amp; Nutrition Safe Harbor (M.G.L. c. 112, §§ 196–208, specifically § 206) and comparable state wellness exemptions nationwide, all macronutrient calculators, bioenergetic expenditure estimates, and dietary supplement guides are general educational sports-conditioning resources for apparently healthy adults—never individualized clinical dietetic prescriptions or disease management. Clients with metabolic, renal, hepatic, cardiovascular, gastrointestinal, pregnancy, or eating-disorder conditions must obtain nutritional care solely from a licensed physician or Registered Dietitian (RD/LDN).
          </p>
          <p style={{ fontSize: '0.95rem' }}>
            <strong>FDA DSHEA, WADA/NCAA &amp; Affiliate Dispensary Transparency:</strong> Educational statements regarding dietary supplements have not been evaluated by the U.S. Food and Drug Administration and are not intended to diagnose, treat, cure, or prevent any disease. Drug-tested athletes (NCAA, WADA, USADA, military) bear sole responsibility for verifying third-party batch certification (NSF Certified for Sport® / Informed-Sport). Where Forge Athletic provides optional partner links or courtesy discount codes (such as Thorne, REP Fitness, Crossover Symmetry, or Perform Better), Forge Athletic may earn an affiliate commission at no extra cost to you (16 CFR Part 255).
          </p>
          <p style={{ fontSize: '0.95rem' }}>
            <strong>AI, Computer Vision &amp; Synthesized Audio Transparency:</strong> Self-serve periodization, posture landmark summaries, S.O.A.P. session summaries, physique concept visualizations, and synthesized audio briefings utilize artificial intelligence models calibrated to sports-science protocols. Simulated physique visualizations are illustrative concepts only and never guarantee physical outcomes. Always prioritize pain-free biomechanical judgment over any automated cue.
          </p>
          <p style={{ fontSize: '0.95rem' }}>
            <strong>Remote Safety, ERAP &amp; All-Party Recording Consent (M.G.L. c. 272, § 99):</strong> Virtual coaches are not physically co-located and cannot physically spot you. You assume sole responsibility for maintaining a clear 8x8 ft training space, using barbell safety pins/collars, inspecting all hardware before every lift, and maintaining an accurate Emergency Response Action Plan (ERAP) physical address prior to live WebRTC sessions. Live telestrator capture or S.O.A.P. audio transcription occurs strictly with contemporaneous visual notice (`REC` indicator) and explicit consent of all session participants; you agree to notify any bystanders entering your room. Stop exercising immediately and call 911 if you experience chest discomfort, syncope, dizziness, or acute pain.
          </p>
        </section>

        <section style={{ marginBottom: '2.5rem' }}>
          <h2 style={{ fontFamily: 'var(--font-serif, Cinzel), Georgia, serif', fontSize: '1.4rem', letterSpacing: '0.04em', color: 'var(--gold-lt)', marginBottom: '0.75rem' }}>
            4. Billing, Auto-Renewal, FTC Click-to-Cancel &amp; Massachusetts Statutory Rights
          </h2>
          <p style={{ fontSize: '0.95rem' }}>
            Memberships are billed on a recurring monthly or annual basis as clearly disclosed at checkout and automatically renew at the conclusion of each billing cycle unless cancelled prior to the renewal date. Core Membership includes a seven-day free trial; unless cancelled before trial expiration, your designated payment method will be charged the recurring subscription rate shown at checkout. We send electronic pre-renewal reminder notices at least 3 days prior to 7-day trial conversion and 15–45 days prior to annual membership renewal.
          </p>

          <div style={{ background: 'rgba(14, 23, 38, 0.78)', border: '1px solid rgba(197, 160, 89, 0.4)', borderRadius: 8, padding: '1.15rem 1.4rem', margin: '1rem 0' }}>
            <p style={{ margin: '0 0 0.45rem', fontWeight: 800, fontSize: '0.88rem', letterSpacing: '0.06em', textTransform: 'uppercase', color: 'var(--gold-lt)' }}>
              Massachusetts Statutory Right of Cancellation &amp; Disability Protection (M.G.L. c. 93, §§ 78–88)
            </p>
            <p style={{ margin: 0, fontSize: '0.9rem', color: '#E2E8F0' }}>
              {MA_HEALTH_CLUB_STATUTORY_NOTICE} No training contract exceeds twenty-four (24) months in duration, and nothing in these Terms waives any unwaivable consumer right under M.G.L. c. 93, § 80 or M.G.L. c. 93A.
            </p>
          </div>

          <p style={{ fontSize: '0.95rem' }}>
            <strong>FTC &amp; Multistate 1-Click Cancellation Procedure:</strong> You may cancel recurring renewals at any time with <strong>zero cancellation fees</strong> via:
          </p>
          <ul style={{ paddingLeft: '1.25rem', margin: '0.5rem 0 1rem', fontSize: '0.92rem' }}>
            <li style={{ marginBottom: '0.4rem' }}>
              <strong>Online 1-Click Cancellation:</strong> Navigate to <em>Account Settings &gt; Billing</em> in your authenticated portal and select &quot;Cancel Membership&quot;; or
            </li>
            <li style={{ marginBottom: '0.4rem' }}>
              <strong>Email Notice:</strong> Email <a href="mailto:scott@forge-athletic.app" style={{ color: 'var(--gold-lt)', textDecoration: 'underline' }}>scott@forge-athletic.app</a> from your registered account email prior to your scheduled renewal date.
            </li>
          </ul>
          <p style={{ fontSize: '0.95rem' }}>
            Upon cancellation after any applicable statutory 3-business-day cooling-off period (and absent qualifying medical disability/relocation/statutory refund events), your subscription will not renew, you retain full access through the end of your current paid billing cycle, and prior completed billing cycles are non-refundable except where required by applicable state or federal law. Applicable sales/SaaS taxes are calculated at checkout based on your billing jurisdiction.
          </p>
        </section>

        <section style={{ marginBottom: '2.5rem' }}>
          <h2 style={{ fontFamily: 'var(--font-serif, Cinzel), Georgia, serif', fontSize: '1.4rem', letterSpacing: '0.04em', color: 'var(--gold-lt)', marginBottom: '0.75rem' }}>
            5. Membership Features
          </h2>
          <p style={{ marginBottom: '0.75rem', fontSize: '0.95rem' }}>
            Membership features are defined by the plan selected at checkout (Core and Plus provide algorithmic periodization and structured asynchronous tools; Coach Support and Private Concierge tiers include direct human review by a certified coach):
          </p>
          {FORGE_MEMBERSHIPS.map(membership => (
            <div key={membership.id} style={{ border: '1px solid rgba(245,158,11,0.25)', padding: '1rem 1.25rem', marginBottom: '0.9rem', background: 'rgba(15, 23, 42, 0.75)', borderRadius: 6 }}>
              <h3 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.2rem', margin: '0 0 0.3rem', color: 'var(--gold-lt)', letterSpacing: '0.03em' }}>
                {membership.name} (<span style={{ fontFamily: 'var(--font-telemetry, monospace)' }}>${membership.monthlyPriceCents / 100}/month</span>)
              </h3>
              {membership.annualPriceCents !== undefined && (
                <p style={{ margin: '0 0 0.5rem', fontSize: '0.88rem' }}>
                  Annual option: <span style={{ fontFamily: 'var(--font-telemetry, monospace)' }}>${membership.annualPriceCents / 100}/year</span>. Seven-day free trial.
                </p>
              )}
              <ul style={{ margin: '0 0 0.5rem 1.1rem', padding: 0, fontSize: '0.88rem' }}>
                {membership.features.map(feature => (
                  <li key={feature} style={{ marginBottom: '0.2rem' }}>{feature}</li>
                ))}
              </ul>
            </div>
          ))}
        </section>

        <section style={{ marginBottom: '2.5rem' }}>
          <h2 style={{ fontFamily: 'var(--font-serif, Cinzel), Georgia, serif', fontSize: '1.4rem', letterSpacing: '0.04em', color: 'var(--gold-lt)', marginBottom: '0.75rem' }}>
            6. Assumption of Risk, Ordinary Negligence Release &amp; Limitation of Liability
          </h2>
          <p style={{ fontSize: '0.95rem' }}>
            <strong>Voluntary Assumption of Risk &amp; Ordinary Negligence Release:</strong> You acknowledge that resistance training, plyometrics, cardiovascular conditioning, and movement assessments carry inherent risks of musculoskeletal injury, rhabdomyolysis, cardiovascular events, or property damage. To the fullest extent permitted by Massachusetts law (excluding gross negligence, reckless or intentional misconduct, or unwaivable statutory rights), you voluntarily assume all inherent risks and release, waive, and discharge Forge Athletic Performance LLC, its managers, coaches, employees, and agents from claims or liabilities arising out of ordinary negligence in connection with your training participation.
          </p>
          <p style={{ fontSize: '0.95rem' }}>
            <strong>Aggregate Liability Cap:</strong> To the maximum extent permitted by applicable law, Forge Athletic Performance LLC shall not be liable for indirect, incidental, special, consequential, or punitive damages, and our total cumulative liability for any claim arising out of or relating to the platform shall not exceed the greater of (a) the total fees paid by you to Forge Athletic in the twelve (12) months preceding the event giving rise to the claim or (b) one hundred U.S. dollars ($100.00).
          </p>
          <p style={{ fontSize: '0.95rem' }}>
            You agree to indemnify and hold harmless Forge Athletic Performance LLC from third-party claims arising from your violation of these Terms or infringement of third-party rights.
          </p>
        </section>

        <section style={{ marginBottom: '2.5rem' }}>
          <h2 style={{ fontFamily: 'var(--font-serif, Cinzel), Georgia, serif', fontSize: '1.4rem', letterSpacing: '0.04em', color: 'var(--gold-lt)', marginBottom: '0.75rem' }}>
            7. Governing Law, Pre-Dispute Cure, Individual Arbitration &amp; Batching Protocol
          </h2>
          <p style={{ fontSize: '0.95rem' }}>
            These Terms are governed by the laws of the Commonwealth of Massachusetts (and the Federal Arbitration Act, 9 U.S.C. § 1 et seq., as to arbitration), without regard to conflict-of-law rules.
          </p>
          <p style={{ fontSize: '0.95rem' }}>
            <strong>Mandatory 60-Day Informal Pre-Arbitration Notice &amp; Cure:</strong> Before initiating arbitration or small-claims litigation, the claiming party must send an individualized written Notice of Dispute personally signed by the claimant (including full name, account email, factual description of the claim, and specific relief sought) to <a href="mailto:scott@forge-athletic.app" style={{ color: 'var(--gold-lt)', textDecoration: 'underline' }}>scott@forge-athletic.app</a>. The parties shall engage in good-faith informal resolution (including an individualized teleconference if requested) for sixty (60) days before any arbitration demand may be filed; applicable statutes of limitation are tolled during this 60-day period.
          </p>
          <p style={{ fontSize: '0.95rem' }}>
            <strong>Binding Individual Arbitration &amp; Staged Mass-Arbitration Protocol:</strong> Unresolved disputes (except small-claims court actions or emergency intellectual-property injunctive relief) shall be resolved exclusively by confidential, binding individual arbitration administered by the <strong>American Arbitration Association (AAA)</strong> under its Consumer Arbitration Rules (and, where 25 or more coordinated or substantially similar demands are asserted by or with the assistance of the same counsel, under AAA&apos;s Mass Arbitration Supplementary Rules and a staged bellwether process of up to 15 bilateral test cases per stage before additional filing fees are assessed), conducted in Massachusetts or via video teleconference.
          </p>
          <p style={{ fontSize: '0.95rem' }}>
            <strong>Class &amp; Representative Action Waiver:</strong> ALL CLAIMS MUST BE BROUGHT SOLELY IN AN INDIVIDUAL CAPACITY AND NOT AS A PLAINTIFF OR CLASS MEMBER IN ANY PURPORTED CLASS, COLLECTIVE, CONSOLIDATED, OR REPRESENTATIVE PROCEEDING.
          </p>
          <p style={{ fontSize: '0.95rem' }}>
            <strong>30-Day Arbitration Opt-Out Right:</strong> You may opt out of arbitration within thirty (30) days of initial account creation by emailing <a href="mailto:scott@forge-athletic.app" style={{ color: 'var(--gold-lt)', textDecoration: 'underline' }}>scott@forge-athletic.app</a> with your full legal name, account email, and an unambiguous statement opting out of arbitration.
          </p>
        </section>

        <section style={{ marginBottom: '2.5rem' }}>
          <h2 style={{ fontFamily: 'var(--font-serif, Cinzel), Georgia, serif', fontSize: '1.4rem', letterSpacing: '0.04em', color: 'var(--gold-lt)', marginBottom: '0.75rem' }}>
            8. Third-Party Trademarks &amp; Certification Non-Affiliation
          </h2>
          <div style={{ background: 'rgba(14, 23, 38, 0.75)', border: '1px solid rgba(197, 160, 89, 0.3)', borderRadius: 8, padding: '1.25rem 1.5rem', marginBottom: '1rem' }}>
            <p style={{ margin: '0 0 0.5rem', fontSize: '0.92rem', color: '#CBD5E1', lineHeight: 1.6 }}>
              <strong>Trademark Ownership Acknowledgement:</strong> NASM®, Optimum Performance Training™, OPT™, Corrective Exercise Specialist (CES®), Performance Enhancement Specialist (PES®), Certified Nutrition Coach (CNC™), and Certified Personal Trainer (CPT®) are registered trademarks or service marks owned exclusively by the National Academy of Sports Medicine (NASM) and/or Ascend Learning, LLC.
            </p>
            <p style={{ margin: 0, fontSize: '0.92rem', color: '#CBD5E1', lineHeight: 1.6 }}>
              <strong>Independent Status &amp; Nominative Fair Use:</strong> Forge Athletic Performance LLC is an independent private organization and is <strong>not affiliated with, sponsored by, authorized by, or endorsed by</strong> NASM or Ascend Learning, LLC. References to individual coach credentials and scientific periodization terminology are made strictly for truthful credential verification and educational compatibility under the <em>Nominative Fair Use Doctrine</em> (15 U.S.C. § 1125).
            </p>
          </div>
          <p style={{ fontSize: '0.92rem', color: '#94A3B8' }}>
            All other third-party marks—including Apple®, HealthKit®, Google®, Health Connect™, Whoop®, Garmin®, Thorne®, REP Fitness®, Crossover Symmetry®, Perform Better®, and Stripe®—are the property of their respective owners.
          </p>
        </section>

        <section style={{ borderTop: '1px solid rgba(197, 160, 89, 0.3)', paddingTop: '1.5rem' }}>
          <h2 style={{ fontFamily: 'var(--font-serif, Cinzel), Georgia, serif', fontSize: '1.3rem', color: 'var(--gold-lt)', marginBottom: '0.5rem', letterSpacing: '0.04em' }}>
            9. Legal, DMCA &amp; Intellectual Property Inquiries
          </h2>
          <p style={{ fontSize: '0.92rem', margin: 0 }}>
            For legal notices, DMCA notifications, dispute notices, or licensing inquiries, contact:
          </p>
          <p style={{ margin: '0.4rem 0 0', fontSize: '0.95rem', color: 'var(--gold-lt)' }}>
            <strong>Forge Athletic Performance LLC</strong><br />
            Attn: Legal, DMCA &amp; Intellectual Property Department<br />
            82 Wendell Ave., Ste 100<br />
            Pittsfield, MA 01201<br />
            Phone: <a href="tel:+14132426370" style={{ color: 'var(--gold-lt)', textDecoration: 'underline' }}>413-242-6370</a><br />
            Email: <a href="mailto:scott@forge-athletic.app" style={{ color: 'var(--gold-lt)', textDecoration: 'underline' }}>scott@forge-athletic.app</a>
          </p>
        </section>
      </main>
      <SiteFooter />
    </>
  )
}
