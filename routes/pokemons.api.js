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
    if (
      specialPokemonIndex === pokemons.length - 1 ||
      specialPokemonIndex === 0
    ) {
      result = [pokemons[pokemons.length - 1], pokemons[0], pokemons[1]];
    } else {
      result = [
        pokemons[parseInt(pokemonId) - 2],
        pokemons[parseInt(pokemonId) - 1],
        pokemons[parseInt(pokemonId)],
      ];
    }
    res.status(200).send(result);
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
    if (req.body.types.length > 1 && req.body.types.sort((a, b) => a - b)) {
      const exception = new Error(
        `Pokemon types must be different from each other.`
      );
      exception.statusCode = 401;
      throw exception;
    }
    for (let i = 0; i < req.body.types.length; i++) {
      if (!allowedType.find((el) => el === req.body.types[i])) {
        const exception = new Error(`Pokémon's type is invalid.`);
        exception.statusCode = 401;
        throw exception;
      }
    }
    const newPokemon = {
      name,
      id: String(id),
      url,
      types: types.filter(Boolean).map((type) => type.toLowerCase()),
      description,
      height,
      weight,
      categpry,
      abilities: abilities.filter(Boolean).map((type) => type.toLowerCase()),
    };
    console.log(newPokemon.id);
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
