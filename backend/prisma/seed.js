require('dotenv').config();

const { PrismaClient } = require('@prisma/client');
const bcrypt           = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database…');

  const password = await bcrypt.hash('Student@123', 12);

  // Create two test users
  const user1 = await prisma.user.upsert({
    where : { email: 'test1@nitkkr.ac.in' },
    update: {},
    create: {
      name      : 'Rahul Sharma',
      rollNo    : '21CS001',
      email     : 'test1@nitkkr.ac.in',
      password,
      phone     : '9876543210',
      domain    : 'nitkkr.ac.in',
      isVerified: true,
    },
  });

  const user2 = await prisma.user.upsert({
    where : { email: 'test2@nitkkr.ac.in' },
    update: {},
    create: {
      name      : 'Priya Singh',
      rollNo    : '21EC042',
      email     : 'test2@nitkkr.ac.in',
      password,
      phone     : '9123456789',
      domain    : 'nitkkr.ac.in',
      isVerified: true,
    },
  });

  // Create a sample ride (tomorrow)
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  tomorrow.setHours(0, 0, 0, 0);

  await prisma.ride.upsert({
    where : { id: 'seed-ride-001' },
    update: {},
    create: {
      id            : 'seed-ride-001',
      from          : 'NIT Kurukshetra',
      to            : 'Chandigarh ISBT',
      date          : tomorrow,
      time          : '08:30',
      vehicleType   : 'Car',
      availableSeats: 3,
      domain        : 'nitkkr.ac.in',
      createdById   : user1.id,
    },
  });

  console.log('✅ Seed complete!');
  console.log('   👤 test1@nitkkr.ac.in / Student@123');
  console.log('   👤 test2@nitkkr.ac.in / Student@123');
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
