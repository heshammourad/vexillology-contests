/* eslint-disable import/prefer-default-export */
import { initializeApp } from 'firebase/app';
import { initializeAppCheck, ReCaptchaV3Provider } from 'firebase/app-check';
import { getAuth, signInWithCustomToken } from 'firebase/auth';
import {
  getDownloadURL, getStorage, ref, uploadBytes,
} from 'firebase/storage';
import { customAlphabet, urlAlphabet } from 'nanoid';

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

initializeAppCheck(app, {
  provider: new ReCaptchaV3Provider('6LdVdzMlAAAAACClyDjipqu8966AvQBm_Eb5gNuE'),
  isTokenAutoRefreshEnabled: true,
});

const auth = getAuth();
const storage = getStorage(app);

const nanoid = customAlphabet(urlAlphabet.replace(/[-_]/, ''), 8);

const signIn = async (token) => {
  try {
    await signInWithCustomToken(auth, token);
  } catch (error) {
    // TODO: Handle error
    return false;
  }
  return true;
};

export const uploadFile = async (token, file) => {
  try {
    const signedIn = await signIn(token);
    if (!signedIn) {
      return null;
    }

    const fileExt = file.name.split('.').pop();
    const storageRef = ref(storage, `images/${nanoid()}.${fileExt}`);
    await uploadBytes(storageRef, file);

    const url = await getDownloadURL(storageRef);
    return url;
  } catch (error) {
    // TODO: Handle error
  }
  return null;
};
