/**
 * seed-mock.js — Full demo dataset for the UCSI Internship Portal
 *
 * Usage:
 *   node seed-mock.js           ← safe incremental seed (skips existing)
 *   node seed-mock.js --fresh   ← WIPES all non-admin data, then reseeds
 *
 * Credentials after seeding:
 *   Admin:   admin@ucsi.edu.my            / Admin@12345
 *   Student: john.lim@ucsiuniversity.edu.my / Student@123   (ACCEPTED, interview scheduled)
 *   Student: sarah.wong@ucsiuniversity.edu.my / Student@123  (HIRED)
 *   Student: raj.kumar@ucsiuniversity.edu.my  / Student@123  (OFFERED)
 *   Student: nurul.ain@ucsiuniversity.edu.my  / Student@123  (ACCEPTED, pending slot)
 *   Student: chen.wei@ucsiuniversity.edu.my   / Student@123  (PENDING)
 *   Supervisor: amirah.hassan@ucsiuniversity.edu.my / Supervisor@123  (John + Sarah approved)
 *   Supervisor: wong.ck@ucsiuniversity.edu.my       / Supervisor@123  (Raj + Nurul pending)
 *   Supervisor: farah.idris@ucsiuniversity.edu.my   / Supervisor@123  (no students)
 *   Company: hr@petronasdigital.com.my    / Company@123
 *   Company: internship@grab.com          / Company@123
 *   Company: talent@airasia.com           / Company@123
 *   Company: hr@cimb.com.my              / Company@123
 *   Company: intern@kpj.com.my           / Company@123
 *   Company: hr@proton.com.my            / Company@123
 *   Company: careers@lazada.com.my       / Company@123
 *   Company: intern@maybank.com.my       / Company@123
 */

require('dotenv').config();
const bcrypt = require('bcryptjs');
const path   = require('path');
const fs     = require('fs');
const { sequelize, User, Student, Company, Supervisor, JobPosting, Application, ChatRoom, Message } = require('./models');

const IS_FRESH = process.argv.includes('--fresh');

// ─── Minimal valid PDF bytes (for demo resume files) ────────────────────────
const DEMO_PDF = `%PDF-1.4
1 0 obj<</Type/Catalog/Pages 2 0 R>>endobj
2 0 obj<</Type/Pages/Kids[3 0 R]/Count 1>>endobj
3 0 obj<</Type/Page/Parent 2 0 R/MediaBox[0 0 595 842]>>endobj
xref
0 4
0000000000 65535 f
0000000009 00000 n
0000000058 00000 n
0000000115 00000 n
trailer<</Size 4/Root 1 0 R>>
startxref
190
%%EOF`;

// ─── Data ───────────────────────────────────────────────────────────────────

const COMPANIES = [
  {
    email: 'hr@petronasdigital.com.my', password: 'Company@123',
    name: 'Petronas Digital Sdn Bhd', ssm: 'PD-198901012345',
    industry: 'Information Technology',
    description: 'Petronas Digital is the digital transformation arm of PETRONAS, Malaysia\'s national oil and gas company. We build world-class data platforms, cloud infrastructure, and digital products serving the energy sector and beyond.',
    website: 'https://www.petronasdigital.com', address: 'KLCC, Kuala Lumpur', companySize: '501-1000', foundedYear: 1989,
  },
  {
    email: 'internship@grab.com', password: 'Company@123',
    name: 'Grab Holdings Sdn Bhd', ssm: 'GH-199301054321',
    industry: 'Information Technology',
    description: 'Grab is Southeast Asia\'s leading superapp, offering ride-hailing, food delivery, logistics, and fintech services across 8 countries with over 9 million driver-partners.',
    website: 'https://www.grab.com', address: 'Petaling Jaya, Selangor', companySize: '1000+', foundedYear: 2012,
  },
  {
    email: 'talent@airasia.com', password: 'Company@123',
    name: 'AirAsia Digital Sdn Bhd', ssm: 'AA-200001078901',
    industry: 'Information Technology',
    description: 'AirAsia Digital is the tech division of AirAsia Group, building the AirAsia Super App — one of Asia\'s fastest-growing digital lifestyle platforms covering travel, food, and fintech.',
    website: 'https://airasia.com', address: 'Sepang, Selangor', companySize: '201-500', foundedYear: 2000,
  },
  {
    email: 'hr@cimb.com.my', password: 'Company@123',
    name: 'CIMB Group Holdings Bhd', ssm: 'CG-197601023456',
    industry: 'Finance',
    description: 'CIMB Group is one of ASEAN\'s leading universal banking groups, offering consumer, commercial, and investment banking services across 18 countries.',
    website: 'https://www.cimb.com', address: 'Jalan Stesen Sentral, Kuala Lumpur', companySize: '1000+', foundedYear: 1974,
  },
  {
    email: 'intern@kpj.com.my', password: 'Company@123',
    name: 'KPJ Healthcare Sdn Bhd', ssm: 'KH-198501056789',
    industry: 'Healthcare',
    description: 'KPJ Healthcare is Malaysia\'s largest private hospital group with 28 specialist hospitals nationwide, offering a comprehensive range of healthcare services.',
    website: 'https://www.kpj.com.my', address: 'Shah Alam, Selangor', companySize: '1000+', foundedYear: 1985,
  },
  {
    email: 'hr@proton.com.my', password: 'Company@123',
    name: 'Proton Holdings Bhd', ssm: 'PH-198301034567',
    industry: 'Engineering',
    description: 'PROTON is Malaysia\'s national car manufacturer and an emerging player in the ASEAN EV market, partnering with Geely to develop next-generation vehicles.',
    website: 'https://www.proton.com', address: 'Shah Alam, Selangor', companySize: '1000+', foundedYear: 1983,
  },
  {
    email: 'careers@lazada.com.my', password: 'Company@123',
    name: 'Lazada Malaysia Sdn Bhd', ssm: 'LZ-201201078902',
    industry: 'Marketing',
    description: 'Lazada is Southeast Asia\'s leading e-commerce platform, backed by Alibaba Group. We connect millions of buyers and sellers across 6 countries in the region.',
    website: 'https://www.lazada.com.my', address: 'Mont Kiara, Kuala Lumpur', companySize: '501-1000', foundedYear: 2012,
  },
  {
    email: 'intern@maybank.com.my', password: 'Company@123',
    name: 'Malayan Banking Bhd (Maybank)', ssm: 'MB-196001012222',
    industry: 'Finance',
    description: 'Maybank is Malaysia\'s largest bank and financial group with a presence in 20 countries. We are at the forefront of digital banking transformation in ASEAN.',
    website: 'https://www.maybank.com.my', address: 'Menara Maybank, Kuala Lumpur', companySize: '1000+', foundedYear: 1960,
  },
];

const JOBS = [
  // Petronas Digital
  {
    company: 'Petronas Digital Sdn Bhd',
    title: 'Software Engineering Intern',
    description: 'Work on cloud-native applications using React and Node.js. Collaborate with senior engineers on real production systems serving millions of users across Malaysia and Southeast Asia. You will be part of the Platform Engineering team building core APIs and microservices.',
    category: 'Information Technology', location: 'KLCC, Kuala Lumpur',
    allowance: 'RM 2,000 / month', duration: '6 Months', positionsLeft: 3,
    requirements: 'Proficiency in JavaScript or TypeScript\n- Experience with React or Node.js\n- Familiar with REST APIs and Git\n- Understanding of cloud platforms (AWS/Azure) is a plus\n- Strong problem-solving skills',
    benefits: 'Monthly allowance of RM 2,000\n- Mentorship from senior engineers\n- Access to Petronas Learning Hub\n- PETRONAS branded merchandise\n- Potential conversion to full-time after graduation',
  },
  {
    company: 'Petronas Digital Sdn Bhd',
    title: 'DevOps & Cloud Intern',
    description: 'Assist in managing CI/CD pipelines, AWS/Azure infrastructure, and container orchestration using Kubernetes and Docker. Gain hands-on cloud experience that is directly applicable to a career in platform engineering.',
    category: 'Information Technology', location: 'KLCC, Kuala Lumpur',
    allowance: 'RM 1,800 / month', duration: '4 Months', positionsLeft: 2,
    requirements: 'Basic understanding of Linux command line\n- Exposure to Docker or Kubernetes\n- Familiar with CI/CD concepts (Jenkins, GitHub Actions)\n- Python or Bash scripting is a plus',
    benefits: 'Monthly allowance of RM 1,800\n- Direct cloud lab environment access\n- AWS/Azure certification study support\n- Flexible hybrid work arrangement',
  },
  // Grab
  {
    company: 'Grab Holdings Sdn Bhd',
    title: 'Data Science Intern',
    description: 'Analyse large datasets using Python and Spark to improve driver-rider matching algorithms and food delivery predictions. You will work closely with our ML team and have access to one of Southeast Asia\'s richest mobility datasets.',
    category: 'Information Technology', location: 'Petaling Jaya, Selangor',
    allowance: 'RM 2,500 / month', duration: '6 Months', positionsLeft: 2,
    requirements: 'Strong Python skills (Pandas, NumPy, scikit-learn)\n- Understanding of ML concepts (classification, regression)\n- Experience with SQL and data querying\n- Familiarity with Jupyter Notebooks\n- Statistics or Data Science background preferred',
    benefits: 'RM 2,500 monthly allowance\n- Free GrabFood credits\n- Access to Grab\'s internal ML platform\n- Mentorship from senior data scientists\n- International exposure through Grab SEA team',
  },
  {
    company: 'Grab Holdings Sdn Bhd',
    title: 'Backend Developer Intern',
    description: 'Build high-performance microservices in Go and Java for Grab\'s financial services platform. Work at scale with millions of daily transactions. You will own end-to-end features from design to deployment.',
    category: 'Information Technology', location: 'Petaling Jaya, Selangor',
    allowance: 'RM 2,200 / month', duration: '6 Months', positionsLeft: 1,
    requirements: 'Proficiency in Java, Go, or similar backend language\n- Understanding of REST and gRPC APIs\n- Familiar with distributed systems concepts\n- Experience with Docker and Kubernetes preferred\n- Strong CS fundamentals',
    benefits: 'RM 2,200 monthly allowance\n- Free GrabFood credits daily\n- Work on real production systems\n- Agile/Scrum team experience\n- Return offer consideration for top interns',
  },
  // AirAsia Digital
  {
    company: 'AirAsia Digital Sdn Bhd',
    title: 'UI/UX Design Intern',
    description: 'Design user interfaces for the AirAsia Super App. Conduct user research, create wireframes and prototypes in Figma, and collaborate with product teams. Your designs will be seen by millions of users across Southeast Asia.',
    category: 'Information Technology', location: 'Sepang, Selangor',
    allowance: 'RM 1,500 / month', duration: '3 Months', positionsLeft: 2,
    requirements: 'Proficiency in Figma or Adobe XD\n- Portfolio demonstrating UI/UX projects\n- Understanding of user-centred design principles\n- Basic knowledge of HTML/CSS is a plus\n- Strong communication and presentation skills',
    benefits: 'RM 1,500 monthly allowance\n- Complimentary AirAsia flight credits\n- Design system contribution credit\n- Mentorship from lead product designers',
  },
  {
    company: 'AirAsia Digital Sdn Bhd',
    title: 'Mobile Developer Intern (Flutter)',
    description: 'Develop features for the AirAsia mobile app using Flutter and Dart. Participate in code reviews and agile sprints with a dynamic engineering team. You will ship real features to millions of app users.',
    category: 'Information Technology', location: 'Sepang, Selangor',
    allowance: 'RM 1,800 / month', duration: '4 Months', positionsLeft: 1,
    requirements: 'Experience with Flutter and Dart\n- Familiarity with mobile app lifecycle (iOS/Android)\n- Basic understanding of RESTful APIs\n- Experience with Git version control\n- Published app or side project preferred',
    benefits: 'RM 1,800 monthly allowance\n- AirAsia flight credits\n- Real production deployment experience\n- Cross-platform mobile expertise',
  },
  // CIMB
  {
    company: 'CIMB Group Holdings Bhd',
    title: 'Cybersecurity Analyst Intern',
    description: 'Assist in monitoring security events, conducting vulnerability assessments, and supporting incident response activities for one of Malaysia\'s largest financial institutions. Gain real-world exposure to enterprise-grade security operations.',
    category: 'Finance', location: 'Jalan Stesen Sentral, Kuala Lumpur',
    allowance: 'RM 1,800 / month', duration: '6 Months', positionsLeft: 2,
    requirements: 'Studying Cybersecurity, Computer Science, or IT\n- Basic knowledge of networking (TCP/IP, DNS, firewalls)\n- Familiarity with SIEM tools or security frameworks (NIST, ISO 27001)\n- Understanding of common attack vectors and CVEs\n- Strong analytical thinking',
    benefits: 'RM 1,800 monthly allowance\n- CIMB Group security certifications support\n- Exposure to SOC operations\n- Mentorship from CISA/CISSP-certified professionals',
  },
  {
    company: 'CIMB Group Holdings Bhd',
    title: 'Finance & Analytics Intern',
    description: 'Support the analytics team in developing dashboards, financial models, and data pipelines using SQL, Tableau and Excel for executive reporting. Present insights directly to business unit heads.',
    category: 'Finance', location: 'Jalan Stesen Sentral, Kuala Lumpur',
    allowance: 'RM 1,600 / month', duration: '3 Months', positionsLeft: 3,
    requirements: 'Strong Microsoft Excel and SQL skills\n- Experience with Tableau or Power BI preferred\n- Finance, Accounting, or Data Analytics background\n- Ability to communicate data insights clearly',
    benefits: 'RM 1,600 monthly allowance\n- Direct mentorship by CFO office\n- Bloomberg terminal access\n- CFA study support program',
  },
  // KPJ
  {
    company: 'KPJ Healthcare Sdn Bhd',
    title: 'Biomedical Research Intern',
    description: 'Assist researchers in clinical data analysis, literature reviews, and lab experiments at KPJ\'s research facility. Ideal for Biomedical Science or Pharmacy students looking for hands-on clinical research experience.',
    category: 'Healthcare', location: 'Shah Alam, Selangor',
    allowance: 'RM 1,200 / month', duration: '3 Months', positionsLeft: 2,
    requirements: 'Studying Biomedical Science, Pharmacy, or related field\n- Strong academic record (CGPA 3.0+)\n- Basic lab skills and familiarity with research methodology\n- Ability to work in a clinical research environment',
    benefits: 'RM 1,200 monthly allowance\n- Research publication co-authorship opportunity\n- Access to KPJ Research Lab facilities\n- Certificate of completion signed by Head of Research',
  },
  {
    company: 'KPJ Healthcare Sdn Bhd',
    title: 'Health IT Systems Intern',
    description: 'Support the implementation of Electronic Medical Record (EMR) systems and healthcare data integration projects across KPJ hospital network. Bridge the gap between clinical staff and IT teams.',
    category: 'Healthcare', location: 'Shah Alam, Selangor',
    allowance: 'RM 1,400 / month', duration: '4 Months', positionsLeft: 1,
    requirements: 'Studying IT, Computer Science, or Health Informatics\n- Knowledge of HL7/FHIR healthcare data standards is a plus\n- Experience with SQL databases\n- Good interpersonal skills to liaise with clinical staff',
    benefits: 'RM 1,400 monthly allowance\n- Exposure to HL7 and FHIR standards\n- Cross-hospital system deployment experience',
  },
  // Proton
  {
    company: 'Proton Holdings Bhd',
    title: 'Mechanical Engineering Intern',
    description: 'Work on vehicle component design and testing in Proton\'s R&D division. Gain experience with CAD tools (CATIA, SolidWorks) and automotive manufacturing processes. Contribute to Malaysia\'s EV future.',
    category: 'Engineering', location: 'Shah Alam, Selangor',
    allowance: 'RM 1,500 / month', duration: '6 Months', positionsLeft: 3,
    requirements: 'Studying Mechanical or Automotive Engineering\n- Proficiency in CATIA or SolidWorks\n- Understanding of FEA/CFD analysis tools is a plus\n- Interest in EV technology and automotive R&D',
    benefits: 'RM 1,500 monthly allowance\n- Access to PROTON R&D test track\n- Mentorship from licensed engineers\n- Opportunity to work on production vehicle projects',
  },
  {
    company: 'Proton Holdings Bhd',
    title: 'Electrical Systems Intern',
    description: 'Support the EV powertrain team in testing and validating electrical systems for upcoming Proton EV models. Hands-on with embedded systems and automotive diagnostic tools.',
    category: 'Engineering', location: 'Shah Alam, Selangor',
    allowance: 'RM 1,500 / month', duration: '6 Months', positionsLeft: 2,
    requirements: 'Studying Electrical or Electronic Engineering\n- Knowledge of CAN bus and automotive protocols\n- Experience with oscilloscopes and multimeters\n- Familiar with embedded C or MATLAB/Simulink',
    benefits: 'RM 1,500 monthly allowance\n- Exposure to EV powertrain systems\n- Training on automotive diagnostic tools',
  },
  // Lazada
  {
    company: 'Lazada Malaysia Sdn Bhd',
    title: 'Digital Marketing Intern',
    description: 'Execute performance marketing campaigns on Google, Meta, and TikTok. Analyse campaign data, A/B test creatives, and help drive millions in e-commerce revenue. You will manage real advertising budgets from day one.',
    category: 'Marketing', location: 'Mont Kiara, Kuala Lumpur',
    allowance: 'RM 1,600 / month', duration: '3 Months', positionsLeft: 4,
    requirements: 'Studying Marketing, Business, or Communications\n- Familiarity with Google Ads and Meta Ads Manager\n- Strong analytical skills and Excel proficiency\n- Creative thinking with attention to data\n- TikTok experience is a major plus',
    benefits: 'RM 1,600 monthly allowance\n- Lazada internal shopping credits\n- Live campaign budget management experience\n- TikTok for Business certification support',
  },
  {
    company: 'Lazada Malaysia Sdn Bhd',
    title: 'E-Commerce Data Analyst Intern',
    description: 'Work with Lazada\'s seller and buyer data to surface actionable insights. Build dashboards in Tableau, write SQL queries, and present findings to the Seller Success team. Your analysis directly shapes seller strategy.',
    category: 'Marketing', location: 'Mont Kiara, Kuala Lumpur',
    allowance: 'RM 1,800 / month', duration: '4 Months', positionsLeft: 2,
    requirements: 'Strong SQL and Excel/Google Sheets skills\n- Experience with Tableau or Power BI\n- Studying Data Analytics, Business, or IT\n- Comfortable working with large datasets',
    benefits: 'RM 1,800 monthly allowance\n- Access to Lazada\'s internal BI platform\n- Mentorship from Head of Analytics',
  },
  // Maybank
  {
    company: 'Malayan Banking Bhd (Maybank)',
    title: 'FinTech Innovation Intern',
    description: 'Join Maybank\'s digital banking innovation team. Work on Open Banking APIs, digital wallet features, and collaborate with product managers to shape the future of banking in Southeast Asia.',
    category: 'Finance', location: 'Menara Maybank, Kuala Lumpur',
    allowance: 'RM 2,000 / month', duration: '6 Months', positionsLeft: 2,
    requirements: 'Studying Computer Science, IT, or Finance\n- Basic API development experience (REST/GraphQL)\n- Interest in fintech, digital banking, or blockchain\n- Strong problem-solving and communication skills',
    benefits: 'RM 2,000 monthly allowance\n- Maybank banking product access\n- Mentorship by digital banking product leads\n- Exposure to ASEAN fintech ecosystem',
  },
  {
    company: 'Malayan Banking Bhd (Maybank)',
    title: 'Risk & Compliance Analytics Intern',
    description: 'Support Maybank\'s Risk Management team in building credit risk models, regulatory reporting dashboards, and fraud detection rule engines. Work with data that impacts millions of customers.',
    category: 'Finance', location: 'Menara Maybank, Kuala Lumpur',
    allowance: 'RM 1,700 / month', duration: '4 Months', positionsLeft: 3,
    requirements: 'Studying Finance, Statistics, or Data Analytics\n- Strong Excel and SQL skills\n- Understanding of credit risk or regulatory compliance\n- Python experience for data modelling is a plus',
    benefits: 'RM 1,700 monthly allowance\n- FRM/CFA study support\n- Exposure to Basel III/IV compliance frameworks',
  },
];

