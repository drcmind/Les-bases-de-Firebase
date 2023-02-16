// Inscrire l'utilisateur
const signupForm = document.querySelector(".signup");
signupForm.addEventListener("submit", (e) => {
  e.preventDefault();

  const email = signupForm.email.value;
  const password = signupForm.password.value;

  createUserWithEmailAndPassword(auth, email, password)
    .then((cred) => {
      console.log("user created:", cred.user);
      signupForm.reset();
    })
    .catch((err) => {
      console.log(err.message);
    });
});

// connexion et déconnexion
const loginForm = document.querySelector(".login");
loginForm.addEventListener("submit", (e) => {
  e.preventDefault();

  const email = loginForm.email.value;
  const password = loginForm.password.value;

  signInWithEmailAndPassword(auth, email, password)
    .then((cred) => {
      console.log("utilisateur connecté:", cred.user);
      loginForm.reset();
    })
    .catch((err) => {
      console.log(err.message);
    });
});

//Deconnexion
const logoutButton = document.querySelector(".logoutBtn");
logoutButton.addEventListener("click", () => {
  signOut(auth)
    .then(() => {
      console.log("utilisateur déconnecté");
    })
    .catch((err) => {
      console.log(err.message);
    });
});

const actionCodeSettings = {
  url: "http://localhost:5500/dist/index.html",
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
      console.log("mail envoyé à", email);
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
  // The client SDK will parse the code from the link for you.
  signInWithEmailLink(auth, email, window.location.href)
    .then((result) => {
      // Clear email from storage.
      console.log(result.user);
      window.localStorage.removeItem("emailForSignIn");
    })
    .catch((error) => {});
}

//Lier le compte avec un compte Google
const linkWithGoogleBtn = document.querySelector(".linkAccount");
linkWithGoogleBtn.addEventListener("click", () => {
  linkWithRedirect(auth.currentUser, new GoogleAuthProvider());
});

//Se connecter avec un compte Google
const signInGoogleBtn = document.querySelector(".googleLogin");
signInGoogleBtn.addEventListener("click", () => {
  signInWithRedirect(auth, new GoogleAuthProvider());
});

// subscription à l'état de la connexion utilisateur
onAuthStateChanged(auth, (user) => {
  console.log("Changement du status de l'utilisateur:", user);
});
