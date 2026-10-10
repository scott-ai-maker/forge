import type { GaaIconName } from '@/components/ui/GaaIcon'

export type CredentialCategory =
  | 'academic'
  | 'engineering'
  | 'clinical'
  | 'performance'
  | 'metabolic'
  | 'specialized'
  | 'safety'

export interface CredlyBadgeItem {
  id: string
  name: string
  issuer: string
  issuedDate: string
  imageUrl: string
  credlyUrl: string
  skills: string[]
}

export const CREDLY_PROFILE_URL = 'https://www.credly.com/users/scott-gordon.1dfe2f10/badges/credly'
export const CREDLY_BADGES_TOTAL = 34

export const FEATURED_CREDLY_BADGES: CredlyBadgeItem[] = [
  {
    id: '3a6271d0-0814-42b9-8a22-cf56c1637c24',
    name: 'AWS Certified Solutions Architect – Associate',
    issuer: 'Amazon Web Services Training and Certification',
    issuedDate: '2022-08-22',
    imageUrl: 'https://images.credly.com/images/0e284c3f-5164-4b21-8660-0d84737941bc/image.png',
    credlyUrl: 'https://www.credly.com/org/amazon-web-services/badge/aws-certified-solutions-architect-associate',
    skills: ['Cloud Architecture', 'AWS', 'AWS Cloud', 'High Availability'],
  },
  {
    id: '9e43c958-0355-4212-a7e5-d008bfda3e56',
    name: 'IBM AI Developer Professional Certificate',
    issuer: 'Coursera & IBM',
    issuedDate: '2025-12-26',
    imageUrl: 'https://images.credly.com/images/70675aed-31be-4c30-add7-b99905a34005/image.png',
    credlyUrl: 'https://www.credly.com/org/coursera/badge/ibm-ai-developer-professional-certificate',
    skills: ['Artificial Intelligence', 'LLMs', 'Generative AI', 'Deep Learning'],
  },
  {
    id: '3c6c1f91-1ab9-47d4-af32-73c8db0ab61f',
    name: 'Machine Learning with Python (V2)',
    issuer: 'Coursera & IBM',
    issuedDate: '2026-10-09',
    imageUrl: 'https://images.credly.com/images/56c60565-e945-4bcd-b8a6-9b2f43e1b0d9/Coursera_20Machine_20Learning_20with_20Python_20V2.png',
    credlyUrl: 'https://www.credly.com/org/coursera/badge/machine-learning-with-python-v2',
    skills: ['Machine Learning', 'Classification', 'Clustering', 'DBSCAN'],
  },
  {
    id: '5c546d2d-1819-4181-bd44-efe53051ac13',
    name: 'Building Generative AI-Powered Applications with Python',
    issuer: 'Coursera & IBM',
    issuedDate: '2025-12-26',
    imageUrl: 'https://images.credly.com/images/e462102c-b2ee-4208-aca0-b58f53331266/image.png',
    credlyUrl: 'https://www.credly.com/org/coursera/badge/building-generative-ai-powered-applications-with-py',
    skills: ['Generative AI', 'Chatbots', 'Python', 'AI Applications'],
  },
  {
    id: '61217c47-463f-4d78-b62e-dc92c59efefe',
    name: 'Containers for Developers and Quality Assurance (LFD254)',
    issuer: 'The Linux Foundation',
    issuedDate: '2024-02-06',
    imageUrl: 'https://images.credly.com/images/cdfff820-b8fb-41c6-b9d9-0835f07cfbb6/blob',
    credlyUrl: 'https://www.credly.com/org/the-linux-foundation/badge/lfd254-containers-for-developers-and-quality-assurance.1',
    skills: ['CI/CD', 'Container Images', 'ArgoCD', 'Quality Assurance'],
  },
  {
    id: '1959a789-d4b2-4cdb-ba63-90ffcf5159b0',
    name: 'AWS Certified Cloud Practitioner',
    issuer: 'Amazon Web Services Training and Certification',
    issuedDate: '2022-06-13',
    imageUrl: 'https://images.credly.com/images/00634f82-b07f-4bbd-a6bb-53de397fc3a6/image.png',
    credlyUrl: 'https://www.credly.com/org/amazon-web-services/badge/aws-certified-cloud-practitioner',
    skills: ['AWS Cloud', 'Cloud Security', 'Billing & Economics', 'Global Infrastructure'],
  },
  {
    id: '6072f249-a2ee-44f2-92e0-e1dee67c4de6',
    name: 'Generative AI: Prompt Engineering',
    issuer: 'Coursera & IBM',
    issuedDate: '2025-12-10',
    imageUrl: 'https://images.credly.com/images/7fd5a03e-823f-4449-af43-59afe528f4ee/image.png',
    credlyUrl: 'https://www.credly.com/org/coursera/badge/generative-ai-prompt-engineering',
    skills: ['Prompt Engineering', 'Generative AI', 'LLM', 'Context Formatting'],
  },
  {
    id: 'afc6387a-3f3c-411e-8dbe-69f97c622371',
    name: 'ML vs Foundation Models',
    issuer: "O'Reilly Media",
    issuedDate: '2026-08-20',
    imageUrl: 'https://images.credly.com/images/2e606315-6646-4aaf-a044-55951dbd056b/410208aa-f1e6-4499-8858-4b064131f768.png',
    credlyUrl: 'https://www.credly.com/org/o-reilly-media/badge/ml-vs-foundation-models',
    skills: ['MLOps', 'MLflow', 'Foundation Models', 'Model Architecture'],
  },
  {
    id: 'fce89a67-cde5-44bb-85a7-6fda4684f120',
    name: 'DevOps and SRE Fundamentals (LFS261)',
    issuer: 'The Linux Foundation',
    issuedDate: '2023-12-09',
    imageUrl: 'https://images.credly.com/images/77796674-2a4e-4a35-823e-9e55e7ee159e/blob',
    credlyUrl: 'https://www.credly.com/org/the-linux-foundation/badge/lfs261-devops-and-sre-fundamentals-implementing-continuous-delivery',
    skills: ['DevOps', 'Continuous Delivery', 'SRE', 'Automated Testing'],
  },
  {
    id: '7f2c3ea6-8b48-4b95-b1a8-c58a77fc808f',
    name: 'MTA: Software Development Fundamentals',
    issuer: 'Microsoft',
    issuedDate: '2020-06-23',
    imageUrl: 'https://images.credly.com/images/4338e594-1e04-4fc4-b71e-3a6d0293e326/MTA-Software_Development_Fundamentals.png',
    credlyUrl: 'https://www.credly.com/org/microsoft-certification/badge/mta-software-development-fundamentals-certified-2020',
    skills: ['Core Programming', 'Databases', 'OOP', 'Software Development'],
  },
]

