// utils.js
const Utils = {
  colToLetter: (col) => String.fromCharCode(65 + col),
  letterToCol: (letter) => letter.charCodeAt(0) - 65,
};
