const openSidebar = document.getElementById("openSidebar");
const closeSidebar = document.getElementById("closeSidebar");
const sidebar = document.getElementById("sidebar");
const overlay = document.getElementById("overlay");
const app = document.getElementById("app");

function showSidebar() {
  sidebar.classList.add("open");
  overlay.classList.add("show");
  app.classList.add("blur");
}

function hideSidebar() {
  sidebar.classList.remove("open");
  overlay.classList.remove("show");
  app.classList.remove("blur");
}

openSidebar.addEventListener("click", showSidebar);
closeSidebar.addEventListener("click", hideSidebar);
overlay.addEventListener("click", hideSidebar);
