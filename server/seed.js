/**
 * seed.js — Database Seeding Script for Skills & Careers
 *
 * Requirements:
 *  - Connects using config/db.js
 *  - Clears ONLY Skill and Career collections (never touches User collection)
 *  - Inserts 35+ skills
 *  - Resolves skill names to ObjectIds for careers
 *  - Inserts 5 careers with valid ObjectId references
 *  - Closes connection cleanly
 *  - Run with: npm run seed
 */

require('dotenv').config();
const mongoose = require('mongoose');
const connectDB = require('./config/db');
const Skill = require('./models/Skill');
const Career = require('./models/Career');
const { skillsData, careersData } = require('./data/seedData');

const seedDatabase = async () => {
  console.log('🌱 Starting CareerPath AI Database Seed...');

  try {
    // 1. Connect to MongoDB
    await connectDB();

    // 2. Clear existing Skill and Career collections only
    console.log('🧹 Clearing existing Skill and Career collections...');
    await Skill.deleteMany({});
    await Career.deleteMany({});
    console.log('   (User accounts preserved — never modified by seed)');

    // 3. Insert Skills
    console.log(`📦 Inserting ${skillsData.length} skills...`);
    const createdSkills = await Skill.insertMany(skillsData);
    console.log(`✅ Successfully seeded ${createdSkills.length} skills!`);

    // 4. Create Skill Name -> ObjectId Lookup Map
    const skillMap = new Map();
    createdSkills.forEach((skill) => {
      skillMap.set(skill.name.toLowerCase().trim(), skill._id);
    });

    // 5. Prepare Careers with resolved Skill ObjectIds
    console.log(`📦 Resolving skill references and inserting ${careersData.length} careers...`);
    const preparedCareers = careersData.map((career) => {
      const resolvedSkills = career.requiredSkills.map((reqSkill) => {
        const skillId = skillMap.get(reqSkill.skillName.toLowerCase().trim());
        if (!skillId) {
          throw new Error(
            `Skill "${reqSkill.skillName}" required by career "${career.title}" not found in skillsData!`
          );
        }
        return {
          skill: skillId,
          importance: reqSkill.importance,
          requiredProficiency: reqSkill.requiredProficiency,
        };
      });

      return {
        title: career.title,
        slug: career.slug,
        shortDescription: career.shortDescription,
        longDescription: career.longDescription,
        category: career.category,
        icon: career.icon,
        color: career.color,
        educationPreferences: career.educationPreferences,
        interestTags: career.interestTags,
        requiredSkills: resolvedSkills,
        active: true,
      };
    });

    const createdCareers = await Career.insertMany(preparedCareers);
    console.log(`✅ Successfully seeded ${createdCareers.length} careers!`);

    console.log('\n────────────────────────────────────────────────────────');
    console.log('🎉 Database seeding completed successfully!');
    console.log(`   Total Skills  : ${createdSkills.length}`);
    console.log(`   Total Careers : ${createdCareers.length}`);
    console.log('────────────────────────────────────────────────────────\n');

    // 6. Close database connection cleanly
    await mongoose.connection.close();
    console.log('🔒 Database connection closed.');
    process.exit(0);
  } catch (error) {
    console.error('❌ Database seeding failed:', error.message);
    if (mongoose.connection.readyState !== 0) {
      await mongoose.connection.close();
    }
    process.exit(1);
  }
};

seedDatabase();
