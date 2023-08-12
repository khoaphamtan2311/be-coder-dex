const express = require("express");
const crypto = require("crypto");
const router = express.Router();
const fs = require("fs");
const { faker } = require("@faker-js/faker");
const { type } = require("os");

router.get("/", (req, res, next) => {
  const allowedFilter = ["page", "limit", "type", "search"];
  try {
    let { page, limit, ...filterQuery } = req.query;
    page = parseInt(page) || 1;
    limit = parseInt(limit) || 10;
    console.log(req.query);
    const filterKeys = Object.keys(filterQuery);
    filterKeys.forEach((key) => {
      if (!allowedFilter.includes(key)) {
        const exception = new Error(`Query ${key} is not allowed`);
        exception.statusCode = 401;
        throw exception;
      }
      if (!filterQuery[key]) delete filterQuery[key];
    });
    let offset = limit * (page - 1);
    let db = fs.readFileSync("pokemons.json", "utf-8");
    db = JSON.parse(db);
    const { pokemons } = db;
    //Filter data by title
    let result = [];
    console.log("filterKeys", filterKeys);
    console.log("filterQuery", filterQuery);
    if (filterKeys.length) {
      filterKeys.forEach((condition) => {
        if (condition === "search") {
          result = pokemons.filter(
            (pokemon) => pokemon.name === filterQuery[condition]
          );
          console.log("result ", result);
        }
        if (condition === "type" && condition !== "search") {
          result = pokemons.filter((pokemon) =>
            pokemon.types.find((el) => el === filterQuery[condition])
          );
          console.log(result);
        }
      });
    } else {
      result = pokemons;
    }
    //then select number of result by offset
    const data = {
      count: result.length,
      data: result.slice(offset, offset + limit),
      totalPokemons: result.length,
    };

    res.status(200).send(data);
    //send response
  } catch (error) {
    next(error);
  }
});

router.get("/:pokemonId", (req, res, next) => {
  try {
    const { pokemonId } = req.params;
    let db = fs.readFileSync("pokemons.json", "utf-8");
    db = JSON.parse(db);
    const { pokemons } = db;
    let result = [];
    const specialPokemonIndex = pokemons.findIndex(
      (pokemon) => pokemon.id === pokemonId
    );
    console.log("specialPokemonIndex ", specialPokemonIndex);
    console.log("pokemon", pokemons.length);
    if (specialPokemonIndex === 0) {
      result = [pokemons[pokemons.length - 1], pokemons[0], pokemons[1]];
    } else if (specialPokemonIndex === pokemons.length - 1) {
      result = [
        pokemons[specialPokemonIndex - 1],
        pokemons[specialPokemonIndex],
        pokemons[0],
      ];
    } else {
      result = [
        pokemons[specialPokemonIndex - 1],
        pokemons[specialPokemonIndex],
        pokemons[specialPokemonIndex + 1],
      ];
    }
    const data = {
      data: {
        pokemon: result[1],
        nextPokemon: result[2],
        previousPokemon: result[0],
      },
    };
    res.status(200).send(data);
  } catch (error) {
    next(error);
  }
});

