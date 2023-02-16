import { MDCDialog } from "@material/dialog";
import { initializeApp } from "firebase/app";
import {
  getFirestore,
  onSnapshot,
  deleteDoc,
  doc,
  query,
  where,
  orderBy,
  serverTimestamp,
  setDoc,
  collectionGroup,
  getDoc,
  enableMultiTabIndexedDbPersistence,
} from "firebase/firestore";

import {
  getAuth,
  isSignInWithEmailLink,
  signInWithEmailLink,
  GoogleAuthProvider,
  linkWithRedirect,
  signInWithRedirect,
  signOut,
  onAuthStateChanged,
  sendSignInLinkToEmail,
} from "firebase/auth";

import {
  deleteObject,
  getDownloadURL,
  getStorage,
  ref,
  uploadBytes,
} from "firebase/storage";

const firebaseConfig = {
  apiKey: "AIzaSyAKiBFZThWivg81dsXUS9D8d-K849mHEKE",
  authDomain: "fir-demo-97317.firebaseapp.com",
  projectId: "fir-demo-97317",
  storageBucket: "fir-demo-97317.appspot.com",
  messagingSenderId: "872739170878",
  appId: "1:872739170878:web:f3e13d72749de28f0c7f6f",
};

//initialisation de Firebase
const app = initializeApp(firebaseConfig);

// inilisation de service Firestore et Authentification
const db = getFirestore(app);
const auth = getAuth(app);
const storage = getStorage();

enableMultiTabIndexedDbPersistence(db);

// Référence de la collection
const citiesRef = collectionGroup(db, "villes");
const citiesQuery = query(citiesRef, orderBy("dateDajout", "desc"));

//Enregistrement des données de l'utilisateur
const newUser = ({ email, uid }) => {
  const userRef = doc(db, "utilisateurs", uid);
  setDoc(userRef, { email, uid }, { merge: true });
};

//Observer les données en temps réel
const cityItemContainer = document.querySelector(".city-item-container");
let villes = [];

onSnapshot(citiesQuery, (snapshot) => {
  villes = snapshot.docs.map((d) => {
    const isOffLine = d.metadata.hasPendingWrites;
    return { isOffLine, ...d.data() };
  });

  let city = "";

  villes.forEach((ville) => {
    city += `<a class="city-card mdc-card mdc-card--outlined" href="detail.html?data=${
      ville.cityID
    }" style="opacity: ${ville.isOffLine === true ? "0.5" : "1"}">
    
    ${
      ville.cityImgUrl
        ? `<img
          src="${ville.cityImgUrl}"
          class="image-thubnail"
        />`
        : ""
    }
    
    <h1 class="city-title">${ville.ville}</h1>
          <h4 class="city-country">${
            ville.capital === true ? "La capitale de " : "Pays: "
          } ${ville.pays}</h4>
          <p class="city-population">Population: ${ville.population}</p>
          <p class="city-publisher">Postée par ${
            ville.user?.uid === auth.currentUser.uid
              ? "vous"
              : ville.user?.email
          }
          </p>
          <p class="city-population">Ajoutée le : ${getFormatedDate(
            ville.dateDajout
          )}</p>
    </a>
 `;
  });
  cityItemContainer.innerHTML = city;
});

let cityImgUrl = "";
const addCityForm = document.querySelector(".set-city");
const setCityForm = async (docCityID, dialog) => {
  //Ajouter document "ville" dans une sous-collection de la collection "utilisateurs"
  addCityForm.addEventListener("submit", (e) => {
    e.preventDefault();

    const newDocID = String(addCityForm.ville.value)
      .toLocaleLowerCase()
      .replace(/\s+/g, "");
    const cityID = docCityID === "nouvelle-ville" ? newDocID : docCityID;
    const user = auth.currentUser;
    const usersCityRef = `utilisateurs/${user.uid}/villes`;
    const userCityDocRef = doc(db, usersCityRef, cityID);

    const pays = addCityForm.pays.value;
    const ville = addCityForm.ville.value;
    const population = Number(addCityForm.population.value);
    const capital = addCityForm.capital.value === "true" ? true : false;

    setDoc(userCityDocRef, {
      cityID,
      pays,
      ville,
      population,
      capital,
      cityImgUrl,
      dateDajout: serverTimestamp(),
      user: {
        email: user.email,
        uid: user.uid,
      },
    });

    addCityForm.reset();

    window.localStorage.removeItem("pathReference");

    if (docCityID === "nouvelle-ville") dialog.close();
  });
};

