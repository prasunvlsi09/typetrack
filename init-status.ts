import { initializeApp, cert, getApps, getApp } from "firebase-admin/app";
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

const db = getFirestore(getApp(), "ai-studio-de18491e-ad46-4c57-9988-26a4d31d2a9f");

async function init() {
  await db.collection('system').doc('status').set({
    server: 'Online',
    database: 'Connected'
  }, { merge: true });
  console.log('Done');
}

init();
