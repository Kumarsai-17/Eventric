# 🎭 Eventric - Smart Event Booking Platform

**A modern, full-stack event ticketing system with real-time seat selection, location-based discovery, and a fair resale marketplace where prices can only go down.**

## ✨ Key Features

### 🎟️ Smart Booking System
- **Real-time seat selection** with live availability updates via Socket.IO
- Interactive seat maps with multiple pricing tiers (General, Silver, Gold, Platinum)
- QR code ticket generation for contactless entry
- Booking cancellation with time-based restrictions (within 48 hours, not within 72 hours of event)

### 📍 Location-Based Discovery
- Automatic location detection on login/registration
- City-based event filtering for personalized experience
- 500+ Indian cities supported
- Events and resale tickets automatically filtered by user's location
- Geolocation API integration with reverse geocoding

### 💰 Fair Resale Marketplace
- Anti-scalping system: resale prices **cannot exceed original price**
- Secure ticket transfer with new QR code generation on purchase
- Automatic seller notifications on successful sales with payment confirmation
- Buyer notifications with new ticket details
- Time-based listing restrictions (cannot list within 24 hours of event)
- Buyer protection with two-step payment verification (order → confirm)

### 🎨 Advanced Event Creation
- **Visual seat editor** with drag-and-drop style customization
- Click-to-add, click-to-remove, and click-to-change-tier modes
- Pre-built venue templates (Theater, Stadium, Conference Hall, Club, Concert Hall)
- Simple mode (tier-based configuration) and Advanced mode (visual editor)
- Custom tier configuration with dynamic pricing
- Add/remove rows and columns dynamically
- Real-time seat count and pricing summary
- Separate date and time selectors for better UX
- Center-aligned, professional form layout

### 🔔 Real-Time Notifications
- Instant notifications for bookings, payments, and resale updates
- WebSocket-powered notification bell with unread count
- Persistent notification history
- Seller receives payment notification when ticket sells
- Buyer receives ticket purchase confirmation

### 👨‍💼 Admin Dashboard
- Event management and analytics
- User management with role-based access control
- Revenue tracking and statistics
- Event creation with advanced seat editor
- Real-time booking monitoring

### 🎭 Modern UI/UX
- Beautiful dark theme with purple accents (#8B5CF6)
- Fully responsive design for all devices
- Smooth animations and transitions
- Ticket-stub styled components with perforation effects
- Interactive canvas backgrounds with spotlight effects
- Clean, centered layouts
- Professional color scheme (Purple, Gold, Teal)

## 🛠️ Tech Stack

### Frontend
- **React 18** - Modern component-based UI
- **React Router v6** - Client-side routing
- **Socket.IO Client** - Real-time updates
- **Axios** - HTTP client
- **Context API** - State management
- **CSS3** - Custom styling with CSS variables

### Backend
- **Node.js & Express** - RESTful API server
- **MongoDB & Mongoose** - Database and ODM with geospatial indexing
- **Socket.IO** - WebSocket communication for real-time features
- **JWT** - Token-based authentication
- **QRCode** - Secure ticket generation with validation
- **Bcrypt** - Password hashing
- **Multer** - File upload handling

### Features Architecture
- Real-time seat locking mechanism (5-minute TTL)
- Transaction-safe booking confirmation with MongoDB sessions
- Atomic resale operations with ownership transfer
- Location-based geospatial queries (2dsphere index)
- Time-controlled cancellation and resale policies
- QR code rotation on ticket transfer for security
- Payment verification with signature validation

## 🚀 Quick Start

### Prerequisites
- Node.js (v14 or higher)
- MongoDB (local or MongoDB Atlas)
- Git

## 📱 User Flow

### For Event Attendees

1. **Register/Login**
   - Create account with email and password
   - Location selector automatically appears
   - Choose your city or let it auto-detect

2. **Browse Events**
   - Events automatically filtered by your city
   - Search by name, city, or tags
   - Filter by category (Music, Sports, Movies, etc.)

3. **Book Tickets**
   - View event details with real-time seat availability
   - Click seats to select (multiple selection supported)
   - Seats lock automatically for 5 minutes
   - Proceed to secure checkout

4. **My Tickets**
   - View all active tickets with QR codes
   - See tickets listed for resale
   - Cancel bookings (within 48 hours, not within 72 hours of event)

5. **Resale Marketplace**
   - List tickets for resale (max: original price)
   - Cannot list within 24 hours of event
   - Buy discounted tickets from others
   - New QR code generated on purchase

### For Event Organizers

1. **Create Event**
   - Choose from venue templates or create custom layout
   - Use **Advanced Editor** for visual seat customization
   - Add/remove seats by clicking
   - Configure multiple pricing tiers
   - Set event details and location

2. **Manage Events**
   - View bookings and revenue
   - Check real-time seat availability
   - Monitor resale activity

## 🎯 Project Highlights

### Security
- JWT-based authentication with secure token storage
- Password hashing with bcrypt
- Input validation and sanitization
- Protected routes with role-based access control
- Payment signature verification
- QR code validation to prevent tampering

### Real-Time Features
- Live seat availability updates
- Instant notifications via WebSocket
- Seat locking mechanism
- Real-time dashboard statistics

### Performance
- Optimized MongoDB queries with indexing
- Geospatial 2dsphere index for location queries
- Debounced search for better UX
- Lazy loading and code splitting

### Code Quality
- Clean, modular code structure
- Consistent naming conventions
- Error handling throughout
- Production-ready logging
- No unnecessary console logs

### Business Logic
- Time-based booking cancellation rules
- Anti-scalping resale price caps
- Automatic seat unlocking after timeout
- Transaction-safe booking confirmation
- QR code rotation on ownership transfer

## 📂 Project Structure

```
Eventric/
├── client/                 # React frontend
│   ├── public/
│   └── src/
│       ├── components/     # Reusable components
│       ├── context/        # React Context (Auth)
│       ├── pages/          # Page components
│       ├── services/       # API service layer
│       ├── styles/         # CSS files
│       └── utils/          # Utility functions
├── server/                 # Node.js backend
│   ├── config/            # Configuration files
│   ├── controllers/       # Route controllers
│   ├── middleware/        # Custom middleware
│   ├── models/            # Mongoose models
│   ├── routes/            # API routes
│   ├── sockets/           # Socket.IO handlers
│   └── utils/             # Helper functions
└── package.json           # Root scripts
```

## 🔑 Key Technologies & Libraries

### Frontend Dependencies
- `react` - UI library
- `react-router-dom` - Routing
- `axios` - HTTP client
- `socket.io-client` - WebSocket client

### Backend Dependencies
- `express` - Web framework
- `mongoose` - MongoDB ODM
- `socket.io` - WebSocket server
- `jsonwebtoken` - JWT authentication
- `bcryptjs` - Password hashing
- `qrcode` - QR code generation
- `express-async-handler` - Async error handling
- `cors` - Cross-origin resource sharing
- `dotenv` - Environment variables

## 🎓 Learning Outcomes

This project demonstrates:
- Full-stack JavaScript development (MERN stack)
- Real-time communication with WebSockets
- Payment gateway integration
- Authentication and authorization
- Database design and optimization
- RESTful API architecture
- State management with Context API
- Responsive UI design
- Transaction-safe operations
- Geospatial queries
- Time-based business logic

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 📝 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 👨‍💻 Author

**Kumar Sai**  
- GitHub: [@Kumarsai-17](https://github.com/Kumarsai-17)
- Project: [Eventric](https://github.com/Kumarsai-17/Eventric)

## 🙏 Acknowledgments

- MongoDB for excellent documentation
- React community for best practices
- Socket.IO for real-time capabilities

---

⭐ **If you find this project helpful, please star the repository!**

📧 **For questions or feedback, open an issue on GitHub**

---

**Built with ❤️ using the MERN Stack**
