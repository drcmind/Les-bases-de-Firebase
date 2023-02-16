import { initializeApp } from "firebase/app";
import {
  addDoc,
  collection,
  collectionGroup,
  deleteDoc,
  doc,
  getDocs,
  getFirestore,
  limit,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  where,
} from "firebase/firestore";

import {
  getAuth,
  signInWithRedirect,
  GoogleAuthProvider,
  onAuthStateChanged,
  signOut,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  sendSignInLinkToEmail,
  isSignInWithEmailLink,
  signInWithEmailLink,
  linkWithRedirect,
} from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyDqHhJnk0nXvv_3zBcMHfGsARbYKumQtMU",
  authDomain: "fir-demo-43043.firebaseapp.com",
  projectId: "fir-demo-43043",
  storageBucket: "fir-demo-43043.appspot.com",
  messagingSenderId: "564484237990",
  appId: "1:564484237990:web:3ebc24f9f9b0b089b16267",
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

//Initialisation des services
const db = getFirestore(app);
const auth = getAuth(app);

const utilisateurs = collection(db, "utilisateurs");
const citiesRef = collection(db, "Villes");

getDocs(citiesRef).then((snapshot) => {
  //rrécuper les données
});

// => Requête simple
//1. Récuperer les villes de la Rd Congo
const q1 = query(citiesRef, where("pays", "==", "Rd Congo"));

//2. Récuperer toutes les villes sauf celles de la RDC
const q2 = query(citiesRef, where("pays", "!=", "Rd Congo"));

//3 Récuperer seulement les villes de la RD Congo et celles du Rwanda
const q3 = query(citiesRef, where("pays", "in", ["Rd Congo", "Rwanda"]));

//4. Récuperer toutes les villes sauf 'Bujumbura', 'Gisenyi', 'Goma'
const q4 = query(
  citiesRef,
  where("ville", "not-in", ["Bujumbura", "Gisenyi", "Goma"])
);

//5. Récuperer les villes dont la population est superieure à 1M
const q5 = query(citiesRef, where("population", ">", 1000000));

//6. Récuperer toutes les villes ajoutées entre le 10 et 30 juillet 2022
// et Arrangez-les selon l'odre decroissant
const q6 = query(
  citiesRef,
  where(
    "dateDajout",
    ">",
    new Date("Jul 10, 2022"),
    where("dateDajout", "<", new Date("Jul 30, 2022")),
    orderBy("dateDajout", "desc")
  )
);

//7. Récuperer la ville avec comme commune 'Nyarugege'
const q7 = query(citiesRef, where("communes", "array-contains", "Nyarugenge"));

//8. Récuperer les villes avec comme commune 'Nyarugege', 'Bandale', 'Cyangugu', 'Ibanda'
const q8 = query(
  citiesRef,
  where("communes", "array-contains-any", [
    "Nyarugenge",
    "Bandale",
    "Cyangugu",
    "Ibanda",
  ])
);

//9. Récuperer les 3 dernieres villes recement ajoutées
const q9 = query(citiesRef, orderBy("dateDajout", "desc"), limit(3));

// => Reqêtes composées
//10.Récuperer toutes les villes de la RD Congo
//dont la population est inferieure à 3M
const q10 = query(
  citiesRef,
  where("pays", "==", "Rd Congo"),
  where("population", "<", 3000000)
);

// => Requêtes de groupe des collections
// Référence de la sous-collection (NB: ID unique pour les sous-collections)
const habitantsRef = collectionGroup(db, "habitants");

//11. Récuperer tous les habitants disponibles
const q11 = query(habitantsRef);

//12. Récuperer les habitants femins
const q12 = query(habitantsRef, where("sexe", "==", "F"));

//RealTime update
onSnapshot(q12, (snapshot) => {
  let villes = [];
  snapshot.docs.forEach((doc) => {
    villes.push({ ...doc.data(), id: doc.id });
  });
  console.log(villes);
});

//Ajouter un document
const addCityForm = document.querySelector(".ajouter");
addCityForm.addEventListener("submit", (e) => {
  e.preventDefault();

  //Ajouter un nouveau document avec un id généré
  addDoc(citiesRef, {
    pays: addCityForm.pays.value,
    ville: addCityForm.ville.value,
    capital: addCityForm.capital.value === "true" ? true : false,
    dateDajout: serverTimestamp(),
  }).then(() => addCityForm.reset());

  //Ajout du document avec un id personalisé
  /* setDoc(doc(db, "Villes", "KIN"), {
    pays: addCityForm.pays.value,
    ville: addCityForm.ville.value,
    capital: addCityForm.capital.value === "true" ? true : false,
    dateDajout: serverTimestamp(),
  }).then(() => addCityForm.reset()); */
});

//Suppression d'un document
const deleteCityForm = document.querySelector(".suppression");
deleteCityForm.addEventListener("submit", (e) => {
  e.preventDefault();

  const docRef = doc(db, "Villes", deleteCityForm.id.value);

  deleteDoc(docRef).then(() => deleteCityForm.reset());
});

//Modification d'un document
const updateCityForm = document.querySelector(".update");
updateCityForm.addEventListener("submit", (e) => {
  e.preventDefault();

  const docRef = doc(db, "Villes", updateCityForm.id.value);

  updateDoc(docRef, { ville: "La ville à jour, ok" }).then(() =>
    updateCityForm.reset()
  );
});

//Se connecter avec un compte Google
const signInGoogleBtn = document.querySelector(".googleLogin");
signInGoogleBtn.addEventListener("click", () => {
  signInWithRedirect(auth, new GoogleAuthProvider());
});

//Souscription a l'etat de la connexion de l'utilisateur
onAuthStateChanged(auth, (user) => {
  console.log("Changement du status de l'utilisateur:", user);
});

//Deconnexion de l'utilisateur
const logoutBtn = document.querySelector(".logout");
logoutBtn.addEventListener("click", () => {
  signOut(auth)
    .then(() => console.log("utilisateur deconnecté"))
    .catch((err) => console.log(err.message));
});

//Authentification sans password (avec le lien email)
const passwordLessForm = document.querySelector(".passwordless");
passwordLessForm.addEventListener("submit", (e) => {
  e.preventDefault();

  const email = passwordLessForm.email.value;

  const actionCodeSettings = {
    url: "http://localhost:5501/dist/index.html",
    handleCodeInApp: true,
  };

  sendSignInLinkToEmail(auth, email, actionCodeSettings)
    .then(() => {
      window.localStorage.setItem("emailForSign", email);
      console.log("mail envoyé a", email);
      passwordLessForm.reset();
    })
    .catch((error) => console.log(error.message));
});

if (isSignInWithEmailLink(auth, window.location.href)) {
  let email = window.localStorage.getItem("emailForSign");

  if (!email) {
    email = window.prompt("Veillez entrer votre email pour la confirmation");
  }

  signInWithEmailLink(auth, email, window.location.href)
    .then(() => {
      console.log("Connectez avec succès");
      window.localStorage.removeItem("emailForSign");
    })
    .catch((error) => console.log(error.message));
}

//Lier le compte avec un compte Google
const linkWithGoogleBtn = document.querySelector(".linkAccount");
linkWithGoogleBtn.addEventListener("click", () => {
  linkWithRedirect(auth.currentUser, new GoogleAuthProvider());
});
