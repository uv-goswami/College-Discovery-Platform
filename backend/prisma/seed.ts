import 'dotenv/config'; // Ensure environment variables are loaded
import { PrismaClient } from '@prisma/client';
import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';

// 1. Create a raw Postgres connection pool using your connection string
const connectionString = process.env.DATABASE_URL;
const pool = new Pool({ connectionString });

// 2. Wrap it with Prisma's Postgres adapter
const adapter = new PrismaPg(pool);

// 3. Pass the adapter to the PrismaClient constructor
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log('Start seeding...');

  // 1. Clean up existing data to prevent duplicates on multiple runs
  // (Order matters due to foreign key constraints, though Cascade helps)
  await prisma.savedComparison.deleteMany();
  await prisma.savedCollege.deleteMany();
  await prisma.review.deleteMany();
  await prisma.course.deleteMany();
  await prisma.college.deleteMany();
  await prisma.user.deleteMany();

  // 2. Create a test user
  const user1 = await prisma.user.create({
    data: {
      email: 'test@student.com',
      name: 'Test Student',
      password: 'hashed_password_placeholder', 
    },
  });

  // 3. Array of 10 colleges to seed
  const collegesData = [
    {
      name: 'Indian Institute of Technology (IIT) Delhi',
      city: 'New Delhi',
      state: 'Delhi',
      type: 'PUBLIC' as const,
      annualFees: 220000,
      established: 1961,
      avgPackage: 2000000,
      highestPackage: 15000000,
      placementRate: 98.5,
      website: 'https://home.iitd.ac.in/',
      about: 'IIT Delhi is one of the premier engineering institutes in India.',
    },
    {
      name: 'Indian Institute of Technology (IIT) Bombay',
      city: 'Mumbai',
      state: 'Maharashtra',
      type: 'PUBLIC' as const,
      annualFees: 230000,
      established: 1958,
      avgPackage: 2100000,
      highestPackage: 18000000,
      placementRate: 99.0,
    },
    {
      name: 'Birla Institute of Technology and Science (BITS)',
      city: 'Pilani',
      state: 'Rajasthan',
      type: 'PRIVATE' as const,
      annualFees: 550000,
      established: 1964,
      avgPackage: 1800000,
      highestPackage: 6000000,
      placementRate: 96.0,
    },
    {
      name: 'Ramanujan College, University of Delhi',
      city: 'New Delhi',
      state: 'Delhi',
      type: 'PUBLIC' as const,
      annualFees: 25000,
      established: 1958,
      avgPackage: 500000,
      highestPackage: 2000000,
      placementRate: 80.0,
      courses: {
        create: [
          {
            name: 'Computer Science',
            degree: 'B.Sc.',
            durationYears: 3,
            annualFees: 25000
          }
        ]
      }
    },
    {
      name: 'Vellore Institute of Technology (VIT)',
      city: 'Vellore',
      state: 'Tamil Nadu',
      type: 'PRIVATE' as const,
      annualFees: 198000,
      established: 1984,
      avgPackage: 900000,
      highestPackage: 7500000,
      placementRate: 92.0,
    },
    {
      name: 'National Institute of Technology (NIT) Trichy',
      city: 'Tiruchirappalli',
      state: 'Tamil Nadu',
      type: 'PUBLIC' as const,
      annualFees: 150000,
      established: 1964,
      avgPackage: 1200000,
      highestPackage: 4000000,
      placementRate: 95.0,
    },
    {
      name: 'SRM Institute of Science and Technology',
      city: 'Chennai',
      state: 'Tamil Nadu',
      type: 'DEEMED' as const,
      annualFees: 250000,
      established: 1985,
      avgPackage: 700000,
      highestPackage: 5000000,
      placementRate: 88.0,
    },
    {
      name: 'Jadavpur University',
      city: 'Kolkata',
      state: 'West Bengal',
      type: 'PUBLIC' as const,
      annualFees: 10000,
      established: 1955,
      avgPackage: 1000000,
      highestPackage: 6500000,
      placementRate: 94.0,
    },
    {
      name: 'Indian Institute of Technology (IIT) Kanpur',
      city: 'Kanpur',
      state: 'Uttar Pradesh',
      type: 'PUBLIC' as const,
      annualFees: 215000,
      established: 1959,
      avgPackage: 1900000,
      highestPackage: 12000000,
      placementRate: 97.5,
    },
    {
      name: 'Manipal Institute of Technology',
      city: 'Manipal',
      state: 'Karnataka',
      type: 'PRIVATE' as const,
      annualFees: 335000,
      established: 1957,
      avgPackage: 850000,
      highestPackage: 4400000,
      placementRate: 90.0,
    }
  ];

  const createdColleges: any[] = [];

  // 4. Insert colleges sequentially to capture their IDs
  for (const data of collegesData) {
    const college = await prisma.college.create({
      data,
    });
    createdColleges.push(college);
    console.log(`Created College: ${college.name}`);
  }

  // 5. Add some mock reviews to the first college (IIT Delhi)
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
      }
    ]
  });

  // 6. Test the SavedComparison feature (JSON array)
  await prisma.savedComparison.create({
    data: {
      userId: user1.id,
      // Storing array of exactly 2–3 college IDs per your schema constraints
      collegeIds: [createdColleges[0].id, createdColleges[1].id], 
    }
  });

  console.log(`Seeded user ${user1.email} and 10 colleges successfully.`);
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