const STUDENTS = [
  {
    email: 'john.lim@ucsiuniversity.edu.my', password: 'Student@123',
    firstName: 'John', lastName: 'Lim', ucsiId: '1002101001',
    degree: 'Bachelor of Computer Science (Hons)', faculty: 'Faculty of Computing and Information Technology', facultyCode: 'FCCI (IT)',
    skills: ['JavaScript', 'React', 'Node.js', 'Python', 'SQL', 'Git'],
    bio: 'Final-year CS student passionate about full-stack development and cloud computing. Built several personal projects including a task management system and a RESTful API for a campus event app.',
    phone: '+60 12-345 6789', linkedinUrl: 'https://linkedin.com/in/johnlim-ucsi',
  },
  {
    email: 'sarah.wong@ucsiuniversity.edu.my', password: 'Student@123',
    firstName: 'Sarah', lastName: 'Wong', ucsiId: '1002101002',
    degree: 'Bachelor of Information Technology (Hons)', faculty: 'Faculty of Computing and Information Technology', facultyCode: 'FCCI (IT)',
    skills: ['Python', 'Machine Learning', 'Data Analysis', 'SQL', 'Tableau'],
    bio: 'IT student with a strong focus on data science and analytics. Completed a Kaggle competition placing in the top 15% and have hands-on experience with scikit-learn and pandas.',
    phone: '+60 13-456 7890', linkedinUrl: 'https://linkedin.com/in/sarahwong-ucsi',
  },
  {
    email: 'raj.kumar@ucsiuniversity.edu.my', password: 'Student@123',
    firstName: 'Rajesh', lastName: 'Kumar', ucsiId: '1002101003',
    degree: 'Bachelor of Software Engineering (Hons)', faculty: 'Faculty of Computing and Information Technology', facultyCode: 'FCCI (IT)',
    skills: ['Java', 'Cybersecurity', 'Network Security', 'SIEM', 'Python', 'Linux'],
    bio: 'Software Engineering student with a keen interest in cybersecurity. Hold the CompTIA Security+ certification and have participated in two CTF competitions. Aspiring to work in security operations or penetration testing.',
    phone: '+60 14-567 8901',
  },
  {
    email: 'nurul.ain@ucsiuniversity.edu.my', password: 'Student@123',
    firstName: 'Nurul', lastName: 'Ain', ucsiId: '1002101004',
    degree: 'Bachelor of Data Science (Hons)', faculty: 'Faculty of Computing and Information Technology', facultyCode: 'FCCI (IT)',
    skills: ['Python', 'R', 'Data Visualization', 'Machine Learning', 'SQL', 'Spark'],
    bio: 'Data Science student with experience in end-to-end ML pipelines. Interned briefly at a startup doing customer churn analysis. Comfortable with cloud platforms and big data tools including Spark and Databricks.',
    phone: '+60 15-678 9012', githubUrl: 'https://github.com/nurulain-ucsi',
  },
  {
    email: 'chen.wei@ucsiuniversity.edu.my', password: 'Student@123',
    firstName: 'Chen', lastName: 'Wei', ucsiId: '1002101005',
    degree: 'Bachelor of Computer Science (Hons)', faculty: 'Faculty of Computing and Information Technology', facultyCode: 'FCCI (IT)',
    skills: ['JavaScript', 'TypeScript', 'React', 'Flutter', 'Firebase'],
    bio: 'CS student focused on mobile and web development. Published a Flutter budgeting app on the Google Play Store with 200+ downloads. Looking for an internship where I can contribute to real products.',
    phone: '+60 16-789 0123', githubUrl: 'https://github.com/chenwei-dev',
  },
];

