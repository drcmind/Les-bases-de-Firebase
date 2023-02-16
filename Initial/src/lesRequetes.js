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
  where("dateDajout", ">", new Date("Jul 10, 2022")),
  where(
    "dateDajout",
    "<",
    new Date("Jul 20, 2022"),
    orderBy("dateDajout", "desc")
  )
);

//7. Récuperer la ville avec comme commune 'Nyarugege'
const q7 = query(citiesRef, where("communes", "array-contains", "Nyarugenge"));

//8. Récuperer les villes avec comme commune 'Nyarugege', 'Bandale', 'Cyangugu', 'Ibanda'
const q8 = query(
  citiesRef,
  where("communes", "array-contains-any", [
    "Nyarugege",
    "Bandale",
    "Cyangugu",
    "Ibanda",
  ])
);

//9. Récuperer les 3 dernieres villes recement ajoutées
const q9 = query(citiesRef, orderBy("dateDajout", "desc"), limit(3));

// => Reqêtes composées
//10.Récuperer toutes les villes de la RD Congo dont la population est inferieure à 3M
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
