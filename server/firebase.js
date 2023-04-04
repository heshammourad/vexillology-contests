const admin = require('firebase-admin');
const { cert } = require('firebase-admin/app');
const { getAuth } = require('firebase-admin/auth');

const { FIREBASE_CLIENT_EMAIL, FIREBASE_PRIVATE_KEY } = process.env;

admin.initializeApp({
  credential: cert({
    clientEmail: FIREBASE_CLIENT_EMAIL,
    privateKey: Buffer.from(FIREBASE_PRIVATE_KEY, 'base64').toString('ascii'),
    projectId: 'vexillology-contests',
  }),
});

exports.getToken = async (uid) => {
  const token = await getAuth().createCustomToken(uid);
  return token;
};
