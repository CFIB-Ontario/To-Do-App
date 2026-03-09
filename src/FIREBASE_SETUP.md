# Firebase Setup Guide - Quick & Free

Your to-do app now syncs across all devices using Firebase (Google's free cloud database).

## Step 1: Create a Free Firebase Account

1. Go to [console.firebase.google.com](https://console.firebase.google.com)
2. Sign in with your Google account (free)
3. Click **"Add project"** or **"Create a project"**

## Step 2: Create Your Firebase Project

1. **Project name**: Enter any name (e.g., "My Todo App")
2. Click **Continue**
3. **Google Analytics**: You can disable it (not needed)
4. Click **Create project**
5. Wait for it to create (about 30 seconds)
6. Click **Continue**

## Step 3: Add a Web App

1. Click the **Web icon** (`</>`) to add a web app
2. **App nickname**: Enter "Todo Web App"
3. **Do NOT** check "Also set up Firebase Hosting"
4. Click **Register app**

## Step 4: Copy Your Firebase Config

You will see a `firebaseConfig` object that looks like this:

```javascript
const firebaseConfig = {
  apiKey: "AIzaSy...",
  authDomain: "your-project.firebaseapp.com",
  projectId: "your-project-id",
  storageBucket: "your-project.appspot.com",
  messagingSenderId: "123456789",
  appId: "1:123456789:web:abc123"
};
```

**Copy all these values!**

## Step 5: Update Your Code

1. Go to your GitHub repository
2. Open the file `src/firebase.ts`
3. Click the pencil icon to edit
4. Replace the placeholder values with your actual Firebase config:

```typescript
const firebaseConfig = {
  apiKey: "YOUR_ACTUAL_API_KEY",
  authDomain: "YOUR_PROJECT_ID.firebaseapp.com",
  projectId: "YOUR_PROJECT_ID",
  storageBucket: "YOUR_PROJECT_ID.appspot.com",
  messagingSenderId: "YOUR_ACTUAL_SENDER_ID",
  appId: "YOUR_ACTUAL_APP_ID"
};
```

5. Click **Commit changes**

## Step 6: Enable Firestore Database

1. Go back to Firebase Console
2. Click **Build** → **Firestore Database** in the left menu
3. Click **Create database**
4. Choose **Start in test mode** (for now - it's free and fine for personal use)
5. Click **Next**
6. Choose a location (any is fine)
7. Click **Enable**

## Step 7: Wait for Vercel to Redeploy

1. Vercel will automatically redeploy when you commit to GitHub
2. Wait about 1 minute
3. Refresh your app on all devices

## Done! ✅

Now your to-do list will sync across:
- Your phone
- Your desktop
- Any device you open it on

Add a task on your phone → it appears on your desktop instantly!

---

## Important Notes

**Free Tier Limits** (you won't come close to these):
- 50,000 reads/day
- 20,000 writes/day
- 1 GB storage

For a personal to-do app, this is essentially unlimited.

**Security**: Test mode is fine for personal use. If you make this public later, you can add security rules.

**Need help?** The Firebase config values are the only thing you need to copy from Firebase to your code.
