const sharp = require("sharp");


function cropImage(files) {
  files.forEach((ob) => {
    sharp(`./public/uploads/${ob}`)
    .resize({
      width: 300,
      height: 300,
      fit: "inside",
      withoutEnlargement: true,
    })
    .toFile(`public/uploads/cropped_images/${ob}`, (err) => {
      if (!err) {
        console.log(`Cropping image ${ob}`);
      } else {
        throw err;
      }
    });
  });
}
module.exports = cropImage