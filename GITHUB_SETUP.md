# 🚀 הוראות העלאה ל-GitHub

## שלב 1: יצירת Repository ב-GitHub

1. **היכנס ל-GitHub** - [https://github.com](https://github.com)
2. **לחץ על הכפתור "+"** בפינה הימנית העליונה
3. **בחר "New repository"**
4. **מלא את הפרטים:**
   - **Repository name**: `poker-israel` (או שם אחר שאתה רוצה)
   - **Description**: `Modern online Texas Hold'em poker platform with real-time multiplayer`
   - **Visibility**: 
     - **Private** - אם אתה רוצה שזה יהיה פרטי
     - **Public** - אם אתה רוצה שזה יהיה ציבורי
   - **אל תסמן** "Initialize this repository with a README" (כבר יש לנו README)
   - **אל תבחר** .gitignore או license (כבר יש לנו)
5. **לחץ על "Create repository"**

## שלב 2: חיבור הפרויקט המקומי ל-GitHub

לאחר שיצרת את ה-repository ב-GitHub, תראה הוראות. הנה הפקודות שצריך להריץ:

### אם זה repository חדש (ריק):

```bash
git remote add origin https://github.com/YOUR_USERNAME/poker-israel.git
git branch -M main
git push -u origin main
```

**החלף `YOUR_USERNAME`** בשם המשתמש שלך ב-GitHub!

### אם אתה משתמש ב-SSH במקום HTTPS:

```bash
git remote add origin git@github.com:YOUR_USERNAME/poker-israel.git
git branch -M main
git push -u origin main
```

## שלב 3: אימות (אם נדרש)

אם GitHub דורש אימות:

### אופציה 1: Personal Access Token
1. עבור ל-GitHub Settings → Developer settings → Personal access tokens
2. צור token חדש עם הרשאות `repo`
3. השתמש ב-token במקום סיסמה כשדורשים

### אופציה 2: GitHub CLI
```bash
gh auth login
```

## שלב 4: בדיקה

לאחר ההעלאה, בדוק ב-GitHub:
- כל הקבצים הועלו
- ה-README מופיע
- אין קבצים רגישים (כמו API keys) ב-repository

## ⚠️ חשוב: קבצים רגישים

**ודא שאין קבצים רגישים ב-repository:**
- API keys
- סיסמאות
- פרטי Firebase אמיתיים (אם יש)

אם יש לך `src/config/firebase.js` עם פרטים אמיתיים, עדכן אותו לפני ההעלאה או הוסף אותו ל-`.gitignore`.

## 📝 פקודות נוספות שימושיות

### להוסיף שינויים חדשים:
```bash
git add .
git commit -m "תיאור השינויים"
git push
```

### לראות סטטוס:
```bash
git status
```

### לראות היסטוריית commits:
```bash
git log
```

### לשלוף שינויים מ-GitHub:
```bash
git pull
```

## 🎉 סיימת!

אחרי שהכל הועלה, ה-repository שלך יהיה זמין ב:
`https://github.com/YOUR_USERNAME/poker-israel`

---

**צריך עזרה?** בדוק את התיעוד של GitHub או פנה לתמיכה.


