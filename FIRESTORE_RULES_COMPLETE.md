# Firestore Security Rules - Complete Setup

## ⚠️ חשוב: עדכן את כללי Firestore עכשיו!

השגיאה "אין הרשאה ליצור שולחן" נובעת מכללי Firestore שלא מאפשרים יצירת שולחנות.

## שלבים לעדכון הכללים:

### 1. פתח את Firebase Console
- לך ל: https://console.firebase.google.com/
- בחר את הפרויקט: **poker-3c5c6**

### 2. נווט לכללי Firestore
- לחץ על **Firestore Database** בתפריט השמאלי
- לחץ על הטאב **Rules** (בחלק העליון)

### 3. העתק והדבק את הכללים הבאים:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    
    // Helper function - check if user is authenticated
    function isAuthenticated() {
      return request.auth != null;
    }
    
    // Helper function - check if user is admin
    function isAdmin() {
      return isAuthenticated() && 
        (get(/databases/$(database)/documents/users/$(request.auth.uid)).data.isAdmin == true ||
         request.auth.token.email == 'admin@pokerisrael.com');
    }
    
    // ============================================
    // USERS COLLECTION
    // ============================================
    match /users/{userId} {
      // Users can read their own profile
      allow read: if isAuthenticated() && request.auth.uid == userId;
      // Users can create their own profile
      allow create: if isAuthenticated() && request.auth.uid == userId;
      // Users can update their own profile
      allow update: if isAuthenticated() && request.auth.uid == userId;
    }
    
    // ============================================
    // TABLES COLLECTION - CRITICAL!
    // ============================================
    match /tables/{tableId} {
      // Anyone authenticated can read tables (to see lobby)
      allow read: if isAuthenticated();
      
      // Users can create tables (public or private)
      allow create: if isAuthenticated() && 
        request.resource.data.createdBy == request.auth.uid;
      
      // Users can update tables they created, or admins
      allow update: if isAuthenticated() && 
        (resource.data.createdBy == request.auth.uid || isAdmin());
      
      // Only admins can delete tables
      allow delete: if isAdmin();
    }
    
    // ============================================
    // GAME_ROOMS COLLECTION
    // ============================================
    match /game_rooms/{roomId} {
      // Players can read game rooms
      allow read: if isAuthenticated();
      
      // Players can create/update game rooms (when joining)
      allow create, update: if isAuthenticated();
      
      // Only admins can delete rooms
      allow delete: if isAdmin();
    }
    
    // ============================================
    // STORE COLLECTION
    // ============================================
    match /store/{itemId} {
      // Anyone authenticated can read store items
      allow read: if isAuthenticated();
      // Only admins can write
      allow write: if isAdmin();
    }
    
    // ============================================
    // TRANSACTIONS COLLECTION
    // ============================================
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
    
    // ============================================
    // HOUSE_PROFITS COLLECTION
    // ============================================
    match /house_profits/{profitId} {
      // Only admins can read/write house profits
      allow read, write: if isAdmin();
    }
  }
}
```

### 4. שמור את הכללים
- לחץ על **Publish** (פרסם) בחלק העליון
- המתן כמה שניות עד שהכללים יתעדכנו

### 5. בדיקה
- רענן את הדף באפליקציה
- נסה ליצור שולחן פרטי שוב
- אם עדיין יש שגיאה, בדוק את הקונסול (F12) ובדוק את הודעת השגיאה המדויקת

## פתרון בעיות:

### אם עדיין יש שגיאת הרשאות:

1. **ודא שאתה מחובר:**
   - בדוק שאתה רואה את השם שלך בלובי
   - אם לא, התחבר מחדש

2. **ודא שהמשתמש קיים ב-Firestore:**
   - לך ל-Firestore Database > Data
   - בדוק שיש collection בשם `users`
   - בדוק שיש document עם ה-UID שלך

3. **אם אין document של משתמש:**
   - המשתמש ייווצר אוטומטית בכניסה הראשונה
   - נסה להתנתק ולהתחבר מחדש

4. **בדוק את הקונסול:**
   - לחץ F12 בדפדפן
   - לך לטאב Console
   - חפש שגיאות אדומות
   - שלח את הודעת השגיאה המדויקת

## הערות חשובות:

- **כללי Firestore מתעדכנים מיד** - אין צורך להמתין
- **אם יש שגיאת syntax** - Firebase יראה לך איפה הבעיה
- **במצב test mode** - הכללים מאפשרים הכל (אבל זה לא מומלץ לפרודקשן)

## מצב Test Mode (לפיתוח בלבד):

אם אתה עדיין בפיתוח ורוצה לאפשר הכל זמנית:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /{document=**} {
      allow read, write: if request.time < timestamp.date(2025, 12, 31);
    }
  }
}
```

⚠️ **זה מאפשר גישה מלאה לכל אחד!** השתמש בזה רק בפיתוח!

