# 🎰 Poker Israel - Online Texas Hold'em Platform

A modern, stylish online poker platform built with React, featuring real-time multiplayer gameplay, user authentication, economy system, and a beautiful blue & white neon theme.

## ✨ Features

### 🎮 Game Features
- **Real-time Multiplayer** - Play against other players using Firestore real-time updates
- **Texas Hold'em Poker** - Full poker game implementation
- **Virtual Dealer** - Animated dealer with speech bubbles
- **Player Chat** - In-game chat system
- **Turn Timers** - Auto-fold with countdown timers
- **Spectator Mode** - Watch games in progress

### 👤 User System
- **Authentication** - Email/password and Google sign-in
- **User Profiles** - Username, avatar, level, achievements
- **Chip Management** - Total chips tracking and synchronization
- **Game History** - Track wins, losses, and statistics

### 💰 Economy System
- **Daily Login Bonuses** - Claim daily rewards
- **Bonus Wheel** - Hourly spin wheel for chips
- **In-Game Store** - Purchase chips and cosmetics
- **Transaction Logs** - Complete transaction history
- **Dealer Tips** - Tip the dealer (100 chips per tip)
- **House Rake** - 5% commission on game entry

### 🎨 UI/UX
- **Modern Design** - Blue & white neon theme inspired by "POKER ISRAEL"
- **Responsive Design** - Works on desktop and mobile
- **Smooth Animations** - Framer Motion animations throughout
- **Custom Dialogs** - Beautiful styled alerts, prompts, and confirmations
- **Professional Lobby** - Grid layout with real-time player counts

### 🔐 Admin Panel
- **Table Management** - Create, edit, and delete tables
- **Profit Tracking** - View house profits and transaction history
- **System Settings** - Configure dealer rake, house rake, starting chips

## 🚀 Getting Started

### Prerequisites
- Node.js 16+ and npm
- Firebase account (for authentication and database)

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/YOUR_USERNAME/poker-israel.git
   cd poker-israel
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Configure Firebase**
   - Create a Firebase project at [Firebase Console](https://console.firebase.google.com/)
   - Copy your Firebase config to `src/config/firebase.js`
   - Set up Firestore security rules (see `FIRESTORE_RULES_COMPLETE.md`)
   - Enable Authentication (Email/Password and Google)

4. **Set up Firestore Collections**
   - See `FIRESTORE_SETUP.md` for detailed instructions
   - Initialize default tables (see `src/utils/defaultTables.js`)

5. **Run the development server**
   ```bash
   npm start
   ```

6. **Open your browser**
   - Navigate to `http://localhost:3000`

## 📁 Project Structure

```
poker-israel/
├── public/                 # Static assets
│   └── assets/            # Images, logos, etc.
├── src/
│   ├── components/        # React components
│   │   ├── admin/         # Admin panel
│   │   ├── auth/          # Authentication components
│   │   ├── cards/         # Card components
│   │   ├── chat/          # Chat system
│   │   ├── dealer/        # Virtual dealer
│   │   ├── economy/       # Economy features (store, bonus wheel)
│   │   ├── lobby/         # Lobby screen
│   │   ├── logo/          # Logo component
│   │   ├── players/       # Player components
│   │   ├── profile/       # User profile
│   │   ├── store/         # In-game store
│   │   └── ui/            # UI components (dialogs, etc.)
│   ├── config/            # Configuration files
│   │   └── firebase.js    # Firebase configuration
│   ├── store/             # Zustand state management
│   │   ├── authStore.js   # Authentication state
│   │   ├── economyStore.js # Economy state
│   │   └── gameStore.js   # Game state
│   ├── styles/            # Global styles
│   ├── utils/             # Utility functions
│   │   ├── cards.js       # Card dealing logic
│   │   ├── players.js     # Player management
│   │   ├── bet.js         # Betting logic
│   │   ├── dialogs.js     # Dialog utilities
│   │   └── defaultTables.js # Default table setup
│   ├── App.jsx            # Main app component
│   └── index.js           # Entry point
├── ADMIN_ACCESS.md        # Admin access guide
├── FIRESTORE_RULES_COMPLETE.md # Firestore security rules
├── FIRESTORE_SETUP.md     # Firestore setup guide
└── SETUP_GUIDE.md         # Detailed setup instructions
```

## 🔧 Configuration

### Firebase Setup
1. Create a new Firebase project
2. Enable Authentication (Email/Password, Google)
3. Create Firestore database
4. Set up security rules (see `FIRESTORE_RULES_COMPLETE.md`)
5. Update `src/config/firebase.js` with your config

### Firestore Collections
- `users` - User profiles and statistics
- `tables` - Poker tables configuration
- `game_rooms` - Active game rooms
- `store` - Store items for purchase
- `house_profits` - House profit tracking
- `transactions` - User transaction history

See `FIRESTORE_SETUP.md` for detailed collection setup.

## 🎮 How to Play

1. **Register/Login** - Create an account or sign in
2. **Enter Lobby** - Browse available tables
3. **Join Table** - Click on a table to join
4. **Play Poker** - Follow the game flow and make your moves
5. **Earn Chips** - Win games, claim bonuses, spin the wheel
6. **Shop** - Purchase chips and cosmetics from the store

## 👨‍💼 Admin Access

To access the admin panel:
1. Sign in with `admin@pokerisrael.com`, OR
2. Set `isAdmin: true` in your user document in Firestore

See `ADMIN_ACCESS.md` for detailed instructions.

## 🛠️ Technologies Used

- **React 18** - UI framework
- **Zustand** - State management
- **Firebase** - Authentication & Firestore database
- **Framer Motion** - Animations
- **React Router** - Routing
- **Socket.io** - Real-time communication (optional)

## 📝 Scripts

- `npm start` - Start development server
- `npm build` - Build for production
- `npm test` - Run tests
- `npm eject` - Eject from Create React App

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 📄 License

This project is private and proprietary.

## 👤 Author

Poker Israel Team

## 🙏 Acknowledgments

- Design inspired by "POKER ISRAEL" theme
- Built with modern web technologies
- Special thanks to all contributors

---

**Note**: This is a private project. For access or questions, please contact the project owner.
