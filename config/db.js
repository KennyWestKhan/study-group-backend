const { Sequelize } = require("sequelize");
require("dotenv").config();

let sequelize;

if (process.env.DB_URL) {
  // Supabase / production
  sequelize = new Sequelize(process.env.DB_URL, {
    dialect: "postgres",
    logging: false,
    dialectOptions: {
      ssl: {
        require: true,
        rejectUnauthorized: false,
      },
    },
  });
} else {
  // Local PostgreSQL
  sequelize = new Sequelize(
    process.env.DB_NAME,
    process.env.DB_USER,
    process.env.DB_PASSWORD,
    {
      host: process.env.DB_HOST,
      port: process.env.DB_PORT || 5432,
      dialect: "postgres",
      logging: false,
    },
  );
}

const connectDB = async () => {
  try {
    await sequelize.authenticate();
    console.log("Postgres connected successfully.");
  } catch (error) {
    // If the database doesn't exist, create it and reconnect
    if (error.parent?.code === '3D000' && !process.env.DB_URL) {
      const dbName = process.env.DB_NAME;
      console.log(`Database "${dbName}" not found. Creating it...`);
      const { Sequelize: Seq } = require('sequelize');
      const adminConn = new Seq('postgres', process.env.DB_USER, process.env.DB_PASSWORD, {
        host: process.env.DB_HOST,
        port: process.env.DB_PORT || 5432,
        dialect: 'postgres',
        logging: false,
      });
      try {
        await adminConn.query(`CREATE DATABASE "${dbName}";`);
        await adminConn.close();
        await sequelize.authenticate();
        console.log(`Database "${dbName}" created and connected successfully.`);
      } catch (createErr) {
        console.error('Failed to create database:', createErr);
        process.exit(1);
      }
    } else {
      console.error("Unable to connect to the database:", error);
      process.exit(1);
    }
  }
};

module.exports = { sequelize, connectDB };
