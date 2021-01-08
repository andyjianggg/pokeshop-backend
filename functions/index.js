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
  checkout,
} = require("./handlers/pokemon");
const { signup, login, getCart } = require("./handlers/users");

// pokemon routes
app.get("/pokemon", getAllPokemon);
app.get("/pokemon/type/:type", getPokemonByType);
app.get("/pokemon/region/:region", getPokemonByRegion);
app.get("/pokemon/search", searchPokemon);
app.post("/pokemon", userAuth, addOnePokemon);
app.post("/pokemon/:pokemonId/image", userAuth, uploadImage);
app.post("/pokemon/:pokemonId/addCart", userAuth, addToCart);
app.post("/pokemon/:pokemonId/removeCart", userAuth, removeFromCart);
// app.post('/pokemon/checkout', userAuth, checkout);

// users routes
app.post("/signup", signup);
app.post("/login", login);
app.get("/user/cart", userAuth, getCart);

exports.api = functions.https.onRequest(app);
