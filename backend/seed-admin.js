/**
 * Admin Seed Script
 * Run this ONCE to create the admin account:
 *   node seed-admin.js
 */
require('dotenv').config();
const bcrypt = require('bcryptjs');
const { sequelize, User } = require('./models');

async function seed() {
  try {
    await sequelize.authenticate();
    await sequelize.sync();

    const email = 'admin@ucsi.edu.my';
    const password = 'Admin@12345';

    const existing = await User.findOne({ where: { email } });
    if (existing) {
      console.log('Admin user already exists:', email);
      process.exit(0);
    }

    const hashed = await bcrypt.hash(password, 10);
    await User.create({ email, password: hashed, role: 'ADMIN' });

    console.log('✅ Admin account created!');
    console.log('   Email:   ', email);
    console.log('   Password:', password);
    console.log('\n⚠  Change the password after first login!');
    process.exit(0);
  } catch (err) {
    console.error('Error seeding admin:', err.message);
    process.exit(1);
  }
}

seed();