const SUPERVISORS = [
  {
    email: 'amirah.hassan@ucsiuniversity.edu.my', password: 'Supervisor@123',
    firstName: 'Amirah', lastName: 'Hassan',
    department: 'Department of Computer Science', title: 'Senior Lecturer', facultyCode: 'FCCI (IT)',
  },
  {
    email: 'wong.ck@ucsiuniversity.edu.my', password: 'Supervisor@123',
    firstName: 'Wong', lastName: 'Chee Keong',
    department: 'Faculty of Computing and Information Technology', title: 'Associate Professor', facultyCode: 'FCCI (IT)',
  },
  {
    email: 'farah.idris@ucsiuniversity.edu.my', password: 'Supervisor@123',
    firstName: 'Farah', lastName: 'Idris',
    department: 'Department of Software Engineering', title: 'Lecturer', facultyCode: 'FCCI (IT)',
  },
];

// ─── Helpers ─────────────────────────────────────────────────────────────────

function futureDate(daysFromNow) {
  const d = new Date();
  d.setDate(d.getDate() + daysFromNow);
  return d;
}

function futureDatetime(daysFromNow, hour = 10) {
  const d = futureDate(daysFromNow);
  d.setHours(hour, 0, 0, 0);
  return d.toISOString();
}

function pastDate(daysAgo) {
  const d = new Date();
  d.setDate(d.getDate() - daysAgo);
  return d;
}

