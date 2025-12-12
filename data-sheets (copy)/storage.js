// storage.js
const Storage = (() => {
  const KEY = "sheetData";

  function save(data) {
    localStorage.setItem(KEY, JSON.stringify(data));
    alert("Sheet saved!");
  }

  function load() {
    return JSON.parse(localStorage.getItem(KEY) || "{}");
  }

  return { save, load };
})();
