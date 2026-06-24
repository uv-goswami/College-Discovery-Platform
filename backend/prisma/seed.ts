import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';
import * as fs from 'fs';
import * as path from 'path';
import * as bcrypt from 'bcrypt';

// 1. Create a raw Postgres connection pool using your connection string
const connectionString = process.env.DATABASE_URL!;
const pool = new Pool({ connectionString });

// 2. Wrap it with Prisma's Postgres adapter
const adapter = new PrismaPg(pool);

// 3. Pass the adapter to the PrismaClient constructor
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log('Start seeding...');

  // Load mock data from JSON file
  const filePath = path.join(__dirname, 'mock-data.json');
  const rawData = fs.readFileSync(filePath, 'utf-8');
  const collegesData = JSON.parse(rawData);

  // Clean up existing data (order matters due to foreign keys)
  await prisma.savedComparison.deleteMany();
  await prisma.savedCollege.deleteMany();
  await prisma.review.deleteMany();
  await prisma.course.deleteMany();
  await prisma.college.deleteMany();
  await prisma.user.deleteMany();

  // Create a test user with a hashed password
  const hashedPassword = await bcrypt.hash('Password123!', 10);
  const user1 = await prisma.user.create({
    data: {
      email: 'test@student.com',
      name: 'Test Student',
      password: hashedPassword,
    },
  });

  const createdColleges: any[] = [];

  // Insert colleges from the JSON data
  for (const data of collegesData) {
    const college = await prisma.college.create({
      data,
    });
    createdColleges.push(college);
  }

  console.log(`Created ${createdColleges.length} colleges.`);

  // Add some mock reviews to the first college (if exists)
  if (createdColleges.length > 0) {
    await prisma.review.createMany({
      data: [
        {
          collegeId: createdColleges[0].id,
          rating: 4.8,
          comment: 'Amazing campus and highly competitive environment.',
        },
        {
          collegeId: createdColleges[0].id,
          rating: 4.5,
          comment: 'Great placements, but academics can be very stressful.',
        },
      ],
    });
  }

  // Save a comparison with the first two colleges (if exist)
  if (createdColleges.length >= 2) {
    await prisma.savedComparison.create({
      data: {
        userId: user1.id,
        collegeIds: [createdColleges[0].id, createdColleges[1].id],
      },
    });
  }

  console.log(`Seeded user ${user1.email} and ${createdColleges.length} colleges successfully.`);
}

main()
  .then(async () => {
    console.log('Seeding finished successfully.');
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error('Error occurred during seeding:');
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });