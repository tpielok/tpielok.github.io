(function () {
  function readTheme() {
    try {
      var saved = localStorage.getItem("theme");
      return saved === "light" ? "light" : "dark";
    } catch (e) {
      return "dark";
    }
  }

  function writeTheme(theme) {
    try {
      localStorage.setItem("theme", theme);
    } catch (e) {}
  }

  function applyTheme(theme) {
    document.documentElement.setAttribute("data-theme", theme);
    var button = document.getElementById("theme-toggle");
    if (button) {
      button.textContent = theme === "dark" ? "Light mode" : "Dark mode";
      button.setAttribute("aria-label", "Switch to " + (theme === "dark" ? "light" : "dark") + " mode");
    }
  }

  function toggleTheme() {
    var current = document.documentElement.getAttribute("data-theme") === "light" ? "light" : "dark";
    var next = current === "dark" ? "light" : "dark";
    writeTheme(next);
    applyTheme(next);
  }

  document.addEventListener("DOMContentLoaded", function () {
    var button = document.createElement("button");
    button.id = "theme-toggle";
    button.className = "theme-toggle";
    button.type = "button";
    button.addEventListener("click", toggleTheme);
    document.body.appendChild(button);

    applyTheme(readTheme());
  });
})();
