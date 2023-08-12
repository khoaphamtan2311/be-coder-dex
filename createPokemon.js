const fs = require("fs");
const csv = require("csvtojson");
const cloudinary = require("cloudinary").v2;
// require("dotenv").config();
// const BASE_URL = "http://localhost:8000";
cloudinary.config({
  cloud_name: "djwwymlhz",
  api_key: "811578495881492",
  api_secret: "J3_hnbbwh06am3w50Gv_O9kAdpM",
  secure: true,
});

// cloudinary.uploader.upload;
// let imageUrl = "";
// const img = fs.readdirSync("./images/images");
const createPokemon = async () => {
  let newData = await csv().fromFile("pokemon.csv");
  //   newData = newData.filter((e) => {
  //     const imgName = e.Name + ".png";
  //     return img.includes(imgName);
  //   });

  let imgData = newData;
  newData = new Set(newData.map((e) => e));
  newData = Array.from(newData);
  imgData = new Set(imgData.map((e) => e.Name));
  imgData = Array.from(imgData);
  let imageData = [];
  for (let i = 0; i < imgData.length; i++) {
    let dir = `./images/images/${imgData[i]}.png`;
    if (dir) {
      let url = await cloudinary.uploader
        .upload(dir)
        .then((result) => result.url)
        .catch((err) => console.log(err.message));
      imageData = [...imageData, { name: imgData[i], imgUrl: url }];
      console.log(imageData.length);
    }
  }

  newData = newData
    .map((e, index) => {
      let found = imageData.find((el) => el.name === e.Name);
      return {
        id: (index + 1).toString(),
        name: e.Name,
        types: [e.Type1, e.Type2]
          .filter(Boolean)
          .map((type) => type.toLowerCase()),
        url: found?.imgUrl,
      };
    })
    .filter((e) => e.url);

  console.log("newData", newData);
  let data = JSON.parse(fs.readFileSync("pokemons.json"));
  data.pokemons = newData;
  fs.writeFileSync("pokemons.json", JSON.stringify(data));
  console.log("done");
};

createPokemon();
// createImgData();
// uploadImg("pikachu");
