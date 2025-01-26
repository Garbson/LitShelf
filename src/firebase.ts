import { initializeApp } from 'firebase/app'
import { getAuth } from 'firebase/auth'
import { getFirestore } from 'firebase/firestore'

const firebaseConfig = {
  apiKey: 'AIzaSyAyaGaYcsdKzKjc3_o9aZ3mtq6PgU2ItHc',
  authDomain: 'litshelf-eec1a.firebaseapp.com',
  databaseURL: 'https://litshelf-eec1a-default-rtdb.firebaseio.com',
  projectId: 'litshelf-eec1a',
  storageBucket: 'litshelf-eec1a.firebasestorage.app',
  messagingSenderId: '56594606483',
  appId: '1:56594606483:web:50f202269537c229b9a066',
  measurementId: 'G-QPBTJT65RL',
}

const app = initializeApp(firebaseConfig)

const auth = getAuth(app)
const db = getFirestore(app)

export { auth, db }
