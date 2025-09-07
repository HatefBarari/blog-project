const fs = require("fs");
const path = require("path");

/**
 * Deletes specified files from the server.
 * @param {Object} files - An object containing files to be deleted.
 * @param {string} coverPath - The path to the directory containing cover files.
 * @param {string} imagesPath - The path to the directory containing image files.
 */
const deleteFiles = (files, coverPath, imagesPath) => {
  try {
    // حذف کاور
    if (files.cover && files.cover.length > 0) {
      const coverFilePath = path.join(coverPath, files.cover[0].filename);
      if (fs.existsSync(coverFilePath)) {
        fs.unlinkSync(coverFilePath);
      }
    }

    // حذف تصاویر
    if (files.images) {
      files.images.forEach((image) => {
        const imageFilePath = path.join(imagesPath, image.filename);
        if (fs.existsSync(imageFilePath)) {
          fs.unlinkSync(imageFilePath);
        }
      });
    }
  } catch (error) {
    console.error("Error deleting files:", error);
  }
};

module.exports = { deleteFiles };
