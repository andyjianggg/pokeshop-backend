const functions = require("firebase-functions");

const app = require("express")();

const userAuth = require("./util/userAuth");

const {
  getAllPokemon,
  addOnePokemon,
  uploadImage,
  getPokemonByType,
  getPokemonByRegion,
  addToCart,
  removeFromCart,
  searchPokemon,
} = require("./handlers/pokemon");

const {
  signup,
  login,
  getCart,
  getUser,
  addCredits,
  checkout,
} = require("./handlers/users");

// pokemon routes
app.get("/pokemon", getAllPokemon);
app.get("/pokemon/type/:type", getPokemonByType);
app.get("/pokemon/region/:region", getPokemonByRegion);
app.get("/pokemon/search", searchPokemon);
app.post("/pokemon", userAuth, addOnePokemon);
app.post("/pokemon/:pokemonId/image", userAuth, uploadImage);
app.post("/pokemon/:pokemonId/addCart", userAuth, addToCart);
app.post("/pokemon/:pokemonId/removeCart", userAuth, removeFromCart);

// users routes
app.post("/signup", signup);
app.post("/login", login);
app.get("/user/cart", userAuth, getCart);
app.get("/user", userAuth, getUser);
app.post("/user/addCredits", userAuth, addCredits);
app.post("/user/checkout", userAuth, checkout);

exports.api = functions.https.onRequest(app);
