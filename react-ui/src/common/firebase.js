/* eslint-disable import/prefer-default-export */
import { initializeApp } from 'firebase/app';
import { initializeAppCheck, ReCaptchaV3Provider } from 'firebase/app-check';
import { getStorage, ref, uploadBytes } from 'firebase/storage';
import { nanoid } from 'nanoid';

const firebaseConfig = {
  apiKey: 'AIzaSyAV96xMFqykyH9HULiAG4qkx9bB53Gdogw',
  authDomain: 'vexillology-contests.firebaseapp.com',
  projectId: 'vexillology-contests',
  storageBucket: 'vexillology-contests.appspot.com',
  messagingSenderId: '917790372061',
  appId: '1:917790372061:web:27bdbeffebe44caf4d2b34',
  measurementId: 'G-DD6MTL11SP',
};

const app = initializeApp(firebaseConfig);

window.self.FIREBASE_APPCHECK_DEBUG_TOKEN = '9dbc94c4-785c-4142-8027-5e0af32338b6';
initializeAppCheck(app, {
  provider: new ReCaptchaV3Provider('6Le30RgkAAAAAIWgugIqeVv1VR7ObEzZi_BPpkaA'),
  isTokenAutoRefreshEnabled: true,
});

const storage = getStorage(app);

export const uploadFile = async (fileExt, file) => {
  const storageRef = ref(storage, `images/${nanoid()}.${fileExt}`);
  const snapshot = await uploadBytes(storageRef, file);
  return snapshot;
};