export type CredentialStatus =
  | 'active'
  | 'completed'
  | 'in_progress'
  | 'pinnacle'

export interface CourseworkRecord {
  courseId: string
  title: string
  grade: string
  credits: number
}

export interface CoachCredential {
  id: string
  code: string
  title: string
  issuer: string
  issuerShort: string
  category: CredentialCategory
  categoryLabel: string
  status: CredentialStatus
  statusLabel: string
  isNccaAccredited?: boolean
  certificateNumber?: string
  issueDate?: string
  expirationDate?: string
  completionDate?: string
  conferredDate?: string
  gpa?: string
  creditsEarned?: number
  coursework?: CourseworkRecord[]
  verificationUrl?: string
  badgeImage?: string
  certificatePdf?: string
  certificatePreviewImage?: string
  badgeTone: string
  icon: GaaIconName
  summary: string
  curriculum: string[]
  gaaEngineIntegration?: string
  featured?: boolean
}

export const COACH_CREDENTIALS: CoachCredential[] = [
  // ── 1. HIGHER EDUCATION & ACADEMIC DEGREE ──────────────────────────────────
  {
    id: 'uop-bsit',
    code: 'BSIT · B.S.',
    title: 'Bachelor of Science in Information Technology',
    issuer: 'University of Phoenix (HLC Regionally Accredited)',
    issuerShort: 'UOPX',
    category: 'academic',
    categoryLabel: 'Academic & Technology Foundations',
    status: 'completed',
    statusLabel: 'Conferred September 2020 · 3.72 GPA',
    completionDate: 'September 14, 2020',
    conferredDate: 'September 2020',
    gpa: '3.72',
    creditsEarned: 128,
    verificationUrl: 'https://www.phoenix.edu',
    badgeTone: '#3B82F6',
    icon: 'brain',
    featured: true,
    summary:
      'Accredited Bachelor of Science in Information Technology specializing in Advanced Software Development (ASD), conferred with a 3.72 Cumulative GPA. Rigorous multi-year university curriculum in algorithmic logic, object-oriented software engineering (Java, C++, .NET), advanced database architecture, cryptography, cybersecurity, and enterprise computing.',
    curriculum: [
      'Advanced Software Development & Algorithmic Logic (Java I & II, C++, .NET)',
      'Data Structures for Problem Solving & Computational Complexity',
      'Advanced Relational Database Architecture & Systems Integration',
      'Cyber Domain, Information Assurance & Cryptography (SSCP Framework)',
      'Network Architecture, Infrastructure Administration & Cloud Fundamentals',
      'BSIT Capstone: Scalable Systems Design & Architecture Implementation',
    ],
    coursework: [
      { courseId: 'PRG/211', title: 'Algorithms and Logic for Computer Programming', grade: 'A', credits: 3 },
      { courseId: 'DAT/305', title: 'Data Structures for Problem Solving', grade: 'A-', credits: 3 },
      { courseId: 'PRG/420', title: 'Java Programming I', grade: 'A', credits: 3 },
      { courseId: 'PRG/421', title: 'Java Programming II', grade: 'A', credits: 3 },
      { courseId: 'PRG/410', title: 'C++ Programming I', grade: 'B', credits: 3 },
      { courseId: 'POS/408', title: '.NET Architecture I', grade: 'A', credits: 3 },
      { courseId: 'POS/409', title: '.NET Architecture II', grade: 'A-', credits: 3 },
      { courseId: 'DBM/380', title: 'Database Concepts', grade: 'A', credits: 3 },
      { courseId: 'DAT/380', title: 'Advanced Database Architecture', grade: 'B+', credits: 3 },
      { courseId: 'DAT/390', title: 'Database Integration with Other Systems', grade: 'A', credits: 3 },
      { courseId: 'DAT/210', title: 'Data Programming Languages', grade: 'A', credits: 3 },
      { courseId: 'CMGT/432', title: 'Introduction to Cryptography', grade: 'A-', credits: 3 },
      { courseId: 'CMGT/400', title: 'Intro to Information Assurance & Security', grade: 'A-', credits: 3 },
      { courseId: 'CYB/100', title: 'Cyber Domain', grade: 'A-', credits: 3 },
      { courseId: 'NTC/362', title: 'Fundamentals of Networking', grade: 'A', credits: 3 },
      { courseId: 'BSA/425', title: 'BSIT Capstone Engineering', grade: 'B+', credits: 3 },
    ],
    gaaEngineIntegration:
      'Provides the formal systems architecture, computational modeling, and database engineering behind Forge Athletic’s proprietary periodization algorithms, real-time biometric telemetry pipelines, and low-latency computer vision platforms.',
  },
  // ── 1. NCCA ACCREDITED ACTIVE PRIMARY CREDENTIAL ─────────────────────────────
  {
    id: 'nasm-cpt',
    code: 'NASM-CPT®',
    title: 'Certified Personal Trainer',
    issuer: 'National Academy of Sports Medicine (NASM)',
    issuerShort: 'NASM',
    category: 'clinical',
    categoryLabel: 'Clinical & Biomechanics',
    status: 'active',
    statusLabel: 'Verified Active · NCCA Accredited',
    isNccaAccredited: true,
    certificateNumber: '1261890687',
    issueDate: 'October 7, 2026',
    expirationDate: 'October 7, 2028',
    verificationUrl: 'https://www.credential.net/07f48168-fa30-4a54-bd43-ae0f8a66677b',
    badgeImage: '/images/badges/nasm-cpt-badge.png',
    certificatePdf: '/documents/credentials/nasm-cpt-certificate.pdf',
    certificatePreviewImage: '/images/credentials/nasm-cpt-certificate.png',
    badgeTone: '#C5A059',
    icon: 'award',
    featured: true,
    summary:
      'NASM Certified Personal Trainers (NCCA accredited) master the scientific principles, foundational concepts, and practical techniques to train and motivate clients in exercise activities. They assess fitness levels, personal goals, and movement patterns to build customized, periodized training programs with progressive feedback.',
    curriculum: [
      '5-Phase OPT™ Periodization Architecture (Stabilization to Peak Power)',
      'Kinetic Chain Dynamic Posture & Overhead Squat Assessment (OHSA)',
      'Neuromuscular Stabilization & Proprioception Calibration',
      'Acute Training Variable Modulation (Tempo, Sets, Reps, Rest Intervals)',
      'Cardiorespiratory Conditioning & Metabolic Heart Rate Zones',
      'Individualized Program Design & Biomechanical Adaptation Guardrails',
    ],
    gaaEngineIntegration:
      'Powers the core Forge periodization generator, tempo constraints (4-2-1-1 to explosive), and automated progressive overload logic in `lib/nasm-opt-exercise-selection.ts`.',
  },

  // ── 2. LIFESPAN & EMERGENCY CARDIAC SAFETY ─────────────────────────────────
  {
    id: 'asti-cpr-aed',
    code: 'CPR / AED',
    title: 'Adult, Child & Infant CPR/AED',
    issuer: 'American Safety Training Institute (ASTI)',
    issuerShort: 'ASTI',
    category: 'safety',
    categoryLabel: 'Emergency Care & Safety',
    status: 'active',
    statusLabel: 'Certified Active',
    certificateNumber: '1261890193',
    issueDate: 'October 7, 2026',
    expirationDate: 'October 7, 2028',
    verificationUrl: 'https://www.AmericanSTI.org',
    certificatePdf: '/documents/credentials/asti-cpr-aed-certificate.pdf',
    certificatePreviewImage: '/images/credentials/asti-cpr-aed-certificate.png',
    badgeTone: '#EF4444',
    icon: 'heart-rate',
    featured: true,
    summary:
      'Cognitive and practical skills evaluation following national emergency cardiovascular care guidelines for comprehensive Adult, Child, and Infant CPR and automated external defibrillator (AED) operation for community and workplace safety.',
    curriculum: [
      'Adult, Child, and Infant Cardiopulmonary Resuscitation (CPR)',
      'Automated External Defibrillator (AED) Deployment & Pad Placement',
      'Foreign-Body Airway Obstruction & Choking Relief Protocols',
      'Sudden Cardiac Arrest Recognition & Immediate Emergency Response',
      'Chain of Survival & Emergency Medical Dispatch Coordination',
    ],
    gaaEngineIntegration:
      'Establishes the clinical safety and cardiovascular risk threshold enforcement across high-intensity training protocols, heart-rate zones, and PAR-Q+ assessments.',
  },

  // ── 3. NASM ACADEMIC ORIENTATION ───────────────────────────────────────────
  {
    id: 'nasm-orientation',
    code: 'NASM Orientation',
    title: 'NASM Learner Orientation Course',
    issuer: 'National Academy of Sports Medicine (NASM)',
    issuerShort: 'NASM',
    category: 'clinical',
    categoryLabel: 'Clinical & Biomechanics',
    status: 'completed',
    statusLabel: 'Course Completed',
    completionDate: 'April 12, 2026',
    certificatePdf: '/documents/credentials/nasm-orientation-record.pdf',
    certificatePreviewImage: '/images/credentials/nasm-orientation-record.png',
    badgeTone: '#60A5FA',
    icon: 'clipboard',
    featured: false,
    summary:
      'Official Record of Completion for the NASM Learner Orientation curriculum, confirming mastery of NASM academic standards, digital learning architecture, and professional scope of practice.',
    curriculum: [
      'NASM Digital Portal Navigation & Educational Governance',
      'OPT™ Framework Foundational Architecture',
      'Professional Code of Ethics & Scope of Practice Standards',
      'Continuing Education Unit (CEU) Maintenance Roadmap',
    ],
    gaaEngineIntegration:
      'Anchors platform documentation to official NASM terminology and professional code of ethics compliance.',
  },

  // ── 4. VERIFIED CLOUD, AI & SYSTEMS ARCHITECTURE (CREDLY) ─────────────────
  {
    id: 'aws-solutions-architect',
    code: 'AWS SAA',
    title: 'AWS Certified Solutions Architect – Associate',
    issuer: 'Amazon Web Services Training and Certification',
    issuerShort: 'AWS',
    category: 'engineering',
    categoryLabel: 'AI & Cloud Architecture',
    status: 'active',
    statusLabel: 'Verified Credly · Issued Aug 2022',
    issueDate: 'August 22, 2022',
    verificationUrl: 'https://www.credly.com/org/amazon-web-services/badge/aws-certified-solutions-architect-associate',
    badgeImage: 'https://images.credly.com/images/0e284c3f-5164-4b21-8660-0d84737941bc/image.png',
    badgeTone: '#F59E0B',
    icon: 'shield-check',
    featured: true,
    summary:
      'Rigorous industry accreditation validating comprehensive technical expertise in architecting secure, resilient, high-performing, and cost-optimized distributed systems on Amazon Web Services.',
    curriculum: [
      'Multi-Tier Cloud Architecture & High-Availability Infrastructure',
      'Secure IAM Access Control & Virtual Private Cloud (VPC) Routing',
      'Event-Driven Microservices & Real-Time Media Ingestion Pipelines',
      'Automated Disaster Recovery, Failover & Cloud Cost Optimization',
    ],
    gaaEngineIntegration:
      'Underpins Forge Athletic’s scalable cloud architecture, real-time WebRTC media relays, and high-availability athlete biometrics storage.',
  },
  {
    id: 'ibm-ai-developer',
    code: 'IBM AI Dev',
    title: 'IBM AI Developer Professional Certificate',
    issuer: 'Coursera & IBM',
    issuerShort: 'IBM',
    category: 'engineering',
    categoryLabel: 'AI & Cloud Architecture',
    status: 'completed',
    statusLabel: 'Verified Credly · Issued Dec 2025',
    issueDate: 'December 26, 2025',
    verificationUrl: 'https://www.credly.com/org/coursera/badge/ibm-ai-developer-professional-certificate',
    badgeImage: 'https://images.credly.com/images/70675aed-31be-4c30-add7-b99905a34005/image.png',
    badgeTone: '#3B82F6',
    icon: 'brain',
    featured: true,
    summary:
      'Professional multi-course specialization in full-stack AI application engineering, deep learning neural networks, Large Language Model (LLM) orchestration, conversational AI agents, and production Python AI architectures.',
    curriculum: [
      'Large Language Model (LLM) Prompt Engineering & RAG Architecture',
      'Deep Learning & Neural Network Computational Graphs',
      'Production Python AI Engineering & RESTful Inference Endpoints',
      'Conversational AI Agents, Autonomous Copilots & Voice Synthesis',
    ],
    gaaEngineIntegration:
      'Powers the core intelligence of AI Coach Gordon, authentic ElevenLabs neural voice cloning, and clinical RAG retrieval for real-time form cues.',
  },
  {
    id: 'ibm-machine-learning',
    code: 'IBM ML (V2)',
    title: 'Machine Learning with Python (V2)',
    issuer: 'Coursera & IBM',
    issuerShort: 'IBM',
    category: 'engineering',
    categoryLabel: 'AI & Cloud Architecture',
    status: 'completed',
    statusLabel: 'Verified Credly · Issued Oct 2026',
    issueDate: 'October 9, 2026',
    verificationUrl: 'https://www.credly.com/org/coursera/badge/machine-learning-with-python-v2',
    badgeImage: 'https://images.credly.com/images/56c60565-e945-4bcd-b8a6-9b2f43e1b0d9/Coursera_20Machine_20Learning_20with_20Python_20V2.png',
    badgeTone: '#10B981',
    icon: 'activity',
    featured: true,
    summary:
      'Advanced machine learning certification in supervised and unsupervised learning, regression algorithms, classification models, clustering, and predictive data pipelines using Python (NumPy, Pandas, Scikit-learn).',
    curriculum: [
      'Predictive Statistical Modeling & Biometric Polynomial Regression',
      'Clustering & Movement Pattern Recognition (DBSCAN, K-Means)',
      'Classification Algorithms, Decision Trees & Ensemble Methods',
      'Model Validation, ROC-AUC Scoring & Overfitting Prevention',
    ],
    gaaEngineIntegration:
      'Drives Forge’s biometric predictive fatigue indices, bar velocity power regression, and autonomic nervous system readiness modeling.',
  },
  {
    id: 'linux-foundation-containers',
    code: 'LF Containers',
    title: 'Containers for Developers and Quality Assurance (LFD254)',
    issuer: 'The Linux Foundation',
    issuerShort: 'Linux Foundation',
    category: 'engineering',
    categoryLabel: 'AI & Cloud Architecture',
    status: 'completed',
    statusLabel: 'Verified Credly · Issued Feb 2024',
    issueDate: 'February 6, 2024',
    verificationUrl: 'https://www.credly.com/org/the-linux-foundation/badge/lfd254-containers-for-developers-and-quality-assurance.1',
    badgeImage: 'https://images.credly.com/images/cdfff820-b8fb-41c6-b9d9-0835f07cfbb6/blob',
    badgeTone: '#6366F1',
    icon: 'toolbox',
    featured: false,
    summary:
      'Enterprise container orchestration, OCI container standards, multi-stage Docker/Podman packaging, container registry security, and CI/CD quality assurance pipelines.',
    curriculum: [
      'OCI Container Standard Architecture & Runtime Isolation',
      'Automated CI/CD Integration with ArgoCD & Continuous Delivery',
      'Container Image Security, Attestation & Vulnerability Scanning',
      'Microservice Container Isolation, Health Checks & Orchestration',
    ],
    gaaEngineIntegration:
      'Ensures Forge Athletic’s background services, headless video processors, and automated sync daemons run in isolated, secure containers.',
  },
  {
    id: 'microsoft-azure-fundamentals',
    code: 'Azure Fund.',
    title: 'Microsoft Certified: Azure Fundamentals',
    issuer: 'Microsoft',
    issuerShort: 'Microsoft',
    category: 'engineering',
    categoryLabel: 'AI & Cloud Architecture',
    status: 'completed',
    statusLabel: 'Verified Credly · Issued Jun 2020',
    issueDate: 'June 9, 2020',
    verificationUrl: 'https://www.credly.com/org/microsoft-certification/badge/microsoft-certified-azure-fundamentals',
    badgeImage: 'https://images.credly.com/images/336eebfc-0ac3-4553-94ef-b595166f3807/azure-fundamentals-600x600.png',
    badgeTone: '#0EA5E9',
    icon: 'shield-check',
    featured: false,
    summary:
      'Foundational cloud computing certification demonstrating mastery of Azure architectural services, multi-cloud networking, cloud security, privacy, and compliance management.',
    curriculum: [
      'Core Azure Cloud Architectural Components & High-Availability Sets',
      'Security, Privacy, Compliance & Trust Governance Protocols',
      'Azure Pricing, Service Level Agreements (SLAs) & Cost Planning',
      'Cloud Resource Monitoring, Metrics & Reliability Standards',
    ],
    gaaEngineIntegration:
      'Multi-cloud resilience and enterprise security compliance for client health record privacy and HIPAA-aligned data isolation.',
  },

  // ── 5. MASTER TRAINER PATHWAY: SPECIALIZATIONS IN PROGRESS ─────────────────
  {
    id: 'ces',
    code: 'NASM-CES®',
    title: 'Corrective Exercise Specialist',
    issuer: 'National Academy of Sports Medicine (NASM)',
    issuerShort: 'NASM',
    category: 'clinical',
    categoryLabel: 'Clinical & Biomechanics',
    status: 'in_progress',
    statusLabel: 'Candidate Track',
    badgeTone: '#38BDF8',
    icon: 'movement-screen',
    featured: true,
    summary:
      'Systematic movement diagnostics and kinetic restoration through the clinical 4-Step Corrective Exercise Continuum (Inhibit, Lengthen, Activate, Integrate).',
    curriculum: [
      'Overhead Squat Assessment (OHSA) 5 Checkpoints',
      'Phase 1: Inhibit (Self-Myofascial Release / SMR)',
      'Phase 2: Lengthen (Static & Neuromuscular Stretch)',
      'Phase 3: Activate (Isolated Strengthening & Isometrics)',
      'Phase 4: Integrate (Dynamic Multi-Planar Integration)',
    ],
    gaaEngineIntegration:
      'Drives the AI Posture & OHSA Diagnostics Suite, kinetic chain compensation alerts (LPHC, knee valgus, asymmetrical weight shift), and auto-prescribed 4-phase CEx warmups.',
  },
  {
    id: 'pes',
    code: 'NASM-PES®',
    title: 'Performance Enhancement Specialist',
    issuer: 'National Academy of Sports Medicine (NASM)',
    issuerShort: 'NASM',
    category: 'performance',
    categoryLabel: 'Athletic Performance',
    status: 'in_progress',
    statusLabel: 'Candidate Track',
    badgeTone: '#F59E0B',
    icon: 'lightning',
    featured: true,
    summary:
      'Elite athletic development, Rate of Force Development (RFD), speed-agility-quickness (SAQ) mechanics, and contrast periodization.',
    curriculum: [
      'Rate of Force Development (RFD) & Explosive Power',
      'Speed, Agility, and Quickness (SAQ) Mechanics',
      'Olympic Lifting Derivatives & Ground Reaction Forces',
      'Triphasic & Contrast Training Periodization',
    ],
    gaaEngineIntegration:
      'Powers the Athletic Performance Studio (`components/fitness/AthleticPerformanceStudio.tsx`) and field power diagnostics (Pro Agility 5-10-5, reactive jump profiling).',
  },
  {
    id: 'cnc',
    code: 'NASM-CNC™',
    title: 'Certified Nutrition Coach',
    issuer: 'National Academy of Sports Medicine (NASM)',
    issuerShort: 'NASM',
    category: 'metabolic',
    categoryLabel: 'Metabolic & Nutrition',
    status: 'in_progress',
    statusLabel: 'Candidate Track',
    badgeTone: '#34D399',
    icon: 'apple',
    featured: false,
    summary:
      'Clinical macronutrient periodization, bioenergetic math (TDEE, BMR, NEAT, TEF), and behavioral dietary adherence frameworks.',
    curriculum: [
      'Macronutrient Periodization & Caloric Allocation',
      'Metabolic Expenditure Math (BMR, NEAT, TEF, EAT)',
      'Hydration Physiology & Micronutrient Sufficiency',
      'Behavioral Eating Habits & Practical Adherence Strategies',
    ],
    gaaEngineIntegration:
      'Supports Forge nutrition estimates, metabolic rate calculations, and weekly caloric adherence calibrations.',
  },
  {
    id: 'csnc',
    code: 'NASM-CSNC',
    title: 'Certified Sports Nutrition Coach',
    issuer: 'National Academy of Sports Medicine (NASM)',
    issuerShort: 'NASM',
    category: 'metabolic',
    categoryLabel: 'Metabolic & Nutrition',
    status: 'in_progress',
    statusLabel: 'Candidate Track',
    badgeTone: '#10B981',
    icon: 'utensils',
    featured: false,
    summary:
      'Advanced athletic nutrient timing, glycogen supercompensation, intra-workout kinetics, and competition fueling protocols.',
    curriculum: [
      'Glycogen Supercompensation & Depletion Cycling',
      'Intra-Session Fueling & Exogenous Carbohydrate Kinetics',
      'Electrolyte Osmolality & Thermoregulation',
      'Ergogenic Aids & Evidence-Based Supplement Protocols',
    ],
    gaaEngineIntegration:
      'Regulates peri-workout nutrient timing recommendations for high-output athletic conditioning.',
  },
  {
    id: 'pbc',
    code: 'NASM-PBC',
    title: 'Physique & Bodybuilding Coach',
    issuer: 'National Academy of Sports Medicine (NASM)',
    issuerShort: 'NASM',
    category: 'performance',
    categoryLabel: 'Athletic Performance',
    status: 'in_progress',
    statusLabel: 'Candidate Track',
    badgeTone: '#EC4899',
    icon: 'dumbbell',
    featured: false,
    summary:
      'Hypertrophy biomechanics, stimulus-to-fatigue ratios (SFR), volume landmarks (MEV/MAV/MRV), and structural muscular symmetry.',
    curriculum: [
      'Volume Landmarks (MEV, MAV, MRV Periodization)',
      'Stimulus-to-Fatigue Ratio (SFR) Optimization',
      'Resistance Curve Vectoring & Peak Tension Matching',
      'Intra-Set Stretch Loading & Muscle Architecture',
    ],
    gaaEngineIntegration:
      'Guides Phase 3 Muscular Development programming with optimal joint angles, peak tension curves, and hypertrophy loading.',
  },
  {
    id: 'wls',
    code: 'NASM-WLS',
    title: 'Weight Loss Specialist',
    issuer: 'National Academy of Sports Medicine (NASM)',
    issuerShort: 'NASM',
    category: 'metabolic',
    categoryLabel: 'Metabolic & Nutrition',
    status: 'in_progress',
    statusLabel: 'Candidate Track',
    badgeTone: '#06B6D4',
    icon: 'scale',
    featured: false,
    summary:
      'Adaptive thermogenesis defense, reverse dieting protocols, endocrine mitigation (leptin/ghrelin), and lean tissue defense.',
    curriculum: [
      'Adaptive Thermogenesis & Metabolic Rate Preservation',
      'NEAT (Non-Exercise Activity) Defense Mechanisms',
      'Reverse Dieting & Caloric Step-Up Protocols',
      'Hormonal Optimization During Caloric Deficits',
    ],
    gaaEngineIntegration:
      'Powers fat loss periodization microcycles without metabolic crash or muscle catabolism.',
  },
  {
    id: 'bcs',
    code: 'NASM-BCS',
    title: 'Behavior Change Specialist',
    issuer: 'National Academy of Sports Medicine (NASM)',
    issuerShort: 'NASM',
    category: 'clinical',
    categoryLabel: 'Clinical & Biomechanics',
    status: 'in_progress',
    statusLabel: 'Candidate Track',
    badgeTone: '#A855F7',
    icon: 'brain',
    featured: false,
    summary:
      'Neuroscience of adherence, Transtheoretical Stages of Change, motivational interviewing, and habit architecture.',
    curriculum: [
      'Transtheoretical Model (Stages of Change Dynamics)',
      'Motivational Interviewing & Supportive Coaching',
      'Habit Stacking & Implementation Intentions',
      'Decision-Making, Habit Building, and Consistency',
    ],
    gaaEngineIntegration:
      'Calibrates Coach Gordon’s cognitive tone, weekly check-in responsiveness, and client barrier friction resolution.',
  },
  {
    id: 'vcs',
    code: 'NASM-VCS',
    title: 'Virtual Coaching Specialist',
    issuer: 'National Academy of Sports Medicine (NASM)',
    issuerShort: 'NASM',
    category: 'specialized',
    categoryLabel: 'Lifespan & Specialized',
    status: 'in_progress',
    statusLabel: 'Candidate Track',
    badgeTone: '#3B82F6',
    icon: 'video-studio',
    featured: false,
    summary:
      'Remote coaching workflows, asynchronous biomechanical video review, digital studio ergonomics, and telehealth delivery.',
    curriculum: [
      'Asynchronous Video Movement Analysis & Feedback',
      'Remote Biomechanical Cues & Voice Telemetry',
      'WebRTC Studio Lighting, Framing & Optical Truth',
      'Digital Telehealth Client Onboarding Protocols',
    ],
    gaaEngineIntegration:
      'Standardizes the 1:1 Live WebRTC Consultation Studio and asynchronous video movement review pipelines.',
  },
  {
    id: 'sfs',
    code: 'NASM-SFS',
    title: 'Senior Fitness Specialist',
    issuer: 'National Academy of Sports Medicine (NASM)',
    issuerShort: 'NASM',
    category: 'specialized',
    categoryLabel: 'Lifespan & Specialized',
    status: 'in_progress',
    statusLabel: 'Candidate Track',
    badgeTone: '#F97316',
    icon: 'shield-check',
    featured: false,
    summary:
      'Longevity biomechanics, fall prevention, osteopenia/sarcopenia mitigation, and joint-friendly loading adaptations.',
    curriculum: [
      'Joint Longevity & Cartilage Protection Protocols',
      'Proprioceptive Balance Progressions & Fall Defense',
      'Osteopenia & Sarcopenia Neuromuscular Defense',
      'Contraindicated Movement Swapping Matrix',
    ],
    gaaEngineIntegration:
      'Supports mobility and healthy-aging tools, with exercise options adapted to a person’s needs.',
  },
  {
    id: 'gfs',
    code: 'NASM-GFS',
    title: 'Golf Fitness Specialist',
    issuer: 'National Academy of Sports Medicine (NASM)',
    issuerShort: 'NASM',
    category: 'specialized',
    categoryLabel: 'Lifespan & Specialized',
    status: 'in_progress',
    statusLabel: 'Candidate Track',
    badgeTone: '#84CC16',
    icon: 'target',
    featured: false,
    summary:
      'Rotational kinetics, thoracic spine mobility, X-Factor stretch mechanics, and kinetic ground power transfer for golfers.',
    curriculum: [
      'Transverse Plane Rotational Power Delivery',
      'Thoracic Spine Mobility & Pelvic Dissociation',
      'X-Factor Stretch Biomechanics & Coil Mechanics',
      'Ground Reaction Force Vectoring for Swings',
    ],
    gaaEngineIntegration:
      'Supplies rotational kinetic chain screening and transverse power conditioning for rotational athletes.',
  },
  {
    id: 'mmacs',
    code: 'NASM-MMACS',
    title: 'MMA Conditioning Specialist',
    issuer: 'National Academy of Sports Medicine (NASM)',
    issuerShort: 'NASM',
    category: 'performance',
    categoryLabel: 'Athletic Performance',
    status: 'in_progress',
    statusLabel: 'Candidate Track',
    badgeTone: '#EF4444',
    icon: 'crosshair',
    featured: false,
    summary:
      'Multi-planar combat conditioning, 3-system energy conditioning, rotational anti-flexion, and neck/grip endurance.',
    curriculum: [
      'Tri-System Bioenergetics (ATP-PC, Glycolytic, Aerobic)',
      'Cervical Spine Stabilization & Whiplash Defense',
      'Anti-Rotational & Anti-Lateral Core Bracing',
      'Sustained Isometric Grip & Kinetic Clamping',
    ],
    gaaEngineIntegration:
      'Powers functional combat conditioning modules and multi-planar athletic resilience.',
  },
  {
    id: 'master',
    code: '🏆 NASM Master Trainer',
    title: 'Master Performance Director (Pinnacle Status)',
    issuer: 'National Academy of Sports Medicine (NASM)',
    issuerShort: 'NASM',
    category: 'clinical',
    categoryLabel: 'Clinical & Biomechanics',
    status: 'pinnacle',
    statusLabel: 'Master Credential Pathway',
    badgeTone: '#EAB308',
    icon: 'crown',
    featured: true,
    summary:
      'The pinnacle practitioner credential awarded upon mastering the comprehensive NASM continuum across assessment, correction, performance, and nutrition.',
    curriculum: [
      'Full-Spectrum Kinetic Chain Synthesis',
      'Master Clinical Diagnostic Screening',
      'Macro-to-Micro Periodization Architecture',
      'Integrated Human Performance Ecosystem Leadership',
    ],
    gaaEngineIntegration:
      'Informs coaching recommendations, movement screening, and training plans across Forge Athletic.',
  },
]

