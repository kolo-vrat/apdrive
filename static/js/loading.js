const loadingOverlay = document.getElementById("loadingOverlay");
const container = document.querySelector("div.container");
const form_element = document.getElementById("registration-form");

if (form_element) {
    form_element.addEventListener("submit", () => {
        loadingOverlay.style.display = "flex";
        loadingOverlay.querySelector(".loading-animation").style.display = "flex";
        container.style["pointer-events"] = "none";
    });
}