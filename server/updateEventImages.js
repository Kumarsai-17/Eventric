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

// Simple placeholder images (no external API calls)
const placeholderImages = {
  'Rock Legends Festival 2026': 'https://placehold.co/800x400/8B5CF6/FFFFFF/png?text=Rock+Festival',
  'Tech Summit 2026': 'https://placehold.co/800x400/6D28D9/FFFFFF/png?text=Tech+Summit',
  'NBA Finals Game 7': 'https://placehold.co/800x400/2FE6C6/FFFFFF/png?text=NBA+Finals',
  'Broadway: Hamilton': 'https://placehold.co/800x400/8B5CF6/FFFFFF/png?text=Hamilton',
  'Food & Wine Festival': 'https://placehold.co/800x400/FBB03B/FFFFFF/png?text=Food+Festival',
  'Comedy Night Live': 'https://placehold.co/800x400/FF4D6D/FFFFFF/png?text=Comedy+Night',
  'Art Exhibition: Modern Masters': 'https://placehold.co/800x400/6D28D9/FFFFFF/png?text=Art+Exhibition',
  'Electronic Dance Festival': 'https://placehold.co/800x400/2FE6C6/FFFFFF/png?text=EDM+Festival'
};

const updateImages = async () => {
  try {
    await connectDB();

    console.log('Updating event images to avoid rate limits...\n');

    for (const [eventTitle, imageUrl] of Object.entries(placeholderImages)) {
      const result = await Event.updateOne(
        { title: eventTitle },
        { 
          $set: { 
            'coverImage.url': imageUrl,
            'coverImage.publicId': ''
          } 
        }
      );

      if (result.matchedCount > 0) {
        console.log(`✅ Updated: ${eventTitle}`);
      } else {
        console.log(`⏭️  Not found: ${eventTitle}`);
      }
    }

    // Also remove any remaining Unsplash URLs to prevent 429 errors
    const unsplashEvents = await Event.find({ 'coverImage.url': /unsplash/ });
    
    if (unsplashEvents.length > 0) {
      console.log(`\n⚠️  Found ${unsplashEvents.length} events still using Unsplash`);
      
      for (const event of unsplashEvents) {
        const placeholderUrl = `https://placehold.co/800x400/8B5CF6/FFFFFF/png?text=${encodeURIComponent(event.title.substring(0, 20))}`;
        await Event.updateOne(
          { _id: event._id },
          { 
            $set: { 
              'coverImage.url': placeholderUrl,
              'coverImage.publicId': ''
            } 
          }
        );
        console.log(`✅ Replaced Unsplash image for: ${event.title}`);
      }
    }

    console.log('\n========================================');
    console.log('✅ IMAGE UPDATES COMPLETE!');
    console.log('========================================');
    console.log('All events now use placeholder images.');
    console.log('No more 429 rate limit errors!');
    console.log('========================================\n');

    process.exit(0);
  } catch (err) {
    console.error('❌ Error:', err);
    process.exit(1);
  }
};

updateImages();
