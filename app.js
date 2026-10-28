/* ScreenLog frontend preview.
 * This file deliberately uses local sample data only. No Apps Script URL,
 * credentials, spreadsheet writes, or network requests are present.
 */
(() => {
  "use strict";

  const SAMPLE_ENTRIES = [
    { title: "Paatal Lok S2", type: "Series", language: "Hindi", startDate: "2025-01-25", endDate: "2025-01-29", rating: 7.5, watchTime: 420, genre: "Thriller, Crime", observations: "", timestamp: "2025-12-16T20:03:13" },
    { title: "12th Fail", type: "Movie", language: "Hindi", startDate: "2025-01-18", endDate: "2025-01-18", rating: 8.5, watchTime: 147, genre: "Drama", observations: "An inspiring story.", timestamp: "2025-12-15T19:20:00" },
    { title: "The Family Man S2", type: "Series", language: "Hindi", startDate: "2024-12-12", endDate: "2024-12-20", rating: 8, watchTime: 480, genre: "Action, Thriller", observations: "", timestamp: "2025-12-12T18:15:00" },
    { title: "Jigarthanda DoubleX", type: "Movie", language: "Tamil", startDate: "2024-12-06", endDate: "2024-12-06", rating: 8, watchTime: 172, genre: "Action, Drama", observations: "", timestamp: "2025-12-06T21:30:00" },
    { title: "Aavesham", type: "Movie", language: "Malayalam", startDate: "2024-11-23", endDate: "2024-11-23", rating: 7.5, watchTime: 158, genre: "Action, Comedy", observations: "", timestamp: "2025-11-23T20:00:00" },
    { title: "Suzhal: The Vortex", type: "Series", language: "Tamil", startDate: "2024-11-02", endDate: "2024-11-06", rating: 8, watchTime: 360, genre: "Mystery, Thriller", observations: "", timestamp: "2025-11-06T19:00:00" },
    { title: "Super Deluxe", type: "Movie", language: "Tamil", startDate: "2024-10-18", endDate: "2024-10-18", rating: 8.5, watchTime: 176, genre: "Drama, Thriller", observations: "", timestamp: "2025-10-18T21:00:00" },
    { title: "Kumbalangi Nights", type: "Movie", language: "Malayalam", startDate: "2024-10-03", endDate: "2024-10-03", rating: 8, watchTime: 135, genre: "Drama", observations: "", timestamp: "2025-10-03T19:00:00" }
  ];

  const MONTHS = [
    { month: "Jan", hours: 25 }, { month: "Feb", hours: 32 },
    { month: "Mar", hours: 20 }, { month: "Apr", hours: 39 },
    { month: "May", hours: 27 }, { month: "Jun", hours: 44 },
    { month: "Jul", hours: 31 }, { month: "Aug", hours: 36 },
    { month: "Sep", hours: 28 }, { month: "Oct", hours: 41 },
    { month: "Nov", hours: 34 }, { month: "Dec", hours: 38 }
  ];

  // Session-only preview data: refresh resets any entries added during preview.
  let entries = SAMPLE_ENTRIES.map(entry => ({ ...entry }));
  let pendingEntry = null;
  let toastTimer = null;

  const $ = (selector) => document.querySelector(selector);
  const $$ = (selector) => Array.from(document.querySelectorAll(selector));

  function escapeHtml(value) {
    return String(value ?? "").replace(/[&<>"']/g, char => ({
      "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
    }[char]));
  }

  function formatDate(value) {
    if (!value) return "—";
    const date = new Date(`${value}T00:00:00`);
    if (Number.isNaN(date.getTime())) return "—";
    return new Intl.DateTimeFormat("en-IN", { day: "2-digit", month: "short", year: "numeric" }).format(date);
  }

  function formatMinutes(minutes) {
    const safeMinutes = Math.max(0, Number(minutes) || 0);
    const hours = Math.floor(safeMinutes / 60);
    const remainder = safeMinutes % 60;
    return hours ? `${hours}h ${remainder}m` : `${remainder}m`;
  }

  function getEndDate(entry) {
    return entry.endDate || entry.startDate || "";
  }

  function sortedEntries(list = entries) {
    return [...list].sort((a, b) => {
      const dateDifference = getEndDate(b).localeCompare(getEndDate(a));
      if (dateDifference !== 0) return dateDifference;
      return String(b.timestamp || "").localeCompare(String(a.timestamp || ""));
    });
  }

  function titleMarkup(entry) {
    const initial = (entry.title || "?").trim().charAt(0).toUpperCase();
    return `<div class="title-cell"><span class="poster-mini" aria-hidden="true">${escapeHtml(initial)}</span><span>${escapeHtml(entry.title)}</span></div>`;
  }

  function typeMarkup(type) {
    const normalized = type === "Series" ? "series" : "movie";
    return `<span class="type-badge ${normalized}">${escapeHtml(type)}</span>`;
  }

  function ratingMarkup(rating) {
    return rating === "" || rating === null || rating === undefined || !Number.isFinite(Number(rating))
      ? "—" : `<span class="rating-cell">★ ${escapeHtml(Number(rating).toFixed(1))}<span> / 10</span></span>`;
  }

  function renderStats() {
    const movies = entries.filter(entry => entry.type === "Movie").length;
    const series = entries.filter(entry => entry.type === "Series").length;
    const totalMinutes = entries.reduce((sum, entry) => sum + (Number(entry.watchTime) || 0), 0);
    const rated = entries.filter(entry => entry.rating !== "" && entry.rating !== null && entry.rating !== undefined && Number.isFinite(Number(entry.rating)));
    const average = rated.length ? rated.reduce((sum, entry) => sum + Number(entry.rating), 0) / rated.length : 0;

    $("#statEntries").textContent = entries.length.toLocaleString("en-IN");
    $("#statMovies").textContent = movies.toLocaleString("en-IN");
    $("#statSeries").textContent = series.toLocaleString("en-IN");
    $("#statTime").textContent = formatMinutes(totalMinutes);
    $("#trendTotal").textContent = formatMinutes(totalMinutes);
    $("#statRating").textContent = rated.length ? average.toFixed(1) : "—";
    $("#ratedCount").textContent = `${rated.length} rated ${rated.length === 1 ? "entry" : "entries"}`;
    $(".rating-meter span").style.width = `${Math.min(100, Math.max(0, average * 10))}%`;
  }

  function renderChart() {
    const chart = $("#monthlyChart");
    const maximum = Math.max(...MONTHS.map(item => item.hours));
    chart.innerHTML = MONTHS.map(item => `
      <div class="chart-column">
        <div class="chart-bar-area">
          <div class="chart-bar" style="height:${Math.max(5, (item.hours / maximum) * 100)}%" title="${item.month}: ${item.hours} illustrative hours"></div>
        </div>
        <span class="chart-month">${item.month}</span>
      </div>`).join("");
  }

  function renderRecent() {
    const recent = sortedEntries().slice(0, 5);
    $("#recentRows").innerHTML = recent.map(entry => `
      <tr>
        <td>${titleMarkup(entry)}</td>
        <td>${typeMarkup(entry.type)}</td>
        <td>${escapeHtml(entry.language || "—")}</td>
        <td>${ratingMarkup(entry.rating)}</td>
        <td>${escapeHtml(formatDate(getEndDate(entry)))}</td>
      </tr>`).join("");
  }

  function populateLanguages() {
    const select = $("#languageFilter");
    const previous = select.value;
    const languages = [...new Set(entries.map(entry => entry.language).filter(Boolean))].sort((a, b) => a.localeCompare(b));
    select.innerHTML = '<option value="all">All languages</option>' + languages.map(language =>
      `<option value="${escapeHtml(language)}">${escapeHtml(language)}</option>`
    ).join("");
    select.value = languages.includes(previous) ? previous : "all";
  }

  function renderHistory() {
    const query = $("#historySearch").value.trim().toLocaleLowerCase();
    const type = $("#typeFilter").value;
    const language = $("#languageFilter").value;

    const filtered = sortedEntries().filter(entry => {
      const searchable = [entry.title, entry.genre, entry.observations, entry.language, entry.type].join(" ").toLocaleLowerCase();
      return (!query || searchable.includes(query)) &&
        (type === "all" || entry.type === type) &&
        (language === "all" || entry.language === language);
    });

    $("#resultCount").textContent = `Showing ${filtered.length} of ${entries.length} ${entries.length === 1 ? "entry" : "entries"}`;
    $("#historyRows").innerHTML = filtered.map(entry => `
      <tr>
        <td>${titleMarkup(entry)}</td>
        <td>${typeMarkup(entry.type)}</td>
        <td>${escapeHtml(entry.language || "—")}</td>
        <td>${ratingMarkup(entry.rating)}</td>
        <td>${escapeHtml(formatMinutes(entry.watchTime))}</td>
        <td>${escapeHtml(formatDate(getEndDate(entry)))}</td>
      </tr>`).join("");

    $("#emptyState").classList.toggle("hidden", filtered.length > 0);
    $(".history-panel .table-wrap").classList.toggle("hidden", filtered.length === 0);
  }

  function renderAll() {
    renderStats();
    renderChart();
    renderRecent();
    populateLanguages();
    renderHistory();
  }

  function navigate(viewName) {
    const validViews = ["dashboard", "history", "add"];
    const view = validViews.includes(viewName) ? viewName : "dashboard";
    $$(".view").forEach(section => section.classList.toggle("active", section.id === `view-${view}`));
    $$(".nav-link").forEach(link => link.classList.toggle("active", link.dataset.view === view));
    $("#pageCrumb").textContent = view === "add" ? "Add a title" : view === "history" ? "Watch history" : "Dashboard";
    $("#sidebar").classList.remove("open");
    if (view === "history") renderHistory();
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function showToast(message) {
    const toast = $("#toast");
    toast.textContent = message;
    toast.classList.add("show");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => toast.classList.remove("show"), 3000);
  }

  function findDuplicates(title) {
    const normalized = title.trim().toLocaleLowerCase();
    return entries.filter(entry => entry.title.trim().toLocaleLowerCase() === normalized);
  }

  function resetForm() {
    $("#addForm").reset();
    $("#startDate").value = "";
    $("#endDate").value = "";
    pendingEntry = null;
  }

  function closeDuplicateModal() {
    $("#duplicateModal").classList.add("hidden");
    pendingEntry = null;
  }

  function savePreviewEntry(entry) {
    entries.push({
      ...entry,
      timestamp: new Date().toISOString()
    });
    renderAll();
    resetForm();
    closeDuplicateModal();
    navigate("history");
    showToast("Entry added to this browser preview only.");
  }

  function readForm() {
    const form = $("#addForm");
    if (!form.reportValidity()) return null;

    const formData = new FormData(form);
    const title = String(formData.get("title") || "").trim();
    const startDate = String(formData.get("startDate") || "");
    const endDate = String(formData.get("endDate") || "");
    const ratingRaw = String(formData.get("rating") || "").trim();
    const watchTime = Number(formData.get("watchTime"));

    if (!title) {
      $("#titleName").focus();
      showToast("Enter a title name.");
      return null;
    }
    if (endDate && startDate && endDate < startDate) {
      $("#endDate").setCustomValidity("End date cannot be earlier than start date.");
      $("#endDate").reportValidity();
      $("#endDate").setCustomValidity("");
      return null;
    }
    if (!Number.isInteger(watchTime) || watchTime < 1 || watchTime > 100000) {
      $("#watchTime").focus();
      showToast("Watch time must be a whole number of minutes.");
      return null;
    }

    const rating = ratingRaw === "" ? "" : Number(ratingRaw);
    if (rating !== "" && (!Number.isFinite(rating) || rating < 0 || rating > 10)) {
      $("#rating").focus();
      showToast("Rating must be between 0 and 10.");
      return null;
    }

    return {
      title,
      type: String(formData.get("type")),
      language: String(formData.get("language") || "").trim(),
      startDate,
      endDate,
      rating,
      watchTime,
      genre: String(formData.get("genre") || "").trim(),
      observations: String(formData.get("observations") || "").trim()
    };
  }

  function openDuplicateModal(entry, matches) {
    pendingEntry = entry;
    $("#duplicateMessage").textContent = `${matches.length} matching ${matches.length === 1 ? "entry exists" : "entries exist"} in this preview.`;
    $("#duplicateMatches").innerHTML = matches.slice(0, 3).map(match =>
      `<div>${escapeHtml(match.title)}<small>${escapeHtml(match.type)} · ${escapeHtml(match.language || "Language not specified")} · Ended ${escapeHtml(formatDate(getEndDate(match)))}</small></div>`
    ).join("");
    $("#duplicateModal").classList.remove("hidden");
    $("#addAnyway").focus();
  }

  function bindEvents() {
    $$("[data-view]").forEach(button => button.addEventListener("click", () => navigate(button.dataset.view)));
    $$("[data-go]").forEach(button => button.addEventListener("click", () => navigate(button.dataset.go)));
    $("#mobileMenu").addEventListener("click", () => $("#sidebar").classList.toggle("open"));
    $("#dismissBanner").addEventListener("click", () => $(".demo-banner").classList.add("hidden"));
    $("#historySearch").addEventListener("input", renderHistory);
    $("#typeFilter").addEventListener("change", renderHistory);
    $("#languageFilter").addEventListener("change", renderHistory);
    $("#clearFilters").addEventListener("click", () => {
      $("#historySearch").value = "";
      $("#typeFilter").value = "all";
      $("#languageFilter").value = "all";
      renderHistory();
    });

    $("#addForm").addEventListener("submit", event => {
      event.preventDefault();
      const entry = readForm();
      if (!entry) return;
      const duplicates = findDuplicates(entry.title);
      if (duplicates.length) {
        openDuplicateModal(entry, duplicates);
      } else {
        savePreviewEntry(entry);
      }
    });

    $("#addAnyway").addEventListener("click", () => {
      if (pendingEntry) savePreviewEntry(pendingEntry);
    });
    $("#cancelDuplicate").addEventListener("click", closeDuplicateModal);
    $("#closeModal").addEventListener("click", closeDuplicateModal);
    $("#duplicateModal").addEventListener("click", event => {
      if (event.target === $("#duplicateModal")) closeDuplicateModal();
    });
    document.addEventListener("keydown", event => {
      if (event.key === "Escape") closeDuplicateModal();
    });
  }

  bindEvents();
  renderAll();
})();
