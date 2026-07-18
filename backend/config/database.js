const { Sequelize } = require('sequelize');
require('dotenv').config();

let sequelize;
if (process.env.DATABASE_URL) {
  // Production (cloud database, e.g. Aiven) — requires SSL.
  sequelize = new Sequelize(process.env.DATABASE_URL, {
    dialect: 'mysql',
    logging: false,
    dialectOptions: {
      ssl: {
        require: true,
        rejectUnauthorized: false,
      },
    },
  });
} else {
  // Local MySQL/XAMPP setup.
  sequelize = new Sequelize(
    process.env.DB_NAME,
    process.env.DB_USER,
    process.env.DB_PASSWORD,
    {
      host: process.env.DB_HOST,
      dialect: 'mysql',
      logging: false,
    }
  );
}

module.exports = sequelize;