// ── UTILITY SELECTORS ────────────────────────────────────────────────────────

export function getFeaturedCredentials(): CoachCredential[] {
  return COACH_CREDENTIALS.filter((cred) => cred.featured)
}

export function getActiveCredentials(): CoachCredential[] {
  return COACH_CREDENTIALS.filter((cred) => cred.status === 'active' || cred.status === 'completed')
}

export function getCredentialById(id: string): CoachCredential | undefined {
  return COACH_CREDENTIALS.find((cred) => cred.id === id)
}

export function getCredentialCategories(): { key: CredentialCategory | 'all' | 'verified'; label: string; count: number }[] {
  return [
    { key: 'all', label: 'All Accreditations', count: COACH_CREDENTIALS.length },
    { key: 'verified', label: 'Verified Active', count: COACH_CREDENTIALS.filter((c) => c.status === 'active').length },
    { key: 'clinical', label: 'Clinical & Biomechanics', count: COACH_CREDENTIALS.filter((c) => c.category === 'clinical').length },
    { key: 'engineering', label: 'AI, Cloud & DevOps', count: COACH_CREDENTIALS.filter((c) => c.category === 'engineering').length },
    { key: 'academic', label: 'Higher Education', count: COACH_CREDENTIALS.filter((c) => c.category === 'academic').length },
    { key: 'performance', label: 'Athletic Performance', count: COACH_CREDENTIALS.filter((c) => c.category === 'performance').length },
    { key: 'metabolic', label: 'Metabolic & Nutrition', count: COACH_CREDENTIALS.filter((c) => c.category === 'metabolic').length },
    { key: 'specialized', label: 'Lifespan & Specialized', count: COACH_CREDENTIALS.filter((c) => c.category === 'specialized').length },
    { key: 'safety', label: 'Emergency Safety', count: COACH_CREDENTIALS.filter((c) => c.category === 'safety').length },
  ]
}

export function getCredentialStats() {
  const verifiedCount = COACH_CREDENTIALS.filter((c) => c.status === 'active').length
  const nccaAccredited = COACH_CREDENTIALS.filter((c) => c.isNccaAccredited).length
  const specializationsTotal = COACH_CREDENTIALS.filter((c) => c.issuerShort === 'NASM').length
  const engineeringCount = COACH_CREDENTIALS.filter((c) => c.category === 'engineering').length
  return {
    verifiedCount,
    nccaAccredited,
    specializationsTotal,
    engineeringCount,
    credlyTotalCount: CREDLY_BADGES_TOTAL,
    primaryCredential: COACH_CREDENTIALS.find((c) => c.id === 'nasm-cpt'),
    safetyCredential: COACH_CREDENTIALS.find((c) => c.id === 'asti-cpr-aed'),
    academicDegree: COACH_CREDENTIALS.find((c) => c.id === 'uop-bsit'),
    flagshipCloudCredential: COACH_CREDENTIALS.find((c) => c.id === 'aws-solutions-architect'),
    flagshipAiCredential: COACH_CREDENTIALS.find((c) => c.id === 'ibm-ai-developer'),
  }
}
