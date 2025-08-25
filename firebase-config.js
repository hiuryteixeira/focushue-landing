// Configuração Firebase
const firebaseConfig = {
  apiKey: "AIzaSyC60NDS13uLBH1Az1EW9sY3eEL8BF80Bxc",
  authDomain: "focushue-16683.firebaseapp.com",
  projectId: "focushue-16683",
  storageBucket: "focushue-16683.appspot.com",
  messagingSenderId: "485935414293",
  appId: "1:485935414293:web:c7ead918246319e0d6a21c"
};

// Inicializa Firebase
firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();
const db = firebase.firestore();