router.post("/", (req, res, next) => {
  let allowedType = [
    "bug",
    "dragon",
    "fairy",
    "fire",
    "ghost",
    "ground",
    "normal",
    "psychic",
    "steel",
    "dark",
    "electric",
    "fighting",
    "flying",
    "grass",
    "ice",
    "poison",
    "rock",
    "water",
  ];
  try {
    let {
      name,
      id,
      url,
      types,
      description,
      height,
      weight,
      categpry,
      abilities,
    } = req.body;
    console.log(req.body);
    let db = fs.readFileSync("pokemons.json", "utf-8");
    db = JSON.parse(db);
    const { pokemons } = db;
    if (!name || !id || req.body.types.length === 0 || !url) {
      console.log("missing");
      const exception = new Error(`Missing required data`);
      exception.statusCode = 401;
      throw exception;
    }
    if (
      typeof name !== "string" ||
      typeof url !== "string" ||
      typeof id !== "string" ||
      typeof url !== "string"
    ) {
      console.log("missing");
      const exception = new Error(`Wrong type of input`);
      exception.statusCode = 401;
      throw exception;
    }
    if (pokemons.find((el) => el.id === id)) {
      let a = 0;
      let randomId = 1;
      while (pokemons[a].id === String(randomId)) {
        randomId = faker.number.int(5000);
        a++;
      }
      const exception = new Error(
        `Please choose another Id, recommend ${randomId}`
      );
      exception.statusCode = 401;
      throw exception;
    }
    if (req.body.types.length > 2) {
      const exception = new Error(`Pokemon can only have one or two types.`);
      exception.statusCode = 401;
      throw exception;
    }
    // if (req.body.types.length > 1 && req.body.types.sort((a, b) => a - b)) {
    //   const exception = new Error(
    //     `Pokemon types must be different from each other.`
    //   );
    //   exception.statusCode = 401;
    //   throw exception;
    // }
    let newTypes = [];
    if (!types[1]) {
      console.log("right");
      newTypes = types.slice(0, 1);
    } else newTypes = [types[0], types[1]];
    console.log(newTypes);

    for (let i = 0; i < newTypes.length; i++) {
      if (!allowedType.find((el) => el === newTypes[i])) {
        const exception = new Error(`Pokémon's type is invalid.`);
        exception.statusCode = 401;
        throw exception;
      }
    }
    const newPokemon = {
      name,
      id: String(id),
      url,
      types: newTypes.map((type) => type.toLowerCase()),
      description,
      height,
      weight,
      categpry,
      abilities,
    };
    console.log(newPokemon);
    pokemons.push(newPokemon);
    db.pokemons = pokemons;
    db = JSON.stringify(db);
    fs.writeFileSync("pokemons.json", db);
    res.status(200).send(newPokemon);
  } catch (error) {
    next(error);
  }
});

router.put("/:id", (req, res, next) => {
  try {
    const allowUpdate = [
      "name",
      "url",
      "types",
      "description",
      "height",
      "weight",
      "categpry",
      "abilities",
    ];
    const { id } = req.params;
    const updates = req.body;
    const updateKeys = Object.keys(updates);
    const notAllow = updateKeys.filter((el) => !allowUpdate.includes(el));
    if (notAllow.length) {
      const exception = new Error(`Update field not allow`);
      exception.statusCode = 401;
      throw exception;
    }
    let db = fs.readFileSync("pokemons.json", "utf-8");
    db = JSON.parse(db);
    const { pokemons } = db;
    const targetIndex = pokemons.findIndex((pokemon) => pokemon.id === id);
    console.log(targetIndex);
    if (targetIndex < 0) {
      const exception = new Error(`Pokemon not found`);
      exception.statusCode = 404;
      throw exception;
    }
    const updatedPokemon = { ...db.pokemons[targetIndex], ...updates };
    db.pokemons[targetIndex] = updatedPokemon;
    console.log(db.pokemons[targetIndex]);
    db = JSON.stringify(db);
    //write and save to db.json
    fs.writeFileSync("pokemons.json", db);
    //put send response
    res.status(200).send(updatedPokemon);
  } catch (error) {
    next(error);
  }
});

router.delete("/:id", (req, res, next) => {
  try {
    const { id } = req.params;
    let db = fs.readFileSync("pokemons.json", "utf-8");
    db = JSON.parse(db);
    const { pokemons } = db;
    const targetIndex = pokemons.findIndex((pokemon) => pokemon.id === id);
    console.log(targetIndex);
    if (targetIndex < 0) {
      const exception = new Error(`Pokemon not found`);
      exception.statusCode = 404;
      throw exception;
    }
    db.pokemons = pokemons.filter((pokemon) => pokemon.id !== id);
    db = JSON.stringify(db);
    //write and save to db.json

    fs.writeFileSync("pokemons.json", db);
    //delete send response
    res.status(200).send({});
  } catch (error) {
    next(error);
  }
});
module.exports = router;
