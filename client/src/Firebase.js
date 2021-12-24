import firebase from 'firebase'

const firebaseConfig = {
  apiKey: "AIzaSyBmO9mfJZNxa-on-JheID021gEzTCfkgpA",
  authDomain: "chatapp-e2bfc.firebaseapp.com",
  projectId: "chatapp-e2bfc",
  storageBucket: "chatapp-e2bfc.appspot.com",
  messagingSenderId: "1088142747540",
  appId: "1:1088142747540:web:f63dfd0a04809699ea9181"
};

firebase.initializeApp(firebaseConfig);

const auth = firebase.auth();
const provider = new firebase.auth.GoogleAuthProvider();


export { auth, provider };