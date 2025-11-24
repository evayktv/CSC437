document.addEventListener("DOMContentLoaded", () => {
  const darkModeLabel = document.querySelector(".dark-mode-toggle");
  const darkModeCheckbox = darkModeLabel?.querySelector(
    'input[type="checkbox"]'
  );

  if (!darkModeLabel || !darkModeCheckbox) {
    return;
  }

  const savedDarkMode = localStorage.getItem("darkMode") === "true";
  if (savedDarkMode) {
    document.body.classList.add("dark-mode");
    darkModeCheckbox.checked = true;
  }

  darkModeLabel.onchange = (event) => {
    event.stopPropagation();

    const customEvent = new CustomEvent("darkmode:toggle", {
      bubbles: true,
      detail: { checked: event.target.checked },
    });

    darkModeLabel.dispatchEvent(customEvent);
  };

  document.body.addEventListener("darkmode:toggle", (event) => {
    const isDarkMode = event.detail.checked;

    if (isDarkMode) {
      document.body.classList.add("dark-mode");
      localStorage.setItem("darkMode", "true");
    } else {
      document.body.classList.remove("dark-mode");
      localStorage.setItem("darkMode", "false");
    }
  });
});