function ensureDir(dir) {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
}

function writeDemoPdf(filePath) {
  if (!fs.existsSync(filePath)) {
    fs.writeFileSync(filePath, DEMO_PDF, 'latin1');
  }
}

// ─── Fresh wipe ──────────────────────────────────────────────────────────────

async function wipeNonAdminData() {
  console.log('🗑  Wiping existing non-admin data...');
  // Delete in dependency order
  await Message.destroy({ where: {}, truncate: false });
  await ChatRoom.destroy({ where: {}, truncate: false });
  await Application.destroy({ where: {}, truncate: false });
  await JobPosting.destroy({ where: {}, truncate: false });
  await Student.destroy({ where: {}, truncate: false });
  await Company.destroy({ where: {}, truncate: false });
  await Supervisor.destroy({ where: {}, truncate: false });
  // Delete non-admin users
  const { Op } = require('sequelize');
  await User.destroy({ where: { role: { [Op.in]: ['STUDENT', 'COMPANY', 'SUPERVISOR'] } } });
  console.log('   ✅ Non-admin data cleared.\n');
}

// ─── Main seed ───────────────────────────────────────────────────────────────

async function seed() {
  try {
    console.log('🔗 Connecting to database...');
    await sequelize.authenticate();
    await sequelize.sync({ alter: true });
    console.log('✅ Database ready.\n');

    // Ensure upload directories and demo PDF exist
    ensureDir('uploads/resumes');
    ensureDir('uploads/profiles');
    ensureDir('uploads/listings');
    ensureDir('uploads/offers');
    const DEMO_RESUME_PATH = 'uploads/resumes/demo-resume.pdf';
    writeDemoPdf(DEMO_RESUME_PATH);

    if (IS_FRESH) await wipeNonAdminData();

    // ── 1. Companies ──────────────────────────────────────────────────────────
    console.log('🏢 Seeding companies...');
    const companyMap = {}; // name → Company record
    for (const c of COMPANIES) {
      let user = await User.findOne({ where: { email: c.email } });
      if (!user) {
        const hash = await bcrypt.hash(c.password, 10);
        user = await User.create({ email: c.email, password: hash, role: 'COMPANY' });
      }
      let company = await Company.findOne({ where: { userId: user.id } });
      if (!company) {
        company = await Company.create({
          userId: user.id, companyName: c.name, ssmNumber: c.ssm, industry: c.industry,
          isVerified: true, description: c.description, website: c.website,
          address: c.address, companySize: c.companySize, foundedYear: c.foundedYear,
        });
        console.log(`   ✅ ${c.name}`);
      } else {
        // Update description/details on existing
        await company.update({ description: c.description, website: c.website, address: c.address, companySize: c.companySize, foundedYear: c.foundedYear });
        console.log(`   ↺  ${c.name} (updated)`);
      }
      companyMap[c.name] = company;
    }

    // ── 1b. Supervisors ───────────────────────────────────────────────────────
    console.log('\n🎓 Seeding supervisors...');
    const supervisorMap = {}; // email → Supervisor record
    for (const sup of SUPERVISORS) {
      let user = await User.findOne({ where: { email: sup.email } });
      if (!user) {
        const hash = await bcrypt.hash(sup.password, 10);
        user = await User.create({ email: sup.email, password: hash, role: 'SUPERVISOR', faculty: sup.facultyCode });
      } else if (user.faculty !== sup.facultyCode) {
        await user.update({ faculty: sup.facultyCode });
      }
      let supervisor = await Supervisor.findOne({ where: { userId: user.id } });
      if (!supervisor) {
        supervisor = await Supervisor.create({
          userId: user.id, firstName: sup.firstName, lastName: sup.lastName,
          department: sup.department, title: sup.title,
        });
        console.log(`   ✅ ${sup.title} ${sup.firstName} ${sup.lastName}`);
      } else {
        await supervisor.update({ department: sup.department, title: sup.title });
        console.log(`   ↺  ${sup.firstName} ${sup.lastName} (updated)`);
      }
      supervisorMap[sup.email] = supervisor;
    }

    // ── 2. Job postings ───────────────────────────────────────────────────────
    console.log('\n💼 Seeding job postings...');
    const jobMap = {}; // title → JobPosting record
    for (const j of JOBS) {
      const company = companyMap[j.company];
      if (!company) { console.log(`   ⚠  Company not found: ${j.company}`); continue; }

      let job = await JobPosting.findOne({ where: { companyId: company.id, title: j.title } });
      if (!job) {
        job = await JobPosting.create({
          companyId: company.id,
          title: j.title, description: j.description, category: j.category,
          location: j.location, allowance: j.allowance, duration: j.duration,
          positionsLeft: j.positionsLeft, requirements: j.requirements,
          benefits: j.benefits, isActive: true, isArchived: false,
        });
        console.log(`   ✅ ${j.title} @ ${j.company}`);
      } else {
        // Refresh all fields
        await job.update({
          description: j.description, category: j.category, location: j.location,
          allowance: j.allowance, duration: j.duration, positionsLeft: j.positionsLeft,
          requirements: j.requirements, benefits: j.benefits, isActive: true, isArchived: false,
        });
        console.log(`   ↺  ${j.title} (updated)`);
      }
      jobMap[j.title] = job;
    }

    // ── 3. Students ───────────────────────────────────────────────────────────
    console.log('\n🎓 Seeding students...');
    const studentMap = {}; // email → Student record
    for (const s of STUDENTS) {
      let user = await User.findOne({ where: { email: s.email } });
      if (!user) {
        const hash = await bcrypt.hash(s.password, 10);
        user = await User.create({ email: s.email, password: hash, role: 'STUDENT', faculty: s.facultyCode });
      } else if (user.faculty !== s.facultyCode) {
        await user.update({ faculty: s.facultyCode });
      }
      let student = await Student.findOne({ where: { userId: user.id } });
      if (!student) {
        student = await Student.create({
          userId: user.id, firstName: s.firstName, lastName: s.lastName,
          ucsiId: s.ucsiId, degreeProgram: s.degree, faculty: s.faculty,
          skills: JSON.stringify(s.skills), bio: s.bio,
          phone: s.phone, linkedinUrl: s.linkedinUrl || null, githubUrl: s.githubUrl || null,
          resumeUrl: DEMO_RESUME_PATH,
        });
        console.log(`   ✅ ${s.firstName} ${s.lastName} (${s.ucsiId})`);
      } else {
        await student.update({
          degreeProgram: s.degree, faculty: s.faculty,
          skills: JSON.stringify(s.skills), bio: s.bio,
          phone: s.phone, linkedinUrl: s.linkedinUrl || null, githubUrl: s.githubUrl || null,
          resumeUrl: DEMO_RESUME_PATH,
        });
        console.log(`   ↺  ${s.firstName} ${s.lastName} (updated)`);
      }
      studentMap[s.email] = student;
    }

    // ── 3b. Supervisor handshake assignments ─────────────────────────────────
    // Approved (already accepted) students, pending requests, and one student
    // with no request at all — covers all three StudentProfile.jsx banner states.
    console.log('\n🤝 Seeding supervisor handshake assignments...');
    const amirah = supervisorMap['amirah.hassan@ucsiuniversity.edu.my'];
    const wongCK = supervisorMap['wong.ck@ucsiuniversity.edu.my'];

    const SUPERVISOR_ASSIGNMENTS = [
      { email: 'john.lim@ucsiuniversity.edu.my',   supervisor: amirah, status: 'APPROVED' },
      { email: 'sarah.wong@ucsiuniversity.edu.my',  supervisor: amirah, status: 'APPROVED' },
      { email: 'raj.kumar@ucsiuniversity.edu.my',   supervisor: wongCK, status: 'PENDING' },
      { email: 'nurul.ain@ucsiuniversity.edu.my',   supervisor: wongCK, status: 'PENDING' },
      // chen.wei intentionally left unassigned — tests the "no request yet" state
    ];
    for (const a of SUPERVISOR_ASSIGNMENTS) {
      const student = studentMap[a.email];
      if (!student) continue;
      await student.update({ supervisorId: a.supervisor.id, supervisorStatus: a.status });
      console.log(`   ✅ ${student.firstName} ${student.lastName} → ${a.supervisor.firstName} ${a.supervisor.lastName} (${a.status})`);
    }

    // ── 4. Applications, ChatRooms, Messages ─────────────────────────────────
    console.log('\n📋 Seeding application lifecycle & chat...');

    const john  = studentMap['john.lim@ucsiuniversity.edu.my'];
    const sarah = studentMap['sarah.wong@ucsiuniversity.edu.my'];
    const raj   = studentMap['raj.kumar@ucsiuniversity.edu.my'];
    const nurul = studentMap['nurul.ain@ucsiuniversity.edu.my'];
    const chen  = studentMap['chen.wei@ucsiuniversity.edu.my'];

    const petronas = companyMap['Petronas Digital Sdn Bhd'];
    const grab     = companyMap['Grab Holdings Sdn Bhd'];
    const cimb     = companyMap['CIMB Group Holdings Bhd'];
    const kpj      = companyMap['KPJ Healthcare Sdn Bhd'];
    const proton   = companyMap['Proton Holdings Bhd'];
    const lazada   = companyMap['Lazada Malaysia Sdn Bhd'];
    const maybank  = companyMap['Malayan Banking Bhd (Maybank)'];
    const airasia  = companyMap['AirAsia Digital Sdn Bhd'];

    // Helper: get user.id from Company
    async function companyUserId(company) {
      const u = await User.findOne({ where: { role: 'COMPANY' } });
      // Actually need to look it up by email
      const c2 = await Company.findByPk(company.id);
      return c2.userId;
    }

    async function studentUserId(student) {
      const s2 = await Student.findByPk(student.id);
      return s2.userId;
    }

    // Fetch user IDs once
    const johnUserId  = await studentUserId(john);
    const sarahUserId = await studentUserId(sarah);
    const rajUserId   = await studentUserId(raj);
    const nurul_UserId = await studentUserId(nurul);
    const chenUserId  = await studentUserId(chen);

    const petronasCo = await Company.findByPk(petronas.id);
    const grabCo     = await Company.findByPk(grab.id);
    const cimbCo     = await Company.findByPk(cimb.id);
    const kpjCo      = await Company.findByPk(kpj.id);
    const protonCo   = await Company.findByPk(proton.id);
    const lazadaCo   = await Company.findByPk(lazada.id);
    const maybankCo  = await Company.findByPk(maybank.id);
    const airAsiaCo  = await Company.findByPk(airasia.id);

    const petroUser = await User.findByPk(petronasCo.userId);
    const grabUser  = await User.findByPk(grabCo.userId);
    const cimbUser  = await User.findByPk(cimbCo.userId);
    const kpjUser   = await User.findByPk(kpjCo.userId);
    const protonUser= await User.findByPk(protonCo.userId);

    const swJob  = jobMap['Software Engineering Intern'];
    const dsJob  = jobMap['Data Science Intern'];
    const beJob  = jobMap['Backend Developer Intern'];
    const cyJob  = jobMap['Cybersecurity Analyst Intern'];
    const meJob  = jobMap['Mechanical Engineering Intern'];
    const dmJob  = jobMap['Digital Marketing Intern'];
    const ftJob  = jobMap['FinTech Innovation Intern'];
    const dvJob  = jobMap['DevOps & Cloud Intern'];
    const uiJob  = jobMap['UI/UX Design Intern'];
    const hmJob  = jobMap['Health IT Systems Intern'];
    const bmJob  = jobMap['Biomedical Research Intern'];

    async function upsertApp(data, forceUpdate = {}) {
      let app = await Application.findOne({ where: { studentId: data.studentId, jobId: data.jobId } });
      if (!app) {
        app = await Application.create(data);
      } else if (IS_FRESH || Object.keys(forceUpdate).length > 0) {
        await app.update({ ...data, ...forceUpdate });
      }
      return app;
    }

    async function upsertChatRoom(studentId, companyId, applicationId, isLocked = false) {
      let room = await ChatRoom.findOne({ where: { studentId, companyId } });
      if (!room) {
        room = await ChatRoom.create({ studentId, companyId, applicationId, isLocked });
      } else {
        await room.update({ applicationId, isLocked });
      }
      return room;
    }

    async function seedMessages(room, msgs) {
      const existing = await Message.count({ where: { chatRoomId: room.id } });
      if (existing >= msgs.length) return; // already seeded
      for (const m of msgs) {
        await Message.create({ chatRoomId: room.id, senderUserId: m.userId, content: m.content, isRead: m.isRead ?? true });
      }
    }

    // ── JOHN LIM ── ACCEPTED at Petronas (interview slots set, one confirmed) ─
    {
      const slots = [futureDatetime(7, 10), futureDatetime(8, 14), futureDatetime(9, 11)];
      const app = await upsertApp({
        studentId: john.id, jobId: swJob.id,
        status: 'ACCEPTED',
        resumeSnapshot: DEMO_RESUME_PATH,
        interviewSlots: slots,
        confirmedSlot: slots[0], // John confirmed the first slot
      });
      console.log('   ✅ John → Petronas SW Eng (ACCEPTED, interview confirmed)');
      // Chat room (opened when ACCEPTED)
      const room = await upsertChatRoom(john.id, petronas.id, app.id, false);
      await seedMessages(room, [
        { userId: petroUser.id, content: 'Hi John! Congratulations on being shortlisted for the Software Engineering Internship. We\'d love to invite you for an interview. Please check the available slots above.' },
        { userId: johnUserId,   content: 'Thank you so much! I\'m really excited about this opportunity. I\'ve confirmed Slot 1 — looking forward to the interview!' },
        { userId: petroUser.id, content: 'Great! We\'ll send you the interview details and Zoom link by email 24 hours before. Do prepare a brief introduction about yourself and a project you\'re proud of.' },
        { userId: johnUserId,   content: 'Understood, I will prepare accordingly. Should I bring my portfolio or is the resume sufficient?' },
        { userId: petroUser.id, content: 'The resume is fine. A portfolio link would be a great bonus though — feel free to share if you have one!' },
      ]);
      console.log('      ↳ Chat room + 5 messages seeded');
    }

    // ── JOHN LIM ── PENDING at Grab (Data Science) ────────────────────────────
    {
      await upsertApp({ studentId: john.id, jobId: dsJob.id, status: 'PENDING', resumeSnapshot: DEMO_RESUME_PATH });
      console.log('   ✅ John → Grab Data Science (PENDING)');
    }

    // ── SARAH WONG ── HIRED at Grab (Backend Developer) ──────────────────────
    {
      // Sarah's app was ACCEPTED → OFFERED → HIRED
      // positionsLeft for beJob was 1, now decremented to 0, job isActive=false
      const beJobRecord = await JobPosting.findByPk(beJob.id);
      if (beJobRecord.positionsLeft > 0) {
        await beJobRecord.update({ positionsLeft: 0, isActive: false });
      }
      const slots = [futureDatetime(-5, 9), futureDatetime(-4, 14)]; // past slots
      const app = await upsertApp({
        studentId: sarah.id, jobId: beJob.id,
        status: 'HIRED',
        resumeSnapshot: DEMO_RESUME_PATH,
        interviewSlots: slots,
        confirmedSlot: slots[0],
        offerExpiresAt: pastDate(2),
      });
      console.log('   ✅ Sarah → Grab Backend Developer (HIRED)');
      // Chat room
      const room = await upsertChatRoom(sarah.id, grab.id, app.id, false);
      await seedMessages(room, [
        { userId: grabUser.id,  content: 'Hi Sarah! Great news — we have reviewed your application and would like to invite you for a technical interview this week.' },
        { userId: sarahUserId,  content: 'Wonderful! Thank you for the opportunity. I\'ve confirmed the interview slot.' },
        { userId: grabUser.id,  content: 'We were really impressed with your interview performance and data analysis test. We\'d like to formally offer you the Backend Developer Internship position!' },
        { userId: sarahUserId,  content: 'This is amazing news! I officially accept the offer. Looking forward to joining the Grab team!' },
        { userId: grabUser.id,  content: 'Welcome aboard, Sarah! HR will reach out with onboarding documents. See you on your first day! 🎉' },
      ]);
      console.log('      ↳ Chat room + 5 messages seeded');
    }

    // ── SARAH WONG ── WITHDRAWN from AirAsia UI/UX ───────────────────────────
    {
      await upsertApp({ studentId: sarah.id, jobId: uiJob.id, status: 'WITHDRAWN', resumeSnapshot: DEMO_RESUME_PATH });
      console.log('   ✅ Sarah → AirAsia UI/UX (WITHDRAWN)');
    }

    // ── RAJ KUMAR ── OFFERED at CIMB Cybersecurity (offer active, 5 days) ────
    {
      const slots = [futureDatetime(-7, 10), futureDatetime(-6, 14)]; // past — interview already done
      const app = await upsertApp({
        studentId: raj.id, jobId: cyJob.id,
        status: 'OFFERED',
        resumeSnapshot: DEMO_RESUME_PATH,
        interviewSlots: slots,
        confirmedSlot: slots[1],
        offerExpiresAt: futureDate(5), // expires in 5 days
      });
      console.log('   ✅ Raj → CIMB Cybersecurity (OFFERED, expires in 5 days)');
      // Chat room (opened when ACCEPTED, stays open after OFFERED)
      const room = await upsertChatRoom(raj.id, cimb.id, app.id, false);
      await seedMessages(room, [
        { userId: cimbUser.id, content: 'Hi Rajesh! Congratulations on passing our technical interview. We were particularly impressed by your CompTIA Security+ certification.' },
        { userId: rajUserId,   content: 'Thank you! I really enjoyed the interview process. The SIEM practical test was challenging but fun.' },
        { userId: cimbUser.id, content: 'Great to hear! We are extending a formal internship offer to you for the Cybersecurity Analyst role. Please review the offer details and respond within 5 days.' },
        { userId: rajUserId,   content: 'I will review it carefully. Thank you for the opportunity!' },
      ]);
      console.log('      ↳ Chat room + 4 messages seeded');
    }

    // ── RAJ KUMAR ── REJECTED at Proton Mechanical ───────────────────────────
    {
      // Raj applied → ACCEPTED → REJECTED (chat locked)
      const slots = [futureDatetime(-10, 10)];
      const app = await upsertApp({
        studentId: raj.id, jobId: meJob.id,
        status: 'REJECTED',
        resumeSnapshot: DEMO_RESUME_PATH,
        interviewSlots: slots,
        confirmedSlot: slots[0],
      });
      console.log('   ✅ Raj → Proton Mechanical (REJECTED, chat locked)');
      // Chat room is locked because REJECTED
      const room = await upsertChatRoom(raj.id, proton.id, app.id, true);
      await seedMessages(room, [
        { userId: protonUser.id, content: 'Hi Rajesh, thank you for your interest in the Mechanical Engineering internship. After the interview, we have decided to proceed with other candidates whose background more closely matches the role requirements.' },
        { userId: rajUserId,     content: 'I understand, thank you for letting me know and for the interview experience. I appreciate your time.' },
      ]);
      console.log('      ↳ Locked chat room + 2 messages seeded');
    }

    // ── NURUL AIN ── ACCEPTED at Petronas DevOps (slots proposed, not confirmed) ─
    {
      const slots = [futureDatetime(3, 9), futureDatetime(4, 11), futureDatetime(5, 15)];
      const app = await upsertApp({
        studentId: nurul.id, jobId: dvJob.id,
        status: 'ACCEPTED',
        resumeSnapshot: DEMO_RESUME_PATH,
        interviewSlots: slots,
        confirmedSlot: null, // student hasn't picked yet
      });
      console.log('   ✅ Nurul → Petronas DevOps (ACCEPTED, awaiting slot confirmation)');
      const room = await upsertChatRoom(nurul.id, petronas.id, app.id, false);
      await seedMessages(room, [
        { userId: petroUser.id, content: 'Hi Nurul! We are pleased to invite you for an interview for the DevOps & Cloud Internship. We have proposed 3 available time slots — please confirm your preference.' },
        { userId: nurul_UserId, content: 'Thank you for the invitation! I will confirm a slot shortly. Looking forward to the interview.' },
      ]);
      console.log('      ↳ Chat room + 2 messages seeded');
    }

    // ── NURUL AIN ── PENDING at Grab Data Science ─────────────────────────────
    {
      await upsertApp({ studentId: nurul.id, jobId: dsJob.id, status: 'PENDING', resumeSnapshot: DEMO_RESUME_PATH });
      console.log('   ✅ Nurul → Grab Data Science (PENDING)');
    }

    // ── CHEN WEI ── PENDING at Lazada Digital Marketing ──────────────────────
    {
      await upsertApp({ studentId: chen.id, jobId: dmJob.id, status: 'PENDING', resumeSnapshot: DEMO_RESUME_PATH });
      console.log('   ✅ Chen → Lazada Digital Marketing (PENDING)');
    }

    // ── CHEN WEI ── OFFERED at Maybank FinTech (3 days left) ─────────────────
    {
      const maybankUser = await User.findByPk(maybankCo.userId);
      const slots = [futureDatetime(-3, 10)]; // past interview
      const app = await upsertApp({
        studentId: chen.id, jobId: ftJob.id,
        status: 'OFFERED',
        resumeSnapshot: DEMO_RESUME_PATH,
        interviewSlots: slots,
        confirmedSlot: slots[0],
        offerExpiresAt: futureDate(3),
      });
      console.log('   ✅ Chen → Maybank FinTech (OFFERED, expires in 3 days)');
      const room = await upsertChatRoom(chen.id, maybank.id, app.id, false);
      await seedMessages(room, [
        { userId: maybankUser.id, content: 'Hi Chen! Following your interview, we are pleased to extend an offer for the FinTech Innovation internship. The offer details are attached. You have 3 days to respond.' },
        { userId: chenUserId,     content: 'This is great news! I am very interested. I will review the offer and get back to you.' },
      ]);
      console.log('      ↳ Chat room + 2 messages seeded');
    }

    // ── Summary ───────────────────────────────────────────────────────────────
    console.log('\n' + '═'.repeat(55));
    console.log('🎉 Demo data seeded successfully!\n');
    console.log('📋 Login Credentials:');
    console.log('   Admin:   admin@ucsi.edu.my / Admin@12345');
    console.log('   ─────────────────────────────────────────────');
    console.log('   Student: john.lim@ucsiuniversity.edu.my  / Student@123  → ACCEPTED (Petronas, slot confirmed) + PENDING (Grab)');
    console.log('   Student: sarah.wong@ucsiuniversity.edu.my / Student@123 → HIRED (Grab) + WITHDRAWN (AirAsia)');
    console.log('   Student: raj.kumar@ucsiuniversity.edu.my  / Student@123 → OFFERED (CIMB, 5 days) + REJECTED (Proton, chat locked)');
    console.log('   Student: nurul.ain@ucsiuniversity.edu.my  / Student@123 → ACCEPTED (Petronas, slots pending) + PENDING (Grab)');
    console.log('   Student: chen.wei@ucsiuniversity.edu.my   / Student@123 → OFFERED (Maybank, 3 days) + PENDING (Lazada), no supervisor yet');
    console.log('   ─────────────────────────────────────────────');
    console.log('   Supervisor: amirah.hassan@ucsiuniversity.edu.my / Supervisor@123 → John (APPROVED), Sarah (APPROVED, HIRED — test placement approval)');
    console.log('   Supervisor: wong.ck@ucsiuniversity.edu.my       / Supervisor@123 → Raj (PENDING), Nurul (PENDING)');
    console.log('   Supervisor: farah.idris@ucsiuniversity.edu.my   / Supervisor@123 → no students yet');
    console.log('   ─────────────────────────────────────────────');
    console.log('   Company: hr@petronasdigital.com.my / Company@123');
    console.log('   Company: internship@grab.com       / Company@123');
    console.log('   Company: hr@cimb.com.my            / Company@123');
    console.log('   Company: hr@proton.com.my          / Company@123');
    console.log('   Company: intern@maybank.com.my     / Company@123');
    console.log('   Company: careers@lazada.com.my     / Company@123');
    console.log('   Company: talent@airasia.com        / Company@123');
    console.log('   Company: intern@kpj.com.my         / Company@123');
    console.log('═'.repeat(55) + '\n');
    process.exit(0);
  } catch (err) {
    console.error('❌ Seed error:', err.message);
    if (process.env.NODE_ENV !== 'production') console.error(err.stack);
    process.exit(1);
  }
}

seed();
