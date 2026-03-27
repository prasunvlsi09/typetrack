import { initializeApp, cert, getApps, getApp } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { getFirestore } from "firebase-admin/firestore";
import dotenv from "dotenv";

dotenv.config();

const projectId = process.env.FIREBASE_PROJECT_ID;
const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n');

initializeApp({
  credential: cert({
    projectId,
    clientEmail,
    privateKey,
  }),
});

const auth = getAuth();
const db = getFirestore(getApp(), "ai-studio-de18491e-ad46-4c57-9988-26a4d31d2a9f");

async function fixUsers() {
  let pageToken;
  do {
    const listUsersResult = await auth.listUsers(1000, pageToken);
    console.log(`Found ${listUsersResult.users.length} users in Auth`);
    for (const user of listUsersResult.users) {
      try {
        await db.collection('users').doc(user.uid).set({
          email: user.email,
          displayName: user.displayName || '',
          uid: user.uid
        }, { merge: true });
        console.log(`Updated ${user.email}`);
      } catch (e: any) {
        console.log(`Skipped ${user.email}:`, e.message);
      }
    }
    pageToken = listUsersResult.pageToken;
  } while (pageToken);
  console.log('Done fixing users.');
}

fixUsers();
