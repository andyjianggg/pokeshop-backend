const { admin, db } = require("../util/admin");
const { validateSignupData, validateLoginData } = require("../util/validators");

const config = require("../util/config");

const firebase = require("firebase");
firebase.initializeApp(config);

exports.signup = (request, response) => {
  const newUser = {
    email: request.body.email,
    password: request.body.password,
    confirmPassword: request.body.confirmPassword,
    handle: request.body.handle,
    firstName: request.body.firstName,
    lastName: request.body.lastName,
  };

  const { valid, errors } = validateSignupData(newUser);

  if (!valid) return response.status(400).json(errors);

  let userToken, userId;
  db.doc(`/users/${newUser.handle}`)
    .get()
    .then((doc) => {
      if (doc.exists) {
        return response
          .status(400)
          .json({ handle: "this handle is already taken" });
      } else {
        return firebase
          .auth()
          .createUserWithEmailAndPassword(newUser.email, newUser.password);
      }
    })
    .then((data) => {
      userId = data.user.uid;
      return data.user.getIdToken();
    })
    .then((token) => {
      userToken = token;
      const userInfo = {
        handle: newUser.handle,
        email: newUser.email,
        firstName: newUser.firstName,
        lastName: newUser.lastName,
        createdAt: new Date().toISOString(),
        userId,
        userCredits: 0,
      };
      return db.doc(`/users/${newUser.handle}`).set(userInfo);
    })
    .then(() => {
      return response.status(201).json({ userToken });
    })
    .catch((error) => {
      console.error(error);
      if (error.code === "auth/email-already-in-use") {
        return response.status(400).json({ email: "email is already in use" });
      } else {
        return response
          .status(500)
          .json({ general: "Something went wrong, please try again" });
      }
    });
};

exports.login = (request, response) => {
  const user = {
    email: request.body.email,
    password: request.body.password,
  };

  const { valid, errors } = validateLoginData(user);

  if (!valid) return response.status(400).json(errors);

  firebase
    .auth()
    .signInWithEmailAndPassword(user.email, user.password)
    .then((data) => {
      return data.user.getIdToken();
    })
    .then((token) => {
      return response.json({ token });
    })
    .catch((error) => {
      console.error(error);
      if (error.code === "auth/wrong-password") {
        return response
          .status(403)
          .json({ general: "Wrong credentials, please try again" });
      } else if (error.code === "auth/user-not-found") {
        return response
          .status(403)
          .json({ general: "User does not exist, please try again" });
      } else {
        return response.status(500).json({ error: error.code });
      }
    });
};

exports.getCart = (request, response) => {
  db.collection("pokemon")
    .where("carts", "array-contains", request.user.handle)
    .get()
    .then((data) => {
      let pokemon = [];
      data.forEach((doc) => {
        pokemon.push({
          pokemonId: doc.id,
          ...doc.data(),
        });
      });
      return response.json(pokemon);
    })
    .catch((error) => {
      console.error(error);
      return response.status(500).json({ error: error.code });
    });
};

exports.getUser = (request, response) => {
  db.doc(`/users/${request.user.handle}`)
    .get()
    .then((doc) => {
      if (doc.exists) {
        return response.json(doc.data());
      }
    })
    .catch((error) => {
      console.error(error);
      return response.status(500).json({ error: error.code });
    });
};

exports.addCredits = (request, response) => {
  db.doc(`/users/${request.body.userHandle}`)
    .get()
    .then((doc) => {
      const userCredits = doc.data().userCredits + request.body.addCredits;
      db.doc(`/users/${request.body.userHandle}`).update({ userCredits });
    })
    .then(() => {
      return response.json({ message: "Credits added successfully " });
    })
    .catch((error) => {
      console.error(error);
      return response.status(500).json({ error: error.code });
    });
};

const refFromURL = (URL) => {
  return decodeURIComponent(URL.split("/").pop().split("?")[0]);
};

exports.checkout = (request, response) => {
  let totalCost = 0;
  db.collection("pokemon")
    .where("carts", "array-contains", request.user.handle)
    .get()
    .then((data) => {
      data.forEach((doc) => {
        totalCost = totalCost + doc.data().cost;
        const imageUrl = refFromURL(doc.data().imageUrl);
        admin.storage().bucket().file(imageUrl).delete();
        doc.ref.delete();
      });
    })
    .then(() => {
      const userDoc = db.doc(`/users/${request.user.handle}`);
      userDoc
        .get()
        .then((doc) => {
          if (doc.exists) {
            return doc.data().userCredits;
          } else {
            return response.status(400).json({ error: "user not found" });
          }
        })
        .then((res) => {
          const userCredits = res - totalCost;
          userDoc.update({ userCredits });
        })
        .catch((error) => {
          console.error(error);
          return response.status(500).json({ error: error.code });
        });
    })
    .then(() => {
      return response.json({ message: "pokemon checked out successfully" });
    })
    .catch((error) => {
      console.error(error);
      return response.status(500).json({ error: error.code });
    });
};
