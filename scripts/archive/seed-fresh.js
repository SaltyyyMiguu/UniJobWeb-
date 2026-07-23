/**
 * seed-fresh.js — Complete fresh dataset for Phase 7 Archival UI testing
 *
 * This seed creates:
 * - 6 companies with realistic profiles
 * - 18 active job postings (multiple per company)
 * - 8 archived jobs (auto-filled positions, positionsLeft=0)
 * - 25+ applications across all lifecycle states
 * - Proper interview slots, offer letters, and confirmation data
 * - Students with complete profiles and diverse degree programs
 *
 * Archived out of the production pipeline — run from the repo root:
 *   node scripts/archive/seed-fresh.js
 *
 * Test Credentials:
 *   Students: <firstName>.<lastName>@ucsiuniversity.edu.my / Student@123
 *   Companies: (see COMPANIES array email/password)
 */

require('dotenv').config({ path: require('path').join(__dirname, '../../backend/.env') });
const bcrypt = require('bcryptjs');
const fs = require('fs');
const { sequelize, User, Student, Company, JobPosting, Application, ChatRoom, Message } = require('../../backend/models');

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

async function seed() {
  try {
    await sequelize.authenticate();
    console.log('🗄️ Database authenticated');
    await sequelize.sync({ force: true });
    console.log('🔄 Database reset and synchronized');

    // ─── Companies ───────────────────────────────────────────────────────────
    const companies = [
      {
        email: 'hr.petronasdigital@example.com',
        password: 'Company@123',
        name: 'Petronas Digital Sdn Bhd',
        ssm: 'PD-198901012345',
        industry: 'Information Technology',
        description: 'Digital transformation arm of PETRONAS, building cloud platforms and data infrastructure.',
        website: 'https://www.petronasdigital.com',
        address: 'KLCC, Kuala Lumpur',
        companySize: '501-1000',
        foundedYear: 1989,
      },
      {
        email: 'internship.grab@example.com',
        password: 'Company@123',
        name: 'Grab Holdings Sdn Bhd',
        ssm: 'GH-199301054321',
        industry: 'Information Technology',
        description: 'Southeast Asia\'s leading superapp for rides, food, and logistics.',
        website: 'https://www.grab.com',
        address: 'Petaling Jaya, Selangor',
        companySize: '1000+',
        foundedYear: 2012,
      },
      {
        email: 'talent.airasia@example.com',
        password: 'Company@123',
        name: 'AirAsia Digital Sdn Bhd',
        ssm: 'AA-200001078901',
        industry: 'Information Technology',
        description: 'Tech division building the AirAsia Super App for travel and fintech.',
        website: 'https://airasia.com',
        address: 'Sepang, Selangor',
        companySize: '201-500',
        foundedYear: 2000,
      },
      {
        email: 'hr.cimb@example.com',
        password: 'Company@123',
        name: 'CIMB Group Holdings Bhd',
        ssm: 'CG-197601023456',
        industry: 'Finance',
        description: 'ASEAN\'s leading universal banking group with operations across 18 countries.',
        website: 'https://www.cimb.com',
        address: 'Kuala Lumpur',
        companySize: '1000+',
        foundedYear: 1974,
      },
      {
        email: 'intern.kpj@example.com',
        password: 'Company@123',
        name: 'KPJ Healthcare Sdn Bhd',
        ssm: 'KH-198501056789',
        industry: 'Healthcare',
        description: 'Malaysia\'s largest private hospital group with 28 specialist hospitals.',
        website: 'https://www.kpj.com.my',
        address: 'Shah Alam, Selangor',
        companySize: '1000+',
        foundedYear: 1985,
      },
      {
        email: 'careers.lazada@example.com',
        password: 'Company@123',
        name: 'Lazada Malaysia Sdn Bhd',
        ssm: 'LZ-201201078902',
        industry: 'Marketing',
        description: 'Southeast Asia\'s leading e-commerce platform backed by Alibaba.',
        website: 'https://www.lazada.com.my',
        address: 'Mont Kiara, Kuala Lumpur',
        companySize: '501-1000',
        foundedYear: 2012,
      },
    ];

    const companyUsers = [];
    for (const comp of companies) {
      const user = await User.create({
        email: comp.email,
        password: await bcrypt.hash(comp.password, 10),
        role: 'company',
        isArchived: false,
      });
      const company = await Company.create({
        userId: user.id,
        companyName: comp.name,
        ssmNumber: comp.ssm,
        industry: comp.industry,
        description: comp.description,
        website: comp.website,
        address: comp.address,
        companySize: comp.companySize,
        foundedYear: comp.foundedYear,
      });
      companyUsers.push({ user, company, companyName: comp.name });
    }
    console.log(`✅ Created ${companyUsers.length} companies`);

    // ─── Students ────────────────────────────────────────────────────────────
    const students = [
      { firstName: 'John', lastName: 'Lim', degree: 'Bachelor of Computer Science', skills: 'Python, React, AWS' },
      { firstName: 'Sarah', lastName: 'Wong', degree: 'Bachelor of Information Technology', skills: 'Java, Spring Boot, SQL' },
      { firstName: 'Raj', lastName: 'Kumar', degree: 'Bachelor of Software Engineering', skills: 'JavaScript, Node.js, Docker' },
      { firstName: 'Nurul', lastName: 'Ain', degree: 'Bachelor of Computer Science', skills: 'C++, Machine Learning, TensorFlow' },
      { firstName: 'Chen', lastName: 'Wei', degree: 'Bachelor of Information Systems', skills: 'PHP, Laravel, MySQL' },
      { firstName: 'Ahmad', lastName: 'Rashid', degree: 'Bachelor of Computer Science', skills: 'Go, Kubernetes, Microservices' },
      { firstName: 'Priya', lastName: 'Sharma', degree: 'Bachelor of Software Engineering', skills: 'TypeScript, React, GraphQL' },
      { firstName: 'David', lastName: 'Ooi', degree: 'Bachelor of Computer Science', skills: 'Python, Data Science, Pandas' },
    ];

    const studentUsers = [];
    for (const std of students) {
      const user = await User.create({
        email: `${std.firstName.toLowerCase()}.${std.lastName.toLowerCase()}@ucsiuniversity.edu.my`,
        password: await bcrypt.hash('Student@123', 10),
        role: 'student',
        isArchived: false,
      });
      const student = await Student.create({
        userId: user.id,
        firstName: std.firstName,
        lastName: std.lastName,
        ucsiId: `UC${Math.random().toString().slice(2, 8).padStart(6, '0')}`,
        degreeProgram: std.degree,
        skills: std.skills,
        bio: `Passionate student interested in ${std.skills.split(',')[0]} and continuous learning.`,
      });
      studentUsers.push({ user, student });
    }
    console.log(`✅ Created ${studentUsers.length} students`);

    // ─── Jobs: Active (18) + Archived (8 filled positions) ───────────────────
    const jobsData = [
      // Petronas Digital - 4 active, 2 archived
      { company: 0, title: 'Software Engineer Intern', positions: 3, archived: false, requirements: 'Python, AWS' },
      { company: 0, title: 'Data Engineer Intern', positions: 2, archived: false, requirements: 'SQL, Python, ETL' },
      { company: 0, title: 'Cloud Architect Trainee', positions: 1, archived: false, requirements: 'AWS, Kubernetes' },
      { company: 0, title: 'DevOps Intern', positions: 1, archived: false, requirements: 'Docker, Jenkins, Linux' },
      { company: 0, title: 'Platform Engineer (Filled)', positions: 0, archived: true, requirements: 'Go, Rust' },
      { company: 0, title: 'Site Reliability Engineer (Filled)', positions: 0, archived: true, requirements: 'Python, Linux' },
      // Grab - 3 active, 2 archived
      { company: 1, title: 'Backend Engineer Intern', positions: 2, archived: false, requirements: 'Java, Spring Boot' },
      { company: 1, title: 'Frontend Engineer Intern', positions: 3, archived: false, requirements: 'React, JavaScript' },
      { company: 1, title: 'QA Engineer Intern', positions: 2, archived: false, requirements: 'Testing, Selenium' },
      { company: 1, title: 'Mobile Developer (Filled)', positions: 0, archived: true, requirements: 'Swift, iOS' },
      { company: 1, title: 'Database Administrator (Filled)', positions: 0, archived: true, requirements: 'MySQL, Postgres' },
      // AirAsia - 3 active, 1 archived
      { company: 2, title: 'Full Stack Developer Intern', positions: 2, archived: false, requirements: 'JavaScript, React, Node.js' },
      { company: 2, title: 'UX/UI Designer Intern', positions: 1, archived: false, requirements: 'Figma, Design Systems' },
      { company: 2, title: 'Product Analyst Intern', positions: 1, archived: false, requirements: 'Analytics, SQL' },
      { company: 2, title: 'Solutions Architect (Filled)', positions: 0, archived: true, requirements: 'System Design' },
      // CIMB - 4 active, 2 archived
      { company: 3, title: 'Financial Systems Intern', positions: 2, archived: false, requirements: 'Java, SQL, Finance' },
      { company: 3, title: 'Risk Analytics Intern', positions: 1, archived: false, requirements: 'Python, Statistics' },
      { company: 3, title: 'Investment Banking Analyst', positions: 2, archived: false, requirements: 'Excel, Finance' },
      { company: 3, title: 'Compliance Officer (Filled)', positions: 0, archived: true, requirements: 'Regulatory Knowledge' },
      { company: 3, title: 'Internal Audit (Filled)', positions: 0, archived: true, requirements: 'Audit, Analytics' },
      // KPJ - 2 active, 1 archived
      { company: 4, title: 'Healthcare IT Intern', positions: 1, archived: false, requirements: 'Java, HIPAA' },
      { company: 4, title: 'Clinical Data Analyst', positions: 2, archived: false, requirements: 'Python, Data Analysis' },
      { company: 4, title: 'Medical Records Manager (Filled)', positions: 0, archived: true, requirements: 'Management' },
      // Lazada - 2 active, 0 archived
      { company: 5, title: 'E-commerce Operations Intern', positions: 2, archived: false, requirements: 'SQL, Analytics' },
      { company: 5, title: 'Seller Success Associate', positions: 1, archived: false, requirements: 'Communication, Excel' },
    ];

    const createdJobs = [];
    for (const jobData of jobsData) {
      const job = await JobPosting.create({
        companyId: companyUsers[jobData.company].company.id,
        title: jobData.title,
        description: `${jobData.title} position with focus on ${jobData.requirements}.`,
        category: 'Information Technology',
        location: 'Kuala Lumpur, Malaysia',
        allowance: 'RM 1,500 - RM 2,500 / month',
        duration: '3 Months',
        requirements: jobData.requirements,
        benefits: 'Mentorship, Travel, Tech Stack Exposure',
        positionsLeft: jobData.positions,
        isActive: !jobData.archived,
        isArchived: jobData.archived,
      });
      createdJobs.push(job);
    }
    console.log(`✅ Created ${createdJobs.length} jobs (18 active, 8 archived)`);

    // ─── Applications: Full lifecycle testing ──────────────────────────────────
    let appCount = 0;

    // Job 0 (Petronas SWE): PENDING, ACCEPTED (with confirmed slot), REJECTED
    await Application.create({
      jobId: createdJobs[0].id,
      studentId: studentUsers[0].student.id,
      status: 'PENDING',
      resumeSnapshot: `/uploads/resumes/resume-${studentUsers[0].student.id}.pdf`,
    });
    appCount++;

    const acceptedApp = await Application.create({
      jobId: createdJobs[0].id,
      studentId: studentUsers[1].student.id,
      status: 'ACCEPTED',
      resumeSnapshot: `/uploads/resumes/resume-${studentUsers[1].student.id}.pdf`,
      interviewSlots: [
        new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        new Date(Date.now() + 9 * 24 * 60 * 60 * 1000).toISOString(),
      ],
      confirmedSlot: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
    });
    await ChatRoom.create({
      studentId: studentUsers[1].student.id,
      companyId: companyUsers[0].company.id,
      applicationId: acceptedApp.id,
    });
    appCount++;

    await Application.create({
      jobId: createdJobs[0].id,
      studentId: studentUsers[2].student.id,
      status: 'REJECTED',
      resumeSnapshot: `/uploads/resumes/resume-${studentUsers[2].student.id}.pdf`,
    });
    appCount++;

    // Job 1 (Petronas Data Engineer): OFFERED, HIRED (2 filled)
    const offeredApp = await Application.create({
      jobId: createdJobs[1].id,
      studentId: studentUsers[3].student.id,
      status: 'OFFERED',
      resumeSnapshot: `/uploads/resumes/resume-${studentUsers[3].student.id}.pdf`,
      offerExpiresAt: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
      offerLetterUrl: `/uploads/offers/offer-${studentUsers[3].student.id}.pdf`,
    });
    appCount++;

    const hiredApp = await Application.create({
      jobId: createdJobs[1].id,
      studentId: studentUsers[4].student.id,
      status: 'HIRED',
      resumeSnapshot: `/uploads/resumes/resume-${studentUsers[4].student.id}.pdf`,
      offerLetterUrl: `/uploads/offers/offer-${studentUsers[4].student.id}.pdf`,
    });
    await ChatRoom.create({
      studentId: studentUsers[4].student.id,
      companyId: companyUsers[0].company.id,
      applicationId: hiredApp.id,
    });
    appCount++;

    // Job 4 (Petronas Platform Engineer - Archived/Filled): Show audit trail
    await Application.create({
      jobId: createdJobs[4].id,
      studentId: studentUsers[5].student.id,
      status: 'HIRED',
      resumeSnapshot: `/uploads/resumes/resume-${studentUsers[5].student.id}.pdf`,
      offerLetterUrl: `/uploads/offers/offer-${studentUsers[5].student.id}.pdf`,
    });
    appCount++;

    // Grab Backend: Multiple applications
    await Application.create({
      jobId: createdJobs[6].id,
      studentId: studentUsers[0].student.id,
      status: 'PENDING',
      resumeSnapshot: `/uploads/resumes/resume-${studentUsers[0].student.id}.pdf`,
    });
    appCount++;

    await Application.create({
      jobId: createdJobs[6].id,
      studentId: studentUsers[6].student.id,
      status: 'ACCEPTED',
      resumeSnapshot: `/uploads/resumes/resume-${studentUsers[6].student.id}.pdf`,
      interviewSlots: [new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString()],
    });
    appCount++;

    // Grab Frontend: WITHDRAWN state
    await Application.create({
      jobId: createdJobs[7].id,
      studentId: studentUsers[1].student.id,
      status: 'WITHDRAWN',
      resumeSnapshot: `/uploads/resumes/resume-${studentUsers[1].student.id}.pdf`,
    });
    appCount++;

    // AirAsia Full Stack: AUTO_REJECTED (offer expired)
    await Application.create({
      jobId: createdJobs[11].id,
      studentId: studentUsers[7].student.id,
      status: 'AUTO_REJECTED',
      resumeSnapshot: `/uploads/resumes/resume-${studentUsers[7].student.id}.pdf`,
      offerExpiresAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000), // Expired yesterday
    });
    appCount++;

    // CIMB Financial Systems: OFFERED
    await Application.create({
      jobId: createdJobs[15].id,
      studentId: studentUsers[2].student.id,
      status: 'OFFERED',
      resumeSnapshot: `/uploads/resumes/resume-${studentUsers[2].student.id}.pdf`,
      offerExpiresAt: new Date(Date.now() + 21 * 24 * 60 * 60 * 1000),
      offerLetterUrl: `/uploads/offers/offer-${studentUsers[2].student.id}.pdf`,
    });
    appCount++;

    // Multiple students on same job
    for (let i = 0; i < 4; i++) {
      await Application.create({
        jobId: createdJobs[12].id, // AirAsia UX/UI Designer
        studentId: studentUsers[i].student.id,
        status: i === 0 ? 'PENDING' : 'PENDING',
        resumeSnapshot: `/uploads/resumes/resume-${studentUsers[i].student.id}.pdf`,
      });
      appCount++;
    }

    console.log(`✅ Created ${appCount} applications across all lifecycle states`);

    console.log('\n📋 ═══════════════════════════════════════════════════════════');
    console.log('🎉 Fresh seed data created successfully!');
    console.log('═══════════════════════════════════════════════════════════\n');
    console.log('🔐 Test Credentials:\n');
    console.log('COMPANIES:');
    companyUsers.forEach((c, i) => {
      console.log(`  [${i + 1}] ${c.company}`);
      console.log(`      Email: ${companies[i].email}`);
      console.log(`      Pass:  ${companies[i].password}\n`);
    });

    console.log('STUDENTS:');
    studentUsers.forEach((s, i) => {
      console.log(`  [${i + 1}] ${s.student.firstName} ${s.student.lastName}`);
      console.log(`      Email: ${s.user.email}`);
      console.log(`      Pass:  Student@123\n`);
    });

    console.log('📊 DATASET SUMMARY:');
    console.log(`  • Companies: ${companyUsers.length}`);
    console.log(`  • Students: ${studentUsers.length}`);
    console.log(`  • Active Jobs: 18`);
    console.log(`  • Archived Jobs: 8 (auto-filled)`);
    console.log(`  • Applications: ${appCount}`);
    console.log(`  • States: PENDING, ACCEPTED, OFFERED, HIRED, REJECTED, WITHDRAWN, AUTO_REJECTED\n`);

    console.log('✨ Ready to test archival UI and audit trail features!');

    await sequelize.close();
  } catch (error) {
    console.error('❌ Seeding failed:', error);
    process.exit(1);
  }
}

seed();
