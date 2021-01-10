const { admin, db } = require("../util/admin");

const config = require("../util/config");

exports.getAllPokemon = (request, response) => {
  db.collection("pokemon")
    .orderBy("pokedexId")
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

exports.addOnePokemon = (request, response) => {
  const defaultImg = "question_mark.png";
  const newPokemon = {
    name: request.body.name,
    type1: request.body.type1,
    nature: request.body.nature,
    region: request.body.region,
    cost: request.body.cost,
    pokedexId: request.body.pokedexId,
    ownerHandle: request.user.handle,
    carts: [],
    imageUrl: `https://firebasestorage.googleapis.com/v0/b/${config.storageBucket}/o/${defaultImg}?alt=media`,
  };
  db.collection("pokemon")
    .add(newPokemon)
    .then((doc) => {
      response.json({ pokemonId: doc.id });
    })
    .catch((error) => {
      response.status(500).json({ error: "something went wrong" });
      console.error(error);
    });
};

exports.uploadImage = (request, response) => {
  const BusBoy = require("busboy");
  const path = require("path");
  const os = require("os");
  const fs = require("fs");

  const busboy = new BusBoy({ headers: request.headers });

  let imageFileName;
  let imageToBeUploaded;

  busboy.on("file", (fieldname, file, filename, encoding, mimetype) => {
    if (mimetype !== "image/jpeg" && mimetype !== "image/png") {
      return response.status(400).json({ error: "Wrong file type submitted" });
    }
    const imageExtension = filename.split(".")[filename.split(".").length - 1];
    imageFileName = `${Math.round(
      Math.random() * 100000000000000
    )}.${imageExtension}`;
    const filepath = path.join(os.tmpdir(), imageFileName);
    imageToBeUploaded = { filepath, mimetype };
    file.pipe(fs.createWriteStream(filepath));
  });
  busboy.on("finish", () => {
    admin
      .storage()
      .bucket()
      .upload(imageToBeUploaded.filepath, {
        resumable: false,
        metadata: {
          metadata: {
            contentType: imageToBeUploaded.mimetype,
          },
        },
      })
      .then(() => {
        const imageUrl = `https://firebasestorage.googleapis.com/v0/b/${config.storageBucket}/o/${imageFileName}?alt=media`;
        db.doc(`/pokemon/${request.params.pokemonId}`).update({ imageUrl });
      })
      .then(() => {
        return response.json({ message: "Image uploaded successfully" });
      })
      .catch((error) => {
        console.error(error);
        return response.status(500).json({ error: error.code });
      });
  });
  busboy.end(request.rawBody);
};

exports.getPokemonByType = (request, response) => {
  db.collection("pokemon")
    .where("type1", "==", request.params.type)
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
    .catch((error) => console.error(error));
};

exports.getPokemonByRegion = (request, response) => {
  db.collection("pokemon")
    .where("region", "==", request.params.region)
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
    .catch((error) => console.error(error));
};

exports.addToCart = (request, response) => {
  db.doc(`/pokemon/${request.params.pokemonId}`)
    .get()
    .then((doc) => {
      const docData = doc.data();
      let carts = docData.carts.includes(request.user.handle)
        ? docData.carts
        : [...docData.carts, request.user.handle];
      db.doc(`/pokemon/${request.params.pokemonId}`).update({ carts });
    })
    .then(() => {
      return response.json({ message: "Pokemon added to cart successfully" });
    })
    .catch((error) => {
      console.error(error);
      return response.status(500).json({ error: error.code });
    });
};

exports.removeFromCart = (request, response) => {
  db.doc(`/pokemon/${request.params.pokemonId}`)
    .get()
    .then((doc) => {
      let carts = doc.data().carts;
      const index = carts.indexOf(request.user.handle);
      if (index > -1) {
        carts.splice(index, 1);
      }
      db.doc(`/pokemon/${request.params.pokemonId}`).update({ carts });
    })
    .then(() => {
      return response.json({
        message: "Pokemon removed from cart successfully",
      });
    })
    .catch((error) => {
      console.error(error);
      return response.status(500).json({ error: error.code });
    });
};

exports.searchPokemon = (request, response) => {
  const firstLetter = request.query.name.charAt(0).toUpperCase();
  const searchKey = firstLetter + request.query.name.substring(1);
  db.collection("pokemon")
    .where("name", ">=", searchKey)
    .where("name", "<=", searchKey + "\uf8ff")
    .orderBy("name")
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
    .catch((error) => console.error(error));
};
