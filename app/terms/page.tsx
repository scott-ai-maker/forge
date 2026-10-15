import type { Metadata } from 'next'
import { FORGE_MEMBERSHIPS } from '@/lib/forge-memberships'
import SiteHeader from '@/components/ui/SiteHeader'
import SiteFooter from '@/components/ui/SiteFooter'
import MarketingLoginActions from '@/components/ui/MarketingLoginActions'
import GaaIcon from '@/components/ui/GaaIcon'

export const metadata: Metadata = {
  title: 'Terms of Service & Intellectual Property Rights',
  description: 'Membership terms, liability screening conditions, and intellectual property protections for Forge Athletic.',
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
      <main id="main-content" style={{ maxWidth: 900, margin: '0 auto', padding: 'clamp(5rem, 8vw, 7rem) clamp(16px, 3vw, 24px) 4rem', fontFamily: 'Raleway, sans-serif', color: '#F5F0E8', lineHeight: 1.65, boxSizing: 'border-box' }}>
        <div style={{ borderBottom: '1px solid rgba(197, 160, 89, 0.3)', paddingBottom: '1.5rem', marginBottom: '2.5rem' }}>
        <span style={{ fontSize: '0.75rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.18em', color: 'var(--gold-lt)' }}>
          Legal &amp; Intellectual Property Protection
        </span>
        <h1 style={{ fontFamily: 'var(--font-serif, Cinzel), Georgia, serif', fontSize: '2.5rem', letterSpacing: '0.04em', margin: '0.5rem 0 0', color: '#FFFFFF' }}>
          Terms of Service &amp; Proprietary Rights
        </h1>
        <p style={{ color: '#8A99AA', margin: '0.5rem 0 0', fontSize: '0.9rem' }}>
          Effective &amp; Last Updated: October 8, 2026 · Forge Athletic Performance LLC
        </p>
      </div>

      <section style={{ marginBottom: '2.5rem' }}>
        <h2 style={{ fontFamily: 'var(--font-serif, Cinzel), Georgia, serif', fontSize: '1.4rem', letterSpacing: '0.04em', color: 'var(--gold-lt)', marginBottom: '0.75rem' }}>
          1. Acceptance of Terms &amp; Binding Agreement
        </h2>
        <p>
          By accessing, browsing, creating an account on, subscribing to, or utilizing any website, software application, live video consultation studio, or digital advisory service provided by <strong>Forge Athletic Performance LLC d/b/a Forge Athletic</strong> (&quot;Forge Athletic&quot;, &quot;we&quot;, &quot;us&quot;, or &quot;our&quot;), you (&quot;Client&quot;, &quot;Athlete&quot;, &quot;Coach&quot;, or &quot;User&quot;) agree to be legally bound by these Terms of Service, our Privacy Policy, and all incorporated proprietary agreements. If you do not unconditionally agree to these terms, you are strictly prohibited from using the platform and must discontinue access immediately.
        </p>
        <h3 style={{ fontFamily: 'var(--font-serif, Cinzel), Georgia, serif', fontSize: '1.15rem', color: '#FFFFFF', margin: '1.25rem 0 0.5rem', letterSpacing: '0.03em' }}>
          1.1 Eligibility, Age Requirements &amp; Minors
        </h3>
        <p style={{ fontSize: '0.95rem' }}>
          You must be at least 18 years of age (or the legal age of majority in your jurisdiction) to create an account, purchase memberships, or execute liability waivers. Individuals aged 13 to 17 may access training modules strictly with the express consent and direct supervision of a parent or legal guardian who agrees to be bound by these Terms and executes all informed consent documents on the minor&apos;s behalf. The platform is strictly prohibited for anyone under 13 years of age.
        </p>
      </section>

      <section style={{ marginBottom: '2.5rem' }}>
        <h2 style={{ fontFamily: 'var(--font-serif, Cinzel), Georgia, serif', fontSize: '1.4rem', letterSpacing: '0.04em', color: 'var(--gold-lt)', marginBottom: '0.75rem' }}>
          2. Intellectual Property, Patents, Trademarks &amp; Trade Secrets
        </h2>
        <div style={{ background: 'rgba(14, 23, 38, 0.7)', border: '1px solid rgba(197, 160, 89, 0.35)', borderRadius: 8, padding: '1.25rem 1.5rem', marginBottom: '1rem' }}>
          <p style={{ margin: '0 0 0.75rem', fontWeight: 700, color: '#FFFFFF', display: 'inline-flex', alignItems: 'center', gap: 6 }}>
            <GaaIcon name="lock" size={14} tone="gold" />
            <span>Exclusive Ownership of Proprietary Software, Algorithms &amp; Methodologies</span>
          </p>
          <p style={{ margin: 0, fontSize: '0.92rem', color: '#CBD5E1' }}>
            The Forge Athletic digital platform, including without limitation its software source code, object code, system architecture, database schemas, proprietary algorithms (including the <strong>Gordon Adaptive Training Engine™</strong>, <strong>OPT™ Periodization Architect™</strong>, <strong>AI Postural Distortion Mesh Scanner™</strong>, <strong>Chrono-Dosing Ergogenic Protocol™</strong>, <strong>Live Kinetic Telestrator HUD™</strong>, and <strong>Executive Sunday Intelligence Dossier™</strong>), RAG knowledge bases, prompt engineering pipelines, visual interfaces, UI design components, 3D badges, video analytics, audio cadences, and clinical protocols (collectively, the &quot;Proprietary IP&quot;), are the exclusive property of Forge Athletic Performance LLC.
          </p>
        </div>

        <h3 style={{ fontFamily: 'var(--font-serif, Cinzel), Georgia, serif', fontSize: '1.15rem', color: '#FFFFFF', margin: '1.25rem 0 0.5rem', letterSpacing: '0.03em' }}>
          2.1 Trademarks &amp; Service Marks
        </h3>
        <p style={{ fontSize: '0.95rem' }}>
          &quot;Forge Athletic&quot;, &quot;Forge&quot;, &quot;GATE&quot;, &quot;Executive Sunday Dossier&quot;, the Forge Architectural Swiss Monogram, and all associated logos, product names, and brand badges are proprietary trademarks and service marks of Forge Athletic Performance LLC. All Rights Reserved. NASM and OPT™ are registered marks of the National Academy of Sports Medicine used under license and standard educational citation.
        </p>

        <h3 style={{ fontFamily: 'var(--font-serif, Cinzel), Georgia, serif', fontSize: '1.15rem', color: '#FFFFFF', margin: '1.25rem 0 0.5rem', letterSpacing: '0.03em' }}>
          2.2 Strict Prohibition Against Reverse Engineering &amp; AI Scraping
        </h3>
        <p style={{ fontSize: '0.95rem' }}>
          You explicitly covenant and agree that you will not, under any circumstances:
        </p>
        <ul style={{ paddingLeft: '1.25rem', margin: '0.5rem 0 1rem', fontSize: '0.92rem' }}>
          <li style={{ marginBottom: '0.4rem' }}>
            Decompile, disassemble, reverse engineer, decrypt, extract, or attempt to derive the source code, underlying logic, or trade secret algorithms of the platform;
          </li>
          <li style={{ marginBottom: '0.4rem' }}>
            Scrape, crawl, harvest, data-mine, or ingest any portion of the platform, training programs, exercise databases, prompt chains, or client telemetry using automated bots, crawlers, or AI systems;
          </li>
          <li style={{ marginBottom: '0.4rem' }}>
            Feed, input, or train any third-party artificial intelligence, machine learning model, large language model (LLM), or neural network on Forge Athletic proprietary workout structures, periodization logic, or clinical protocols;
          </li>
          <li style={{ marginBottom: '0.4rem' }}>
            Create derivative works, clone software, white-label services, or commercial coaching applications incorporating or copying Forge Athletic’s unique four-pillar advisory structure, live telestrator HUD, or chrono-dosing engines.
          </li>
        </ul>

        <h3 style={{ fontFamily: 'var(--font-serif, Cinzel), Georgia, serif', fontSize: '1.15rem', color: '#FFFFFF', margin: '1.25rem 0 0.5rem', letterSpacing: '0.03em' }}>
          2.3 Limited, Revocable User License
        </h3>
        <p style={{ fontSize: '0.95rem' }}>
          Upon active subscription and good standing, Forge Athletic grants you a non-exclusive, non-transferable, non-sublicensable, revocable, personal license to access and use the platform strictly for your personal, non-commercial athletic training and human performance advisory. You may not distribute, resell, rent, lease, or publicly display any prescribed materials, workout plans, or software interfaces without express written authorization.
        </p>

        <h3 style={{ fontFamily: 'var(--font-serif, Cinzel), Georgia, serif', fontSize: '1.15rem', color: '#FFFFFF', margin: '1.25rem 0 0.5rem', letterSpacing: '0.03em' }}>
          2.4 Legal Remedies &amp; Injunctive Relief
        </h3>
        <p style={{ fontSize: '0.95rem' }}>
          You acknowledge that any breach of these Intellectual Property provisions will cause irreparable and immediate harm to Forge Athletic Performance LLC for which monetary damages alone would be inadequate. Accordingly, in addition to all other available legal remedies, Forge Athletic shall be entitled to seek immediate preliminary and permanent injunctive relief against any actual or threatened infringement without the necessity of posting a bond.
        </p>
      </section>

      <section style={{ marginBottom: '2.5rem' }}>
        <h2 style={{ fontFamily: 'var(--font-serif, Cinzel), Georgia, serif', fontSize: '1.4rem', letterSpacing: '0.04em', color: 'var(--gold-lt)', marginBottom: '0.75rem' }}>
          3. Medical Disclaimer, Physical Readiness &amp; Assumption of Risk
        </h2>
        <div style={{ background: 'rgba(239, 68, 68, 0.08)', border: '1px solid rgba(239, 68, 68, 0.35)', borderRadius: 8, padding: '1.25rem 1.5rem', marginBottom: '1rem' }}>
          <p style={{ margin: '0 0 0.5rem', fontWeight: 700, color: '#FCA5A5', display: 'inline-flex', alignItems: 'center', gap: 6 }}>
            <GaaIcon name="alert-triangle" size={14} tone="ruby" />
            <span>Educational Performance Advisory · Not Medical Treatment</span>
          </p>
          <p style={{ margin: 0, fontSize: '0.92rem', color: '#E2E8F0' }}>
            Forge Athletic provides high-performance athletic conditioning, movement analysis, and nutritional supplementation education. Forge Athletic is <strong>not</strong> a medical healthcare provider, physical therapy clinic, or emergency medical facility. No communication, assessment, or AI synthesis constitutes medical diagnosis, physical therapy prescription, medical nutrition therapy, or pharmacological medical advice.
          </p>
        </div>
        <p style={{ fontSize: '0.95rem' }}>
          <strong>Scope of Practice &amp; Professional Qualifications:</strong> Coaching is led by Certified Personal Trainers credentialed through the National Academy of Sports Medicine (NASM-CPT®, NCCA-accredited). Coaches operate strictly within the NASM-CPT Scope of Practice. Coaches do not diagnose medical conditions, treat injuries, prescribe medical diets, or prescribe pharmaceuticals or therapeutic substances. All dietary supplement guides and timing schedules are educational sports nutrition models based on peer-reviewed literature.
        </p>
        <p style={{ fontSize: '0.95rem' }}>
          <strong>Massachusetts Non-Medical Nutrition &amp; Dietetics Safe Harbor (M.G.L. c. 112, §§ 196-208):</strong> All nutritional information, bioenergetic expenditure estimates, macronutrient targets, and dietary supplement educational guides provided by Forge Athletic are intended exclusively for general wellness, educational purposes, and athletic conditioning in apparently healthy individuals. Forge Athletic coaches are not licensed medical dietitians and do not provide Medical Nutrition Therapy (MNT). Our services are not intended to diagnose, treat, or manage clinical conditions, metabolic disorders, renal pathology, or eating disorders. Clients with clinical medical diagnoses must seek nutritional guidance from a licensed physician or registered dietitian.
        </p>
        <p style={{ fontSize: '0.95rem' }}>
          <strong>Physician Clearance Requirement:</strong> You must consult your physician or qualified medical doctor prior to beginning any exercise program, physical activity readiness questionnaire (PAR-Q+), movement screen, or dietary supplementation regimen. You affirm that you are in good physical condition, have obtained all necessary medical clearances, and have disclosed all known cardiovascular symptoms, injuries, or contraindications.
        </p>
        <p style={{ fontSize: '0.95rem' }}>
          <strong>Remote &amp; Virtual Coaching Safety:</strong> Coaching sessions, video reviews, and algorithmic plans are delivered virtually. You acknowledge that your coach is not physically co-located and cannot physically spot, catch, or physically assist you during any lift. You assume full personal responsibility for maintaining a safe, clear 8x8 ft perimeter, ensuring non-slip flooring, using collar clips on loaded barbells, and inspecting all equipment prior to every workout.
        </p>
        <p style={{ fontSize: '0.95rem' }}>
          <strong>Emergency Protocol:</strong> If at any time during physical training you experience dizziness, lightheadedness, nausea, shortness of breath, abnormal palpitations, or chest discomfort, you must immediately stop all exertion and seek emergency medical assistance (call 911 or your local emergency dispatch service).
        </p>
        <p style={{ fontSize: '0.95rem' }}>
          <strong>Voluntary Assumption of Risk:</strong> You acknowledge that intense physical exercise, weightlifting, cardiovascular conditioning, and biomechanical screening involve inherent risks of injury (including sprains, strains, fractures, rhabdomyolysis, or cardiovascular events) or property damage. You voluntarily and knowingly assume all known and unknown risks associated with your participation.
        </p>
      </section>

      <section style={{ marginBottom: '2.5rem' }}>
        <h2 style={{ fontFamily: 'var(--font-serif, Cinzel), Georgia, serif', fontSize: '1.4rem', letterSpacing: '0.04em', color: 'var(--gold-lt)', marginBottom: '0.75rem' }}>
          4. Membership Payments, Auto-Renewal &amp; Cancellation Rights
        </h2>
        <p style={{ fontSize: '0.95rem' }}>
          Memberships are billed on a recurring monthly or annual basis as displayed at checkout and automatically renew at the end of each billing cycle unless cancelled prior to the renewal date. Core Membership includes a seven-day free trial; upon conclusion of the trial period, your designated payment method will be charged the recurring subscription fee unless cancelled prior to the trial expiration. Payments are processed securely via Stripe.
        </p>
        <p style={{ fontSize: '0.95rem' }}>
          <strong>FTC &amp; State Auto-Renewal Cancellation Procedure:</strong> In full compliance with Federal Trade Commission (FTC) negative option rules and applicable state automatic renewal laws (including Massachusetts, California, and New York), you may cancel your recurring membership at any time with <strong>zero cancellation fees</strong> through either of the following straightforward methods:
        </p>
        <ul style={{ paddingLeft: '1.25rem', margin: '0.5rem 0 1rem', fontSize: '0.92rem' }}>
          <li style={{ marginBottom: '0.4rem' }}>
            <strong>Online 1-Click Cancellation:</strong> Navigate to <em>Account Settings &gt; Billing</em> within the authenticated client portal and select &quot;Cancel Membership&quot;; or
          </li>
          <li style={{ marginBottom: '0.4rem' }}>
            <strong>Email Notice:</strong> Send a written cancellation notice to <a href="mailto:scott@forge-athletic.app" style={{ color: 'var(--gold-lt)', textDecoration: 'underline' }}>scott@forge-athletic.app</a> from your registered account email at least 24 hours prior to your scheduled billing renewal date.
          </li>
        </ul>
        <p style={{ fontSize: '0.95rem' }}>
          Upon cancellation, your subscription will not renew, and you will continue to have full access to your membership features through the conclusion of your current paid billing period. All sales are final and non-refundable once billed, except where required by law.
        </p>
      </section>

      <section style={{ marginBottom: '2.5rem' }}>
        <h2 style={{ fontFamily: 'var(--font-serif, Cinzel), Georgia, serif', fontSize: '1.4rem', letterSpacing: '0.04em', color: 'var(--gold-lt)', marginBottom: '0.75rem' }}>
          5. Membership Features
        </h2>
        <p style={{ marginBottom: '0.75rem', fontSize: '0.95rem' }}>
          Membership features are defined by the current plan selected at checkout:
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
          6. Limitation of Liability, Release of Claims &amp; Indemnification
        </h2>
        <p style={{ fontSize: '0.95rem' }}>
          To the maximum extent permitted by applicable law, in no event shall Forge Athletic Performance LLC, its managers, coaches, officers, employees, or technology providers be liable for any indirect, punitive, incidental, special, consequential, or exemplary damages, including without limitation damages for loss of profits, bodily injury, goodwill, data, or other intangible losses.
        </p>
        <p style={{ fontSize: '0.95rem' }}>
          <strong>Comprehensive Release &amp; Waiver:</strong> You expressly release, waive, and forever discharge Forge Athletic Performance LLC, its owners, coaches, agents, and affiliates from any and all liabilities, claims, demands, or causes of action arising out of negligence, personal injury, illness, or property damage resulting from your participation in any training program, movement screen, or advice provided by Forge Athletic. You covenant not to initiate any lawsuit or legal proceeding against Forge Athletic Performance LLC regarding such matters.
        </p>
        <p style={{ fontSize: '0.95rem' }}>
          You agree to defend, indemnify, and hold harmless Forge Athletic Performance LLC from and against any and all claims, damages, obligations, losses, liabilities, costs, or debt arising from your violation of these Terms, misuse of the platform, or breach of any third-party intellectual property or privacy rights.
        </p>
      </section>

      <section style={{ marginBottom: '2.5rem' }}>
        <h2 style={{ fontFamily: 'var(--font-serif, Cinzel), Georgia, serif', fontSize: '1.4rem', letterSpacing: '0.04em', color: 'var(--gold-lt)', marginBottom: '0.75rem' }}>
          7. Governing Law, Binding Individual Arbitration &amp; Class Action Waiver
        </h2>
        <p style={{ fontSize: '0.95rem' }}>
          These Terms and any dispute, controversy, or claim arising out of or relating to your use of the platform shall be governed by and construed in accordance with the laws of the Commonwealth of Massachusetts (including M.G.L. c. 156C), without regard to its conflict of law principles.
        </p>
        <p style={{ fontSize: '0.95rem' }}>
          <strong>Mandatory Binding Individual Arbitration:</strong> Except for small claims court actions or claims seeking emergency preliminary injunctive relief regarding intellectual property infringement, you and Forge Athletic Performance LLC agree that any dispute, claim, or controversy arising out of or relating to these Terms, your membership, personal training advice, or platform usage shall be settled by confidential, binding individual arbitration administered by the <strong>American Arbitration Association (AAA)</strong> in accordance with its Consumer Arbitration Rules. The arbitration shall be conducted in the Commonwealth of Massachusetts or via secure teleconference, before a single neutral arbitrator. The arbitrator&apos;s decision shall be final and binding, and judgment on the award rendered by the arbitrator may be entered in any court having jurisdiction thereof.
        </p>
        <p style={{ fontSize: '0.95rem' }}>
          <strong>Class Action &amp; Representative Action Waiver:</strong> YOU AND FORGE ATHLETIC PERFORMANCE LLC EXPLICITLY AGREE THAT ALL CLAIMS MUST BE BROUGHT SOLELY IN YOUR INDIVIDUAL CAPACITY, AND NOT AS A PLAINTIFF, CLASS REPRESENTATIVE, OR CLASS MEMBER IN ANY PURPORTED CLASS, CONSOLIDATED, OR REPRESENTATIVE PROCEEDING. THE ARBITRATOR MAY NOT CONSOLIDATE MORE THAN ONE PERSON&apos;S CLAIMS AND MAY NOT PRESIDE OVER ANY FORM OF A REPRESENTATIVE OR CLASS PROCEEDING.
        </p>
        <p style={{ fontSize: '0.95rem' }}>
          <strong>30-Day Arbitration Opt-Out Right:</strong> You have the right to opt out of this mandatory arbitration agreement by sending written notice of your decision to <a href="mailto:scott@forge-athletic.app" style={{ color: 'var(--gold-lt)', textDecoration: 'underline' }}>scott@forge-athletic.app</a> within thirty (30) days of your initial account registration or subscription date. The notice must include your full legal name, email address, and an unambiguous statement that you wish to opt out of arbitration. If you opt out, all other provisions of these Terms remain in full force and effect.
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
            <strong>Independent Status &amp; Nominative Fair Use:</strong> Forge Athletic Performance LLC is an independent private organization and is <strong>not affiliated with, sponsored by, authorized by, or endorsed by</strong> NASM or Ascend Learning, LLC. All references throughout the application, user interfaces, educational documentation, and algorithms to the Optimum Performance Training (OPT™) framework, phase categorizations (Stabilization, Strength, Power), and kinetic screening protocols are made strictly for educational, methodological compatibility, and scientific periodization reference under the <em>Nominative Fair Use Doctrine</em> (15 U.S.C. § 1125).
          </p>
        </div>
        <p style={{ fontSize: '0.92rem', color: '#94A3B8' }}>
          All other third-party trademarks, including Apple Health®, Whoop®, Stripe®, and Google Gemini®, are the property of their respective owners and their mention does not imply endorsement or official partnership.
        </p>
      </section>

      <section style={{ borderTop: '1px solid rgba(197, 160, 89, 0.3)', paddingTop: '1.5rem' }}>
        <h2 style={{ fontFamily: 'var(--font-serif, Cinzel), Georgia, serif', fontSize: '1.3rem', color: 'var(--gold-lt)', marginBottom: '0.5rem', letterSpacing: '0.04em' }}>
          9. Intellectual Property &amp; Legal Inquiries
        </h2>
        <p style={{ fontSize: '0.92rem', margin: 0 }}>
          For inquiries regarding intellectual property licensing, trademark permissions, or legal notices, contact:
        </p>
        <p style={{ margin: '0.4rem 0 0', fontSize: '0.95rem', color: 'var(--gold-lt)' }}>
          <strong>Forge Athletic Performance LLC</strong><br />
          Legal &amp; Intellectual Property Department<br />
          Email: <a href="mailto:scott@forge-athletic.app" style={{ color: 'var(--gold-lt)', textDecoration: 'underline' }}>scott@forge-athletic.app</a>
        </p>
      </section>
    </main>
    <SiteFooter />
    </>
  )
}
