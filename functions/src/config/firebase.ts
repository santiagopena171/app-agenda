import * as admin from 'firebase-admin';

// Initialize Firebase Admin
if (!admin.apps.length) {
  admin.initializeApp();
}

const db = admin.firestore();
const auth = admin.auth();

// Configure Firestore settings
db.settings({
  timestampsInSnapshots: true,
});

export { admin, db, auth };