//Effacer un document
const deteCityDoc = (userID) => {
  const cityIdInStore = window.localStorage.getItem("cityID");
  if (cityIdInStore) {
    const usersCityRef = `utilisateurs/${userID}/villes`;
    deleteDoc(doc(db, usersCityRef, cityIdInStore));
    window.localStorage.removeItem("cityID");
  }
};

const getFormatedDate = (date) => {
  const formatedDate = new Intl.DateTimeFormat("fr").format(
    date ? date.toDate() : new Date()
  );
  return formatedDate;
};

//téléchargement de l'image vers Cloud Storage
const uploadImgToStorage = async (file) => {
  const filePath = `images/${Date.now()}`;
  const pathReference = ref(storage, filePath);
  const uploadTask = await uploadBytes(pathReference, file);
  window.localStorage.setItem("pathReference", uploadTask.ref.fullPath);
  return await getDownloadURL(pathReference);
};

const isOnline = async () => {
  try {
    await fetch("https://jsonplaceholder.typicode.com/todos/1");
    return true;
  } catch (error) {
    return false;
  }
};

const ImgSection = document.querySelector(".image-section");

const submitBtn = document.querySelector(".submit-btn");
const imgProcessIndicator = document.querySelector(".img-progress-indicator");
const imagePreview = document.querySelector(".image-preview");
const inputImage = document.querySelector(".image-input");
imgProcessIndicator.style.display = "none";
imagePreview.style.display = "none";

inputImage.addEventListener("change", async (e) => {
  const file = e.target.files[0];
  submitBtn.disabled = true;

  try {
    if (cityImgUrl) await deleteImgToStorage();
    imgProcessIndicator.style.display = "";
    cityImgUrl = await uploadImgToStorage(file);
    imagePreview.style.display = "";
    imgProcessIndicator.style.display = "none";
    imagePreview.setAttribute("src", cityImgUrl);
    submitBtn.disabled = false;
  } catch (error) {
    cityImgUrl = "";
    imgProcessIndicator.innerHTML = "Une erreur s'est produite";
    submitBtn.disabled = false;
  }
});

const deleteImgToStorage = async () => {
  const pathReference = window.localStorage.getItem("pathReference");
  const fileRef = ref(storage, pathReference);
  imgProcessIndicator.style.display = "";
  imagePreview.style.display = "none";
  addCityForm.reset();
  return await deleteObject(fileRef);
};

