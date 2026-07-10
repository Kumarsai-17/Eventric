const mongoose = require('mongoose');
const Event = require('./models/Event');
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

const checkDuplicates = async () => {
  try {
    await connectDB();

    const events = await Event.find({});
    
    console.log(`Checking ${events.length} events for duplicate seat IDs...\n`);

    let totalDuplicates = 0;

    for (const event of events) {
      const seatIds = event.seats.map(s => s.seatId);
      const uniqueSeatIds = new Set(seatIds);
      
      if (seatIds.length !== uniqueSeatIds.size) {
        const duplicates = seatIds.length - uniqueSeatIds.size;
        totalDuplicates += duplicates;
        
        console.log(`❌ Event: "${event.title}"`);
        console.log(`   Total seats: ${seatIds.length}`);
        console.log(`   Unique seats: ${uniqueSeatIds.size}`);
        console.log(`   Duplicates: ${duplicates}`);
        
        // Find which seatIds are duplicated
        const seatIdCount = {};
        seatIds.forEach(id => {
          seatIdCount[id] = (seatIdCount[id] || 0) + 1;
        });
        
        const duplicatedIds = Object.entries(seatIdCount)
          .filter(([_, count]) => count > 1)
          .map(([id, count]) => `${id} (x${count})`);
        
        console.log(`   Duplicated IDs: ${duplicatedIds.join(', ')}`);
        console.log('');
      } else {
        console.log(`✅ Event: "${event.title}" - No duplicates (${seatIds.length} seats)`);
      }
    }

    console.log('\n========================================');
    if (totalDuplicates > 0) {
      console.log(`⚠️  FOUND ${totalDuplicates} DUPLICATE SEATS!`);
      console.log('========================================');
      console.log('This could cause multiple seats to be selected.');
      console.log('Run cleanDuplicateSeats.js to fix this issue.');
    } else {
      console.log('✅ NO DUPLICATES FOUND');
      console.log('========================================');
      console.log('All events have unique seat IDs.');
    }
    console.log('');

    process.exit(0);
  } catch (err) {
    console.error('❌ Error:', err);
    process.exit(1);
  }
};

checkDuplicates();
