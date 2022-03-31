import { getAnalytics } from 'firebase/analytics';
import { initializeApp } from 'firebase/app';

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
const analytics = getAnalytics(app);

export default analytics;
