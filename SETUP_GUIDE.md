# Quick Setup Guide

## Firebase Setup Steps

1. **Enable Authentication Methods**
   - Go to [Firebase Console](https://console.firebase.google.com/)
   - Select your project: `poker-3c5c6`
   - Navigate to **Authentication** > **Sign-in method**
   - Enable **Email/Password** authentication
   - Enable **Google** authentication (optional but recommended)

2. **Set up Firestore Database**
   - Go to **Firestore Database** in Firebase Console
   - Click **Create database**
   - Start in **test mode** (for development)
   - Choose a location for your database
   - Click **Enable**

3. **Set up Firestore Security Rules** (Important!)
   Add these rules to your Firestore Rules tab:
   ```javascript
   rules_version = '2';
   service cloud.firestore {
     match /databases/{database}/documents {
       // Users can read/write their own user document
       match /users/{userId} {
         allow read, write: if request.auth != null && request.auth.uid == userId;
       }
       
       // Users can read store items
       match /store/{itemId} {
         allow read: if request.auth != null;
         allow write: if false; // Only admins can write (set up admin rules separately)
       }
       
       // Users can read/write their own transactions
       match /transactions/{transactionId} {
         allow read, write: if request.auth != null && 
           resource.data.userId == request.auth.uid;
       }
     }
   }
   ```

4. **Create Store Collection** (Optional)
   - In Firestore, create a collection named `store`
   - Add documents for store items (chips packages, cosmetics, etc.)
   - Example document structure:
     ```json
     {
       "name": "Starter Pack",
       "type": "chips",
       "amount": 5000,
       "price": 4.99,
       "description": "Get started with 5000 chips"
     }
     ```

5. **Test the Application**
   - Run `npm start`
   - The app should now connect to Firebase
   - Try creating an account to test authentication
   - Check Firestore to see if user documents are created

## Troubleshooting

### Authentication not working?
- Make sure Email/Password is enabled in Firebase Console
- Check browser console for errors
- Verify Firebase config in `src/config/firebase.js`

### Firestore errors?
- Make sure Firestore is enabled in Firebase Console
- Check security rules are set correctly
- Verify you're authenticated before accessing Firestore

### Google Sign-In not working?
- Make sure Google authentication is enabled
- Add your domain to authorized domains in Firebase Console
- Check OAuth consent screen in Google Cloud Console

## Next Steps

1. Set up a WebSocket server for multiplayer (optional)
2. Add more store items in Firestore
3. Customize the UI theme
4. Add more achievements and rewards

## Important Notes

- The app uses Firestore for data persistence
- User profiles are automatically created on first login
- Daily bonuses reset at midnight (based on user's timezone)
- Bonus wheel resets every hour
- All game data is stored in Firestore

