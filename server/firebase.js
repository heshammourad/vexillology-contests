/**
 * Common firebase functions ???
 * @exports getDownloadUrl  entry image URL from firebase storage
 * @exports getToken create auth token for access to Firebase Storage
 */

const admin = require('firebase-admin');
const { cert } = require('firebase-admin/app');
const { getAuth } = require('firebase-admin/auth');
const { getStorage } = require('firebase-admin/storage');

const { FIREBASE_CLIENT_EMAIL, FIREBASE_PRIVATE_KEY } = process.env;

const LIFETIME = 60 * 24 * 60 * 60 * 1000; // 60 days -> milliseconds

admin.initializeApp({
  credential: cert({
    clientEmail: FIREBASE_CLIENT_EMAIL,
    privateKey: Buffer.from(FIREBASE_PRIVATE_KEY, 'base64').toString('ascii'),
    projectId: 'vexillology-contests',
  }),
});

const storage = getStorage();

exports.getDownloadUrl = async (image) => {
  try {
    const [downloadUrl] = await storage
      .bucket('vexillology-contests.appspot.com')
      .file(`images/${image}`)
      .getSignedUrl({ action: 'read', expires: Date.now() + LIFETIME });
    return downloadUrl;
  } catch (err) {
    return null;
  }
};

exports.getToken = async (uid) => {
  const token = await getAuth().createCustomToken(uid);
  return token;
};