if (
  !window.location.search.replace("?data=", "") ||
  location.href.includes("?apiKey=")
) {
  const dialog = new MDCDialog(document.querySelector(".mdc-dialog"));

  const addBtn = document.querySelector(".addBtn");
  addBtn.addEventListener("click", () => dialog.open());

  dialog.listen("MDCDialog:opened", async () => {
    const hasConnection = await isOnline();
    hasConnection
      ? (ImgSection.style.display = "")
      : (ImgSection.style.display = "none");
  });

  const cancelBtn = document.querySelector(".cancel-btn");
  cancelBtn.addEventListener("click", async () => {
    if (cityImgUrl) await deleteImgToStorage();
  });

  //Ajouter nouvelle ville
  setCityForm("nouvelle-ville", dialog);

  const actionCodeSettings = {
    url: window.location.href,
    handleCodeInApp: true,
  };

  //Connexion sans password (avec lien email)
  const passWordLessForm = document.querySelector(".passwordless");
  passWordLessForm.addEventListener("submit", (e) => {
    e.preventDefault();
    const email = passWordLessForm.email.value;

    sendSignInLinkToEmail(auth, email, actionCodeSettings)
      .then(() => {
        window.localStorage.setItem("emailForSignIn", email);
        passWordLessForm.reset();
      })
      .catch((error) => {
        const errorCode = error.code;
        const errorMessage = error.message;
        console.log(errorCode, errorMessage);
      });
  });

  if (isSignInWithEmailLink(auth, window.location.href)) {
    let email = window.localStorage.getItem("emailForSignIn");

    if (!email) {
      email = window.prompt("Please provide your email for confirmation");
    }

    signInWithEmailLink(auth, email, window.location.href)
      .then(() => {
        //Lier le compte avec un compte Google
        window.localStorage.removeItem("emailForSignIn");
        linkWithRedirect(auth.currentUser, new GoogleAuthProvider());
      })
      .catch((error) => console.log(error));
  }

  //Se connecter avec un compte Google
  const signInGoogleBtn = document.querySelector(".googleLogin");
  signInGoogleBtn.addEventListener("click", () => {
    signInWithRedirect(auth, new GoogleAuthProvider());
  });
} else {
  //detail page
  const cityID = window.location.search.replace("?data=", "");
  const queryDoc = query(citiesRef, where("cityID", "==", cityID));

  onSnapshot(queryDoc, (snapshot) => {
    const villes = snapshot.docs.map((d) => d.data());
    const cityItemContainer = document.querySelector(".city-card");

    cityItemContainer.innerHTML = `
    ${
      villes[0].cityImgUrl
        ? `<a href="${villes[0].cityImgUrl}"><img
          src="${villes[0].cityImgUrl}"
          class="image-thubnail"
        /><a/>`
        : ""
    }
        <h1 class="city-title">${villes[0].ville}</h1>
        <h4 class="city-country">${
          villes[0].capital === true ? "La capitale de " : "Pays: "
        } ${villes[0].pays}</h4>
        <p class="city-population">Poupulation: ${villes[0].population}</p>
        <p class="city-publisher">Postée par ${
          villes[0].user?.uid === auth.currentUser.uid
            ? "vous"
            : villes[0].user?.email
        }
        </p>
        <p class="city-population">Ajoutée le: ${getFormatedDate(
          villes[0].dateDajout
        )}
        </p>
        <a class="delete-btn mdc-button mdc-button--raised">
          <span class="mdc-button__label">Supprimer cette ville</span>
        <a/>
       `;

    const deleteBtn = document.querySelector(".delete-btn");
    const editBtn = document.querySelector(".edit-btn");
    const addCityForm = document.querySelector(".set-city");
    const isUserOwner = villes[0].user?.uid === auth.currentUser.uid;
    deleteBtn.style.display = isUserOwner ? "" : "none";
    addCityForm.style.display = isUserOwner ? "" : "none";

    deleteBtn.addEventListener("click", () => {
      window.localStorage.setItem("cityID", cityID);
      location.assign(`${location.origin}/dist/index.html`);
    });

    //Modification de la ville
    editBtn.addEventListener("click", () => {
      setCityForm(cityID);
      imagePreview.style.display = "none";
    });
  });
}

//Le changement d'etat de l'interface (connexion/deconnexion)
const isLogInToolBar = document.querySelector(".isLogIn-toolbar");
const isLogInHome = document.querySelector(".isLogIn-home");
const isLogOut = document.querySelector(".isLogOut");
isLogInToolBar.style.display = "none";
isLogInHome.style.display = "none";
isLogOut.style.display = "none";

const userEmail = document.querySelector(".current-user");

// subscription à l'état de la connexion utilisateur
onAuthStateChanged(auth, async (user) => {
  if (user) {
    //state
    isLogInToolBar.style.display = "";
    isLogInHome.style.display = "";
    isLogOut.style.display = "none";
    userEmail.innerHTML = `${user.email}`;

    //Suppression d'une ville
    deteCityDoc(user.uid);

    //ajout de nouveau utilisateur dans la bdd
    const userDocRef = doc(db, "utilisateurs", `${user.uid}`);
    const userDoc = await getDoc(userDocRef);
    if (!userDoc.exists()) newUser(user);
  } else {
    isLogInToolBar.style.display = "none";
    isLogInHome.style.display = "none";
    isLogOut.style.display = "";
  }
});

//Deconnexion
const logoutButton = document.querySelector(".logoutBtn");
logoutButton.addEventListener("click", () => signOut(auth));
