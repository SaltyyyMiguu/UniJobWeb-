const { Op } = require('sequelize');
const { JobPosting, sequelize } = require('./models');

async function cleanupLegacyJobs() {
  console.log('🔍 Starting legacy job archival cleanup...');
  try {
    const legacyJobs = await JobPosting.findAll({
      where: {
        positionsLeft: { [Op.lte]: 0 },
        isArchived: false
      }
    });

    if (legacyJobs.length === 0) {
      console.log('✅ No legacy jobs found. Database is clean.');
      return;
    }

    console.log(`📦 Found ${legacyJobs.length} legacy job(s) with positionsLeft <= 0 but not archived.`);

    const ids = legacyJobs.map(j => j.id);
    await JobPosting.update(
      { isArchived: true, isActive: false },
      { where: { id: ids } }
    );

    console.log(`✅ Updated ${legacyJobs.length} job(s) to archived state.`);
    console.log('📋 Details:');
    legacyJobs.forEach(j => {
      console.log(`   - ${j.title} (ID: ${j.id}, positionsLeft: ${j.positionsLeft})`);
    });
  } catch (error) {
    console.error('❌ Cleanup failed (non-fatal, server will continue):', error.message);
  }
}

if (require.main === module) {
  (async () => {
    try {
      await sequelize.authenticate();
      console.log('🗄️ Database connection established.');
      await cleanupLegacyJobs();
      await sequelize.close();
      console.log('✨ Cleanup complete. Shutting down.');
    } catch (error) {
      console.error('Fatal error:', error.message);
      process.exit(1);
    }
  })();
}

module.exports = { cleanupLegacyJobs };
