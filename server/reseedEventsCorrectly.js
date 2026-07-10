const mongoose = require('mongoose');
const Event = require('./models/Event');
const User = require('./models/User');
require('dotenv').config();

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('MongoDB connected...');
  } catch (err) {
    console.error('MongoDB connection failed:', err.message);
    process.exit(1);
  }
};

// Helper to create UNIQUE seats for each tier
const createSeats = (tiers) => {
  const seats = [];
  let currentRow = 0;
  
  tiers.forEach(tier => {
    for (let row = 0; row < tier.rows; row++) {
      const rowLetter = String.fromCharCode(65 + currentRow); // A, B, C, etc.
      for (let num = 1; num <= tier.seatsPerRow; num++) {
        seats.push({
          seatId: `${rowLetter}${num}`,
          row: rowLetter,
          number: num,
          tier: tier.name.toLowerCase(),
          price: tier.price,
          status: 'available'
        });
      }
      currentRow++;
    }
  });
  
  return seats;
};

const dummyEvents = [
  {
    title: 'Rock Legends Festival 2026',
    description: 'Experience the biggest rock music festival of the year featuring legendary bands and emerging artists.',
    category: 'music',
    venue: { name: 'Madison Square Garden', address: '4 Pennsylvania Plaza', city: 'New York', location: { type: 'Point', coordinates: [-73.9935, 40.7505] } },
    startDateTime: new Date('2026-08-15T18:00:00'),
    endDateTime: new Date('2026-08-15T23:00:00'),
    coverImage: { url: 'https://placehold.co/800x400/8B5CF6/FFFFFF/png?text=Rock+Festival', publicId: '' },
    tags: ['rock', 'music', 'festival'],
    tiers: [
      { name: 'general', price: 50, rows: 10, seatsPerRow: 10 },
      { name: 'silver', price: 100, rows: 8, seatsPerRow: 10 },
      { name: 'gold', price: 150, rows: 5, seatsPerRow: 10 },
      { name: 'platinum', price: 250, rows: 3, seatsPerRow: 10 }
    ]
  },
  {
    title: 'Tech Summit 2026',
    description: 'Join industry leaders for three days of inspiring talks and workshops.',
    category: 'conference',
    venue: { name: 'Moscone Center', address: '747 Howard St', city: 'San Francisco', location: { type: 'Point', coordinates: [-122.4009, 37.7840] } },
    startDateTime: new Date('2026-09-20T09:00:00'),
    endDateTime: new Date('2026-09-22T18:00:00'),
    coverImage: { url: 'https://placehold.co/800x400/6D28D9/FFFFFF/png?text=Tech+Summit', publicId: '' },
    tags: ['tech', 'conference'],
    tiers: [
      { name: 'general', price: 200, rows: 15, seatsPerRow: 10 },
      { name: 'silver', price: 350, rows: 10, seatsPerRow: 10 },
      { name: 'gold', price: 500, rows: 6, seatsPerRow: 10 }
    ]
  },
  {
    title: 'NBA Finals Game 7',
    description: 'Witness history! The ultimate championship showdown.',
    category: 'sports',
    venue: { name: 'Staples Center', address: '1111 S Figueroa St', city: 'Los Angeles', location: { type: 'Point', coordinates: [-118.2673, 34.0430] } },
    startDateTime: new Date('2026-06-18T20:00:00'),
    endDateTime: new Date('2026-06-18T23:00:00'),
    coverImage: { url: 'https://placehold.co/800x400/2FE6C6/FFFFFF/png?text=NBA+Finals', publicId: '' },
    tags: ['basketball', 'sports'],
    tiers: [
      { name: 'general', price: 150, rows: 20, seatsPerRow: 10 },
      { name: 'silver', price: 300, rows: 15, seatsPerRow: 10 },
      { name: 'gold', price: 500, rows: 10, seatsPerRow: 10 },
      { name: 'platinum', price: 1000, rows: 5, seatsPerRow: 10 }
    ]
  }
];

const reseed = async () => {
  try {
    await connectDB();

    // Find admin
    let adminUser = await User.findOne({ role: 'admin' });
    if (!adminUser) {
      console.log('Creating admin...');
      adminUser = new User({
        name: 'Admin User',
        email: 'admin@eventric.com',
        password: 'admin123',
        role: 'admin',
        location: { city: 'New York' }
      });
      await adminUser.save();
      console.log('✅ Admin created\n');
    }

    // Delete ALL existing events
    const deleteResult = await Event.deleteMany({});
    console.log(`🗑️  Deleted ${deleteResult.deletedCount} existing events\n`);

    // Create new events with UNIQUE seat IDs
    console.log('Creating events with unique seats...\n');
    
    for (const eventData of dummyEvents) {
      const seats = createSeats(eventData.tiers);
      delete eventData.tiers;
      
      // Verify no duplicates
      const seatIds = seats.map(s => s.seatId);
      const uniqueIds = new Set(seatIds);
      
      if (seatIds.length !== uniqueIds.size) {
        console.log(`❌ ERROR: Duplicates found in ${eventData.title}!`);
        continue;
      }
      
      const event = new Event({
        ...eventData,
        organizer: adminUser._id,
        seats: seats
      });
      
      await event.save();
      console.log(`✅ Created "${event.title}" - ${seats.length} unique seats (${uniqueIds.size} unique IDs)`);
    }

    console.log('\n========================================');
    console.log('✅ RESEEDING COMPLETE!');
    console.log('========================================');
    console.log('All events now have UNIQUE seat IDs.');
    console.log('Clicking one seat will select only ONE seat!');
    console.log('========================================\n');

    process.exit(0);
  } catch (err) {
    console.error('❌ Error:', err);
    process.exit(1);
  }
};

reseed();
