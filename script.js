const root = document.documentElement;
const themeToggle = document.querySelector(".theme-toggle");
const themeIcon = document.querySelector(".theme-icon");
const themeColor = document.querySelector('meta[name="theme-color"]');
const menuToggle = document.querySelector(".menu-toggle");
const navigation = document.querySelector(".nav-links");

function updateThemeControl() {
  const isDark = root.dataset.theme === "dark";
  const nextTheme = isDark ? "light" : "dark";
  themeIcon.textContent = isDark ? "☼" : "☾";
  themeToggle.setAttribute("aria-label", `Switch to ${nextTheme} mode`);
  themeToggle.title = `Switch to ${nextTheme} mode`;
  themeToggle.setAttribute("aria-pressed", String(isDark));
  themeColor.setAttribute("content", isDark ? "#171b19" : "#f3f2ec");
}

themeToggle.addEventListener("click", () => {
  root.dataset.theme = root.dataset.theme === "dark" ? "light" : "dark";
  try {
    localStorage.setItem("anas-theme", root.dataset.theme);
  } catch {}
  updateThemeControl();
});
updateThemeControl();

function closeNavigation() {
  navigation.classList.remove("is-open");
  menuToggle.setAttribute("aria-expanded", "false");
  menuToggle.setAttribute("aria-label", "Open navigation");
}

menuToggle.addEventListener("click", () => {
  const isOpen = menuToggle.getAttribute("aria-expanded") === "true";
  menuToggle.setAttribute("aria-expanded", String(!isOpen));
  menuToggle.setAttribute(
    "aria-label",
    isOpen ? "Open navigation" : "Close navigation",
  );
  navigation.classList.toggle("is-open", !isOpen);
});

document.addEventListener("keydown", (event) => {
  if (
    event.key === "Escape" &&
    menuToggle.getAttribute("aria-expanded") === "true"
  ) {
    closeNavigation();
    menuToggle.focus();
  }
});

window.addEventListener("resize", () => {
  if (window.matchMedia("(min-width: 641px)").matches) {
    closeNavigation();
  }
});

navigation
  .querySelectorAll("a")
  .forEach((link) => link.addEventListener("click", closeNavigation));
document.querySelector("#current-year").textContent = String(
  new Date().getFullYear(),
);

const filterButtons = document.querySelectorAll(".filter-button");
const projects = document.querySelectorAll(".project");
const projectStatus = document.querySelector("#project-status");
const projectMoreButton = document.querySelector("#project-more");
const projectMoreLabel = document.querySelector("#project-more-label");
const projectMoreIcon = document.querySelector(".project-more-icon");
let selectedProjectFilter = "all";
let projectsExpanded = false;

filterButtons.forEach((button) => {
  const filter = button.dataset.filter;
  const count =
    filter === "all"
      ? projects.length
      : [...projects].filter((project) =>
          project.dataset.categories.split(" ").includes(filter),
        ).length;
  const countLabel = button.querySelector("span");
  if (countLabel) countLabel.textContent = String(count);
});

function updateProjectVisibility() {
  const matchingProjects = [...projects].filter((project) => {
    return (
      selectedProjectFilter === "all" ||
      project.dataset.categories.split(" ").includes(selectedProjectFilter)
    );
  });
  const visibleProjects = projectsExpanded
    ? matchingProjects
    : matchingProjects.slice(0, 3);

  projects.forEach((project) => {
    project.hidden = !visibleProjects.includes(project);
  });

  projectMoreButton.hidden = matchingProjects.length <= 3;
  projectMoreButton.setAttribute("aria-expanded", String(projectsExpanded));
  projectMoreLabel.textContent = projectsExpanded
    ? "Show fewer projects"
    : `View ${matchingProjects.length - 3} more projects`;
  projectMoreIcon.textContent = projectsExpanded ? "↑" : "↓";

  const category =
    selectedProjectFilter === "all" ? "" : ` ${selectedProjectFilter}`;
  projectStatus.textContent =
    matchingProjects.length <= 3
      ? `Showing ${matchingProjects.length}${category} projects`
      : projectsExpanded
        ? `Showing all ${matchingProjects.length}${category} projects`
        : `Showing 3 of ${matchingProjects.length}${category} projects`;
}

projectMoreButton.addEventListener("click", () => {
  projectsExpanded = !projectsExpanded;
  updateProjectVisibility();
});

updateProjectVisibility();

filterButtons.forEach((button) => {
  button.addEventListener("click", () => {
    selectedProjectFilter = button.dataset.filter;
    projectsExpanded = false;

    filterButtons.forEach((filterButton) => {
      const isSelected = filterButton === button;
      filterButton.classList.toggle("is-active", isSelected);
      filterButton.setAttribute("aria-pressed", String(isSelected));
    });
    updateProjectVisibility();
  });
});

const copyEmailButton = document.querySelector(".copy-email");
const copyStatus = document.querySelector(".copy-status");

function fallbackCopy(text) {
  const buffer = document.createElement("textarea");
  buffer.value = text;
  buffer.setAttribute("readonly", "");
  buffer.setAttribute("aria-hidden", "true");
  buffer.tabIndex = -1;
  buffer.className = "clipboard-buffer";
  document.body.append(buffer);
  buffer.select();
  const copied = document.execCommand("copy");
  buffer.remove();
  copyEmailButton.focus();
  return copied;
}

copyEmailButton.addEventListener("click", async () => {
  const email = copyEmailButton.dataset.email;
  let copied = false;

  try {
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(email);
      copied = true;
    }
  } catch {
    copied = false;
  }

  if (!copied) {
    try {
      copied = fallbackCopy(email);
    } catch {
      copied = false;
    }
  }

  copyStatus.textContent = copied
    ? "Email copied to clipboard."
    : `Copy unavailable. Email: ${email}`;
});

const revealItems = document.querySelectorAll(".reveal");
if (
  "IntersectionObserver" in window &&
  !window.matchMedia("(prefers-reduced-motion: reduce)").matches &&
  document.visibilityState === "visible"
) {
  document.body.classList.add("motion-ready");
  const revealObserver = new IntersectionObserver(
    (entries, observer) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-visible");
          observer.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.12 },
  );
  revealItems.forEach((item) => revealObserver.observe(item));
}
