# Eventric

A MERN-stack, real-time event booking and verified ticket-exchange platform.
Live seat locking · signed QR tickets · secure ownership transfer · fair resale marketplace.

## 🚀 Quick Start

```bash
# Install all dependencies
npm run install-all

# Configure environment variables (see SETUP.md)
cd server && cp .env.example .env
cd ../client && cp .env.example .env

# Run both client and server
npm run dev
```

Visit http://localhost:3000 to see the app!

**📖 For detailed setup instructions, see [SETUP.md](./SETUP.md)**

## Stack

- **Frontend:** React, React Router DOM, Axios, Socket.IO client, plain CSS (no Tailwind/TypeScript)
- **Backend:** Node.js, Express.js, Socket.IO
- **Database:** MongoDB + Mongoose
- **Auth:** JWT
- **Payments:** Razorpay
- **File uploads:** Cloudinary

## ✨ Core Features

- 🔐 **User Authentication** - JWT-based secure auth with role-based access
- 🎫 **Event Management** - Create and manage events with seat maps
- ⚡ **Real-Time Seat Locking** - Live updates via Socket.IO, no double bookings
- 📱 **QR Ticket Generation** - HMAC-signed tickets for fraud prevention
- 💳 **Secure Payments** - Razorpay integration with payment verification
- 🔄 **Ticket Resale Marketplace** - Fair pricing, ownership transfer, QR rotation
- 📍 **Geo-Based Discovery** - Find events near you
- 🔔 **Notifications System** - Real-time updates on bookings and events
- 👑 **Admin Dashboard** - Platform management and analytics

## 📁 Project Structure

```
eventric/
├── client/                 React frontend
│   ├── public/
│   └── src/
│       ├── components/     Reusable UI components
│       ├── pages/          Route pages
│       ├── services/       API & socket services
│       ├── context/        React context (Auth)
│       └── styles/         Pure CSS styling
│
└── server/                 Express backend
    ├── config/             Database, Cloudinary, Payment gateway
    ├── controllers/        Business logic
    ├── routes/             API routes
    ├── middleware/         Auth, validation, error handling
    ├── models/             MongoDB schemas
    ├── sockets/            Real-time seat locking
    └── utils/              QR generation, JWT, notifications
```

## 🔒 Security Features

- ✅ JWT Authentication
- ✅ Password Hashing (bcrypt)
- ✅ Protected Routes
- ✅ Rate Limiting (100 req/15min)
- ✅ Auth Rate Limiting (5 attempts/15min)
- ✅ NoSQL Injection Prevention
- ✅ Security Headers (Helmet.js)
- ✅ CORS Protection
- ✅ Input Validation
- ✅ QR Fraud Prevention (HMAC signatures)

## 💡 How It Works

### Real-Time Seat Locking

`sockets/seatSocket.js` handles `seat:hold` / `seat:release` over Socket.IO, backed by a `SeatLock` collection with:
- Unique `(event, seatId)` index - prevents double booking
- TTL index - auto-releases expired locks
- Socket disconnect handling - frees abandoned seats

### Booking Confirmation

`bookingController.confirmBooking` uses MongoDB transactions to:
1. Update seat statuses atomically
2. Clean up seat locks
3. Create booking record
4. Generate HMAC-signed QR ticket

### Resale Marketplace

- Enforces `resalePrice <= originalPrice`
- Transfers booking ownership
- Rotates QR token (invalidates old QR)
- Maintains ownership history trail

### Check-In & Fraud Prevention

`bookingController.checkInTicket`:
1. Verifies HMAC signature
2. Checks QR matches current booking data
3. Rejects tampered/forged/superseded tickets
4. Marks ticket as checked in

## 🚀 Deployment

### Frontend (Vercel/Netlify)

```bash
cd client
npm run build
# Deploy the build/ folder
```

Set environment variables:
```
REACT_APP_API_URL=https://your-api.com/api
REACT_APP_SOCKET_URL=https://your-api.com
```

### Backend (Render/Railway)

Deploy the `server/` folder with environment variables from `.env.example`.

Set `NODE_ENV=production`

### Database (MongoDB Atlas)

Use MongoDB Atlas cloud database. Update `MONGO_URI` in your production environment.

## 📜 Available Scripts

### Root Directory
```bash
npm run dev          # Run both client & server
npm run client       # Run frontend only
npm run server       # Run backend only
npm run install-all  # Install all dependencies
npm run build        # Build frontend for production
```

### Server
```bash
npm start      # Production mode
npm run dev    # Development mode with nodemon
```

### Client
```bash
npm start      # Development server
npm run build  # Production build
npm test       # Run tests
```

## 📝 Environment Variables

### Server (.env)
```env
MONGO_URI=mongodb+srv://...
JWT_SECRET=your_secret_key
RAZORPAY_KEY_ID=rzp_test_...
RAZORPAY_KEY_SECRET=...
CLOUDINARY_CLOUD_NAME=...
CLOUDINARY_API_KEY=...
CLOUDINARY_API_SECRET=...
```

### Client (.env)
```env
REACT_APP_API_URL=http://localhost:5000/api
REACT_APP_SOCKET_URL=http://localhost:5000
```

## 🛠️ Tech Stack Details

| Layer | Technologies |
|-------|-------------|
| Frontend | React 18, React Router v6, Axios, Socket.IO Client |
| Backend | Node.js, Express.js, Socket.IO |
| Database | MongoDB, Mongoose ODM |
| Authentication | JWT, bcryptjs |
| Payments | Razorpay |
| File Storage | Cloudinary |
| Real-Time | Socket.IO |
| Validation | express-validator |
| Security | Helmet, express-rate-limit, express-mongo-sanitize |

## 📋 User Roles

- **user** - Book tickets, resell tickets, manage bookings
- **organizer** - Create events, manage event details, check-in tickets
- **admin** - Full platform access, user management, analytics

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

## 📄 License

ISC

## 🆘 Need Help?

- Check [SETUP.md](./SETUP.md) for detailed setup instructions
- Verify MongoDB connection and environment variables
- Check console logs for error details
- Ensure all dependencies are installed with `npm run install-all`
