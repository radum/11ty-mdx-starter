const path = require("path");

const config = path.resolve(path.join(__dirname, "tailwind.config.js"));

module.exports = {
  twin: {
    preset: "styled-components",
    config,
  },
};
