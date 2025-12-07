# Firestore Security Rules - עדכן עכשיו!

## ⚠️ אם אתה מקבל שגיאת "אין הרשאה ליצור שולחן" - עדכן את הכללים!

## שלבים מהירים:

1. **פתח Firebase Console:** https://console.firebase.google.com/
2. **בחר פרויקט:** poker-3c5c6
3. **לך ל:** Firestore Database > Rules
4. **העתק והדבק** את הכללים למטה
5. **לחץ Publish**

ראה `FIRESTORE_RULES_COMPLETE.md` למדריך מפורט יותר.

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Helper function to check if user is authenticated
    function isAuthenticated() {
      return request.auth != null;
    }
    
    // Helper function to check if user is admin
    function isAdmin() {
      return isAuthenticated() && 
        (get(/databases/$(database)/documents/users/$(request.auth.uid)).data.isAdmin == true ||
         request.auth.token.email == 'admin@pokerisrael.com');
    }
    
    // Users collection
    match /users/{userId} {
      // Users can read their own profile
      allow read: if isAuthenticated() && request.auth.uid == userId;
      // Users can update their own profile
      allow update: if isAuthenticated() && request.auth.uid == userId;
      // Users can create their own profile
      allow create: if isAuthenticated() && request.auth.uid == userId;
    }
    
    // Tables collection - for lobby
    match /tables/{tableId} {
      // Anyone authenticated can read tables
      allow read: if isAuthenticated();
      // Users can create their own tables
      allow create: if isAuthenticated() && 
        request.resource.data.createdBy == request.auth.uid;
      // Only table creator or admin can update/delete
      allow update, delete: if isAuthenticated() && 
        (resource.data.createdBy == request.auth.uid || isAdmin());
    }
    
    // Game rooms collection - for active games
    match /game_rooms/{roomId} {
      // Players in the room can read
      allow read: if isAuthenticated();
      // Players can create/update rooms (when joining)
      allow create, update: if isAuthenticated();
      // Only admin can delete rooms
      allow delete: if isAdmin();
    }
    
    // Store collection
    match /store/{itemId} {
      // Anyone authenticated can read store items
      allow read: if isAuthenticated();
      // Only admins can write
      allow write: if isAdmin();
    }
    
    // Transactions collection
    match /transactions/{transactionId} {
      // Users can read their own transactions
      allow read: if isAuthenticated() && 
        resource.data.userId == request.auth.uid;
      // Users can create their own transactions
      allow create: if isAuthenticated() && 
        request.resource.data.userId == request.auth.uid;
      // Only admins can update/delete
      allow update, delete: if isAdmin();
    }
    
    // House profits collection
    match /house_profits/{profitId} {
      // Only admins can read/write
      allow read, write: if isAdmin();
    }
    
    // ============================================
    // CHAT COLLECTION (rooms/{roomId}/chat)
    // ============================================
    match /rooms/{roomId}/chat/{messageId} {
      // Players in the room can read chat messages
      allow read: if isAuthenticated();
      // Players can create chat messages
      allow create: if isAuthenticated() && 
        request.resource.data.playerId == request.auth.uid;
      // Only message sender can update their own message
      allow update: if isAuthenticated() && 
        resource.data.playerId == request.auth.uid;
      // Only message sender can delete their own message
      allow delete: if isAuthenticated() && 
        resource.data.playerId == request.auth.uid;
    }
  }
}
```

## Quick Setup Steps:

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project: `poker-3c5c6`
3. Navigate to **Firestore Database** > **Rules**
4. Copy and paste the rules above
5. Click **Publish**

## Testing:

After updating the rules, try creating a private table again. If you still get errors, check:
- You are logged in
- Your user document exists in the `users` collection
- The `tables` collection exists (it will be created automatically on first write)

