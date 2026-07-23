/**
 * seed-complete.js — Complete FYP seed with full job listings, company profiles, and images
 *
 * Creates:
 * - 6 verified companies with logos
 * - 20+ active job postings with listing images
 * - 8 students with resumes and profiles
 * - Sample applications
 *
 * Usage: node seed-complete.js
 */

require('dotenv').config();
const bcrypt = require('bcryptjs');
const fs = require('fs');
const path = require('path');
const { sequelize, User, Student, Company, JobPosting, Application, ChatRoom } = require('./models');

async function seed() {
  try {
    await sequelize.authenticate();
    console.log('🗄️ Database authenticated');

    await sequelize.sync({ force: true });
    console.log('🔄 Database reset and synchronized');

    // Ensure upload directories exist
    const dirs = ['uploads/profiles', 'uploads/listings', 'uploads/resumes', 'uploads/offers'];
    dirs.forEach(dir => {
      if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    });
    console.log('📁 Upload directories ready');

    // ─── COMPANIES ──────────────────────────────────────────────────────────
    const companiesData = [
      {
        email: 'hr.petronasdigital@example.com',
        password: 'Company@123',
        name: 'Petronas Digital Sdn Bhd',
        ssm: 'PD-198901012345',
        industry: 'Information Technology',
        description: 'Digital transformation arm of PETRONAS, building cloud platforms and data infrastructure for the energy sector.',
        website: 'https://www.petronasdigital.com',
        address: 'KLCC, Kuala Lumpur',
        companySize: '501-1000',
        foundedYear: 1989,
        isVerified: true,
        logoKey: 'petronas',
      },
      {
        email: 'internship.grab@example.com',
        password: 'Company@123',
        name: 'Grab Holdings Sdn Bhd',
        ssm: 'GH-199301054321',
        industry: 'Information Technology',
        description: 'Southeast Asia\'s leading superapp for rides, food delivery, and logistics.',
        website: 'https://www.grab.com',
        address: 'Petaling Jaya, Selangor',
        companySize: '1000+',
        foundedYear: 2012,
        isVerified: true,
        logoKey: 'grab',
      },
      {
        email: 'talent.airasia@example.com',
        password: 'Company@123',
        name: 'AirAsia Digital Sdn Bhd',
        ssm: 'AA-200001078901',
        industry: 'Information Technology',
        description: 'Tech division building the AirAsia Super App for travel and lifestyle services.',
        website: 'https://airasia.com',
        address: 'Sepang, Selangor',
        companySize: '201-500',
        foundedYear: 2000,
        isVerified: true,
        logoKey: 'airasia',
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
        isVerified: true,
        logoKey: 'cimb',
      },
      {
        email: 'intern.kpj@example.com',
        password: 'Company@123',
        name: 'KPJ Healthcare Sdn Bhd',
        ssm: 'KH-198501056789',
        industry: 'Healthcare',
        description: 'Malaysia\'s largest private hospital group with 28 specialist hospitals nationwide.',
        website: 'https://www.kpj.com.my',
        address: 'Shah Alam, Selangor',
        companySize: '1000+',
        foundedYear: 1985,
        isVerified: true,
        logoKey: 'kpj',
      },
      {
        email: 'careers.lazada@example.com',
        password: 'Company@123',
        name: 'Lazada Malaysia Sdn Bhd',
        ssm: 'LZ-201201078902',
        industry: 'Marketing',
        description: 'Southeast Asia\'s leading e-commerce platform backed by Alibaba Group.',
        website: 'https://www.lazada.com.my',
        address: 'Mont Kiara, Kuala Lumpur',
        companySize: '501-1000',
        foundedYear: 2012,
        isVerified: true,
        logoKey: 'lazada',
      },
    ];

    const companies = [];
    for (const comp of companiesData) {
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
        isVerified: comp.isVerified,
        profileImageUrl: `uploads/profiles/company-${comp.logoKey}.svg`,
      });
      companies.push({ user, company });
    }
    console.log(`✅ Created ${companies.length} verified companies`);

    // ─── STUDENTS ───────────────────────────────────────────────────────────
    const studentsData = [
      { firstName: 'John', lastName: 'Lim', degree: 'Bachelor of Computer Science', skills: 'Python, React, AWS' },
      { firstName: 'Sarah', lastName: 'Wong', degree: 'Bachelor of Information Technology', skills: 'Java, Spring Boot, SQL' },
      { firstName: 'Raj', lastName: 'Kumar', degree: 'Bachelor of Software Engineering', skills: 'JavaScript, Node.js, Docker' },
      { firstName: 'Nurul', lastName: 'Ain', degree: 'Bachelor of Computer Science', skills: 'C++, Machine Learning, TensorFlow' },
      { firstName: 'Chen', lastName: 'Wei', degree: 'Bachelor of Information Systems', skills: 'PHP, Laravel, MySQL' },
      { firstName: 'Ahmad', lastName: 'Rashid', degree: 'Bachelor of Computer Science', skills: 'Go, Kubernetes, Microservices' },
      { firstName: 'Priya', lastName: 'Sharma', degree: 'Bachelor of Software Engineering', skills: 'TypeScript, React, GraphQL' },
      { firstName: 'David', lastName: 'Ooi', degree: 'Bachelor of Computer Science', skills: 'Python, Data Science, Pandas' },
    ];

    const students = [];
    for (const std of studentsData) {
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
        bio: `Passionate student interested in ${std.skills.split(',')[0]} and eager to learn.`,
      });
      students.push({ user, student });
    }
    console.log(`✅ Created ${students.length} students`);

    // ─── JOBS ───────────────────────────────────────────────────────────────
    const jobsData = [
      // Petronas Digital
      { company: 0, title: 'Software Engineer Intern', positions: 3, category: 'Information Technology' },
      { company: 0, title: 'Data Engineer Intern', positions: 2, category: 'Information Technology' },
      { company: 0, title: 'Cloud Architect Trainee', positions: 1, category: 'Information Technology' },
      { company: 0, title: 'DevOps Intern', positions: 2, category: 'Information Technology' },
      { company: 0, title: 'Full Stack Developer', positions: 3, category: 'Information Technology' },
      // Grab
      { company: 1, title: 'Backend Engineer Intern', positions: 2, category: 'Information Technology' },
      { company: 1, title: 'Frontend Engineer Intern', positions: 3, category: 'Information Technology' },
      { company: 1, title: 'QA Engineer Intern', positions: 2, category: 'Information Technology' },
      { company: 1, title: 'Mobile Developer Intern', positions: 1, category: 'Information Technology' },
      // AirAsia
      { company: 2, title: 'Full Stack Developer Intern', positions: 2, category: 'Information Technology' },
      { company: 2, title: 'UX/UI Designer Intern', positions: 2, category: 'Information Technology' },
      { company: 2, title: 'Product Analyst Intern', positions: 1, category: 'Information Technology' },
      { company: 2, title: 'Marketing Intern', positions: 2, category: 'Marketing' },
      // CIMB
      { company: 3, title: 'Financial Systems Intern', positions: 2, category: 'Finance' },
      { company: 3, title: 'Risk Analytics Intern', positions: 1, category: 'Finance' },
      { company: 3, title: 'Investment Banking Analyst', positions: 2, category: 'Finance' },
      // KPJ
      { company: 4, title: 'Healthcare IT Intern', positions: 1, category: 'Healthcare' },
      { company: 4, title: 'Clinical Data Analyst', positions: 2, category: 'Healthcare' },
      // Lazada
      { company: 5, title: 'E-commerce Operations Intern', positions: 2, category: 'Marketing' },
      { company: 5, title: 'Seller Success Associate', positions: 2, category: 'Marketing' },
      { company: 5, title: 'Data Analytics Intern', positions: 1, category: 'Information Technology' },
    ];

    const jobs = [];
    for (const jobData of jobsData) {
      const categorySlug = jobData.category.toLowerCase().replace(/\s+/g, '-');
      const job = await JobPosting.create({
        companyId: companies[jobData.company].company.id,
        title: jobData.title,
        description: `${jobData.title} position offering hands-on experience in modern technologies. Work with a dynamic team on real-world projects that impact millions of users across Southeast Asia.`,
        category: jobData.category,
        location: 'Kuala Lumpur, Malaysia',
        allowance: 'RM 1,500 - RM 2,500 / month',
        duration: '3 Months',
        requirements: `• Currently pursuing or recently completed Bachelor\'s degree\n• Strong fundamentals in ${jobData.category}\n• Excellent communication and teamwork skills\n• Passion for technology and innovation`,
        benefits: `• Competitive monthly allowance\n• Mentorship from industry experts\n• Professional development opportunities\n• Flexible working arrangement\n• Certificate of completion`,
        positionsLeft: jobData.positions,
        isActive: true,
        isArchived: false,
        listingImageUrl: `uploads/listings/category-${categorySlug}.svg`,
      });
      jobs.push(job);
    }
    console.log(`✅ Created ${jobs.length} active job postings`);

    // ─── SAMPLE APPLICATIONS ───────────────────────────────────────────────
    // Create a few applications to show activity
    const sampleApps = [
      { studentIdx: 0, jobIdx: 0, status: 'PENDING' },
      { studentIdx: 1, jobIdx: 5, status: 'ACCEPTED' },
      { studentIdx: 2, jobIdx: 10, status: 'PENDING' },
      { studentIdx: 3, jobIdx: 15, status: 'OFFERED' },
    ];

    for (const app of sampleApps) {
      await Application.create({
        jobId: jobs[app.jobIdx].id,
        studentId: students[app.studentIdx].student.id,
        status: app.status,
        resumeSnapshot: `/uploads/resumes/resume-${students[app.studentIdx].student.id}.pdf`,
      });
    }
    console.log(`✅ Created ${sampleApps.length} sample applications`);

    console.log('\n╔════════════════════════════════════════════════════════╗');
    console.log('║         ✅ SEED DATA COMPLETE!                       ║');
    console.log('╚════════════════════════════════════════════════════════╝\n');

    console.log('🔐 Test Credentials:\n');
    console.log('COMPANIES:');
    companiesData.forEach((c, i) => {
      console.log(`  [${i + 1}] ${c.name}`);
      console.log(`      ${c.email} / ${c.password}\n`);
    });

    console.log('STUDENTS:');
    studentsData.forEach((s, i) => {
      const email = `${s.firstName.toLowerCase()}.${s.lastName.toLowerCase()}@ucsiuniversity.edu.my`;
      console.log(`  [${i + 1}] ${s.firstName} ${s.lastName} — ${email} / Student@123\n`);
    });

    console.log('📊 DATASET:');
    console.log(`  • Companies: ${companies.length} (all verified)`);
    console.log(`  • Students: ${students.length}`);
    console.log(`  • Jobs: ${jobs.length} (all active)`);
    console.log(`  • Applications: ${sampleApps.length}\n`);

    await sequelize.close();
  } catch (error) {
    console.error('❌ Seeding failed:', error);
    process.exit(1);
  }
}

seed();
