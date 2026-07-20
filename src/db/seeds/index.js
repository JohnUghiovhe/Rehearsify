import { seedEventTypes } from './eventTypes.seed.js';
// import { seedUsers } from './users.seed.js';       // add once written
// import { seedSongs } from './songs.seed.js';         // add once written
// import { seedPerformances } from './performances.seed.js'; // add once written

// Order matters — respects foreign key dependencies.
// EventTypes and Users have no dependencies. Songs have none either.
// Services depend on EventTypes + a User (createdById).
// Performances depend on Songs + Services already existing.
async function main() {
  await seedEventTypes();
  // await seedUsers();
  // await seedSongs();
  // await seedPerformances();
  console.log('All seeding complete.');
}

main().catch((e) => {
  console.error('Seed failed:', e);
  process.exit(1);
});