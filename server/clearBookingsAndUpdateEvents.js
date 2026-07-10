const mongoose = require('mongoose');
const Event = require('./models/Event');
const Booking = require('./models/Booking');
const Payment = require('./models/Payment');
const Resale = require('./models/Resale');
const SeatLock = require('./models/SeatLock');
const Notification = require('./models/Notification');
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

// Future event data (all events in the future from today)
const futureEvents = [
  {
    title: 'Rock Legends Festival 2026',
    description: 'Experience the biggest rock music festival of the year featuring legendary bands and emerging artists.',
    category: 'music',
    venue: { name: 'Madison Square Garden', address: '4 Pennsylvania Plaza', city: 'New York', location: { type: 'Point', coordinates: [-73.9935, 40.7505] } },
    startDateTime: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
    endDateTime: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000 + 5 * 60 * 60 * 1000), // +5 hours
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
    startDateTime: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000), // 60 days from now
    endDateTime: new Date(Date.now() + 62 * 24 * 60 * 60 * 1000), // +2 days
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
    startDateTime: new Date(Date.now() + 45 * 24 * 60 * 60 * 1000), // 45 days from now
    endDateTime: new Date(Date.now() + 45 * 24 * 60 * 60 * 1000 + 3 * 60 * 60 * 1000), // +3 hours
    coverImage: { url: 'https://placehold.co/800x400/2FE6C6/FFFFFF/png?text=NBA+Finals', publicId: '' },
    tags: ['basketball', 'sports'],
    tiers: [
      { name: 'general', price: 150, rows: 20, seatsPerRow: 10 },
      { name: 'silver', price: 300, rows: 15, seatsPerRow: 10 },
      { name: 'gold', price: 500, rows: 10, seatsPerRow: 10 },
      { name: 'platinum', price: 1000, rows: 5, seatsPerRow: 10 }
    ]
  },
  {
    title: 'Jazz Night at Blue Note',
    description: 'An intimate evening with world-renowned jazz musicians in the legendary Blue Note venue.',
    category: 'music',
    venue: { name: 'Blue Note Jazz Club', address: '131 W 3rd St', city: 'New York', location: { type: 'Point', coordinates: [-74.0012, 40.7308] } },
    startDateTime: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000), // 15 days from now
    endDateTime: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000 + 3 * 60 * 60 * 1000), // +3 hours
    coverImage: { url: 'https://placehold.co/800x400/8B5CF6/FFFFFF/png?text=Jazz+Night', publicId: '' },
    tags: ['jazz', 'music', 'live'],
    tiers: [
      { name: 'general', price: 75, rows: 8, seatsPerRow: 8 },
      { name: 'silver', price: 120, rows: 5, seatsPerRow: 8 },
      { name: 'gold', price: 200, rows: 3, seatsPerRow: 8 }
    ]
  },
  {
    title: 'Broadway Musical: The Phantom Returns',
    description: 'The classic returns to Broadway with stunning new performances and breathtaking sets.',
    category: 'other',
    venue: { name: 'Majestic Theatre', address: '245 W 44th St', city: 'New York', location: { type: 'Point', coordinates: [-73.9878, 40.7589] } },
    startDateTime: new Date(Date.now() + 20 * 24 * 60 * 60 * 1000), // 20 days from now
    endDateTime: new Date(Date.now() + 20 * 24 * 60 * 60 * 1000 + 2.5 * 60 * 60 * 1000), // +2.5 hours
    coverImage: { url: 'https://placehold.co/800x400/7C3AED/FFFFFF/png?text=Broadway+Musical', publicId: '' },
    tags: ['theater', 'broadway', 'musical'],
    tiers: [
      { name: 'general', price: 100, rows: 12, seatsPerRow: 10 },
      { name: 'silver', price: 180, rows: 8, seatsPerRow: 10 },
      { name: 'gold', price: 300, rows: 5, seatsPerRow: 10 },
      { name: 'platinum', price: 500, rows: 3, seatsPerRow: 10 }
    ]
  },
  {
    title: 'Stand-Up Comedy Special',
    description: 'Top comedians from around the world perform their best material in one unforgettable night.',
    category: 'comedy',
    venue: { name: 'Comedy Cellar', address: '117 MacDougal St', city: 'New York', location: { type: 'Point', coordinates: [-74.0013, 40.7297] } },
    startDateTime: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000), // 10 days from now
    endDateTime: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000 + 2 * 60 * 60 * 1000), // +2 hours
    coverImage: { url: 'https://placehold.co/800x400/EC4899/FFFFFF/png?text=Comedy+Night', publicId: '' },
    tags: ['comedy', 'stand-up', 'entertainment'],
    tiers: [
      { name: 'general', price: 45, rows: 10, seatsPerRow: 8 },
      { name: 'silver', price: 70, rows: 6, seatsPerRow: 8 },
      { name: 'gold', price: 100, rows: 4, seatsPerRow: 8 }
    ]
  }
];

const clearAndReseed = async () => {
  try {
    await connectDB();

    console.log('\n========================================');
    console.log('🧹 CLEARING ALL BOOKING DATA');
    console.log('========================================\n');

    // Delete all bookings
    const bookingsDeleted = await Booking.deleteMany({});
    console.log(`✅ Deleted ${bookingsDeleted.deletedCount} bookings`);

    // Delete all payments
    const paymentsDeleted = await Payment.deleteMany({});
    console.log(`✅ Deleted ${paymentsDeleted.deletedCount} payments`);

    // Delete all resale listings
    const resalesDeleted = await Resale.deleteMany({});
    console.log(`✅ Deleted ${resalesDeleted.deletedCount} resale listings`);

    // Delete all seat locks
    const locksDeleted = await SeatLock.deleteMany({});
    console.log(`✅ Deleted ${locksDeleted.deletedCount} seat locks`);

    // Delete all notifications
    const notificationsDeleted = await Notification.deleteMany({});
    console.log(`✅ Deleted ${notificationsDeleted.deletedCount} notifications`);

    console.log('\n========================================');
    console.log('📅 CREATING FUTURE EVENTS');
    console.log('========================================\n');

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
    const eventsDeleted = await Event.deleteMany({});
    console.log(`✅ Deleted ${eventsDeleted.deletedCount} old events\n`);

    // Create new future events with UNIQUE seat IDs
    console.log('Creating future events with unique seats...\n');
    
    for (const eventData of futureEvents) {
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
      
      const daysFromNow = Math.round((new Date(eventData.startDateTime) - new Date()) / (1000 * 60 * 60 * 24));
      console.log(`✅ Created "${event.title}"`);
      console.log(`   📅 ${daysFromNow} days from now - ${event.startDateTime.toLocaleDateString()}`);
      console.log(`   💺 ${seats.length} seats\n`);
    }

    console.log('========================================');
    console.log('✅ COMPLETE!');
    console.log('========================================');
    console.log('✓ All bookings cleared');
    console.log('✓ All events are now in the future');
    console.log('✓ All seats are available');
    console.log('========================================\n');

    process.exit(0);
  } catch (err) {
    console.error('❌ Error:', err);
    process.exit(1);
  }
};

clearAndReseed();
