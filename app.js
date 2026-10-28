/* ScreenLog frontend.
 * Default mode is deliberately sample-only. To enable live read requests later,
 * set API_CONFIG.enabled=true and provide the deployed Apps Script web-app URL
 * only after the user explicitly approves deployment and browser-access tests.
 */
(() => {
  "use strict";

  const API_CONFIG = {
    enabled: true,
    url: "https://script.google.com/macros/s/AKfycbzHltMfXjsKxuu0sEn7ljPYpDez4Eq3Rto7gpcfIOtMgCDWHHyEvXeJUu7N62mfeai3/exec"
  };

  const SAMPLE_DASHBOARD = {
    summary: {
      totalViewingEntries: 137,
      movieEntries: 105,
      seriesEntries: 32,
      totalWatchMinutes: 23731,
      averageRating: 7.3,
      ratedEntries: 137
    },
    currentMonth: {
      month: "2026-10",
      watchMinutes: 980,
      previousMonthMinutes: 2259,
      changePercent: -56.62
    },
    monthlyTrend: [
      { month: "2025-11", watchMinutes: 1055, allocatedCalendarDays: 8 },
      { month: "2025-12", watchMinutes: 2029, allocatedCalendarDays: 39 },
      { month: "2026-01", watchMinutes: 3305, allocatedCalendarDays: 70 },
      { month: "2026-02", watchMinutes: 2684, allocatedCalendarDays: 44 },
      { month: "2026-03", watchMinutes: 1438, allocatedCalendarDays: 24 },
      { month: "2026-04", watchMinutes: 866, allocatedCalendarDays: 14 },
      { month: "2026-05", watchMinutes: 2437, allocatedCalendarDays: 31 },
      { month: "2026-06", watchMinutes: 0, allocatedCalendarDays: 0 },
      { month: "2026-07", watchMinutes: 850, allocatedCalendarDays: 14 },
      { month: "2026-08", watchMinutes: 346, allocatedCalendarDays: 32 },
      { month: "2026-09", watchMinutes: 2259, allocatedCalendarDays: 71 },
      { month: "2026-10", watchMinutes: 980, allocatedCalendarDays: 35 }
    ]
  };

  const SAMPLE_ENTRIES = [
    { title: "The Fall of the House of Usher", type: "Series", language: "English", startDate: "2026-08-01", endDate: "2026-10-28", rating: 7.5, watchTime: 480, genre: "Horror, Thriller", observations: "Surprisingly good one.", timestamp: "2026-10-28T20:05:40" },
    { title: "Dorothy", type: "Movie", language: "Other Indian", startDate: "2026-10-24", endDate: "2026-10-25", rating: 7, watchTime: 140, genre: "Drama", observations: "In the beginning movie looked like a genius craft but in the end didn't keep that promise. Except the over dramatic ending it was a good and different movie with the unique script", timestamp: "2026-10-28T20:07:46" },
    { title: "Jailer 2", type: "Movie", language: "Other Indian", startDate: "2026-10-24", endDate: "2026-10-24", rating: 7.5, watchTime: 160, genre: "Comedy, Action, Drama", observations: "Yet another mass entertainer. Watched it in the theatre and felt full paisa vasool. Storyline was masked by huge number of Cameo entries. Over all fun to watch", timestamp: "2026-10-28T20:09:46" },
    { title: "Paatal Lok S2", type: "Series", language: "Hindi", startDate: "2025-01-25", endDate: "2025-01-29", rating: 7.5, watchTime: 420, genre: "Thriller, Crime", observations: "", timestamp: "2025-12-16T20:03:13" },
    { title: "12th Fail", type: "Movie", language: "Hindi", startDate: "2025-01-18", endDate: "2025-01-18", rating: 8.5, watchTime: 147, genre: "Drama", observations: "An inspiring story.", timestamp: "2025-12-15T19:20:00" },
    { title: "The Family Man S2", type: "Series", language: "Hindi", startDate: "2024-12-12", endDate: "2024-12-20", rating: 8, watchTime: 480, genre: "Action, Thriller", observations: "", timestamp: "2025-12-12T18:15:00" },
    { title: "Jigarthanda DoubleX", type: "Movie", language: "Tamil", startDate: "2024-12-06", endDate: "2024-12-06", rating: 8, watchTime: 172, genre: "Action, Drama", observations: "", timestamp: "2025-12-06T21:30:00" },
    { title: "Aavesham", type: "Movie", language: "Malayalam", startDate: "2024-11-23", endDate: "2024-11-23", rating: 7.5, watchTime: 158, genre: "Action, Comedy", observations: "", timestamp: "2025-11-23T20:00:00" },
    { title: "Suzhal: The Vortex", type: "Series", language: "Tamil", startDate: "2024-11-02", endDate: "2024-11-06", rating: 8, watchTime: 360, genre: "Mystery, Thriller", observations: "", timestamp: "2025-11-06T19:00:00" },
    { title: "Super Deluxe", type: "Movie", language: "Tamil", startDate: "2024-10-18", endDate: "2024-10-18", rating: 8.5, watchTime: 176, genre: "Drama, Thriller", observations: "", timestamp: "2025-10-18T21:00:00" },
    { title: "Kumbalangi Nights", type: "Movie", language: "Malayalam", startDate: "2024-10-03", endDate: "2024-10-03", rating: 8, watchTime: 135, genre: "Drama", observations: "", timestamp: "2025-10-03T19:00:00" }
  ];

  let dashboardData = structuredClone(SAMPLE_DASHBOARD);
  let entries = SAMPLE_ENTRIES.map(entry => ({ ...entry }));
  let pendingEntry = null;
  let toastTimer = null;

  const $ = selector => document.querySelector(selector);
  const $$ = selector => Array.from(document.querySelectorAll(selector));

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
    return `${Math.floor(safeMinutes / 60)}h ${safeMinutes % 60}m`;
  }

  function monthLabel(monthKey) {
    if (!/^\d{4}-\d{2}$/.test(String(monthKey || ""))) return String(monthKey || "Month");
    const [year, month] = monthKey.split("-").map(Number);
    return new Intl.DateTimeFormat("en-IN", { month: "short", year: "2-digit" }).format(new Date(year, month - 1, 1));
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

  // Convert the Apps Script sheet-column schema into the frontend model.
  function normalizeSheetEntry(raw) {
    return {
      title: String(raw["Movie/Series Name"] ?? raw.title ?? "").trim(),
      type: String(raw["Movie or Series?"] ?? raw.type ?? "").trim(),
      language: String(raw.Language ?? raw.language ?? "").trim(),
      startDate: String(raw["Start Date"] ?? raw.startDate ?? "").slice(0, 10),
      endDate: String(raw["End Date"] ?? raw.endDate ?? "").slice(0, 10),
      rating: raw.Rating ?? raw.rating ?? "",
      watchTime: Number(raw["Watch Time"] ?? raw.watchTime ?? 0),
      genre: String(raw.Genre ?? raw.genre ?? "").trim(),
      observations: String(raw.Observations ?? raw.observations ?? ""),
      timestamp: String(raw.Timestamp ?? raw.timestamp ?? "")
    };
  }

  async function getApiResponse(action, params = {}) {
    if (!API_CONFIG.enabled || !API_CONFIG.url) throw new Error("Live API is not configured.");
    const url = new URL(API_CONFIG.url);
    url.searchParams.set("action", action);
    Object.entries(params).forEach(([key, value]) => url.searchParams.set(key, String(value)));
    const response = await fetch(url.toString(), { method: "GET", redirect: "follow" });
    if (!response.ok) throw new Error(`API request failed with HTTP ${response.status}.`);
    const payload = await response.json();
    if (!payload || payload.ok !== true) throw new Error(payload?.error || "The API returned an unsuccessful response.");
    return payload;
  }

  
async function postApiAction(action, payload) {
  if (!API_CONFIG.enabled || !API_CONFIG.url) {
    throw new Error("Live API is not configured.");
  }

  const form = new URLSearchParams();
  form.set("payload", JSON.stringify({ action, payload }));

  // Apps Script's cross-origin POST response is opaque here.
  // We confirm the save by reloading and checking the live entry count.
  await fetch(API_CONFIG.url, {
    method: "POST",
    mode: "no-cors",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded;charset=UTF-8"
    },
    body: form.toString()
  });
}

async function saveLiveEntry(entry, allowDuplicate = false) {
  const beforeCount = entries.length;
  const submitButton = $("#addForm button[type='submit']");
  const addAnywayButton = $("#addAnyway");

  submitButton.disabled = true;
  addAnywayButton.disabled = true;
  submitButton.textContent = "Saving to Google Sheets…";

  try {
    await postApiAction("addEntry", {
      ...entry,
      allowDuplicate
    });

    // Allow the sheet write to complete before refreshing.
    await new Promise(resolve => setTimeout(resolve, 700));
    await loadLiveReadData();

    if (entries.length <= beforeCount) {
      throw new Error(
        "The save could not be confirmed. Check Google Sheets before retrying, to avoid adding a duplicate."
      );
    }

    resetForm();
    closeDuplicateModal();
    navigate("history");
    showToast("Entry saved to Google Sheets.");
  } catch (error) {
    showToast(
      `Save could not be confirmed: ${error.message}. Check the sheet before retrying.`
    );
  } finally {
    submitButton.disabled = false;
    addAnywayButton.disabled = false;
    submitButton.innerHTML = "Review entry <span>→</span>";
  }
}

  
  async function loadLiveReadData() {
    const [dashboardResponse, historyResponse] = await Promise.all([
      getApiResponse("dashboard"),
      getApiResponse("recentHistory", { limit: 200 })
    ]);
    const dashboard = dashboardResponse.data;
    const history = historyResponse.data;
    if (!dashboard?.summary || !Array.isArray(dashboard.monthlyTrend) || !Array.isArray(history)) {
      throw new Error("The API response did not match the expected data contract.");
    }
    dashboardData = dashboard;
    entries = history.map(normalizeSheetEntry);
    setModeStatus("live");
    renderAll();
  }

  function setModeStatus(mode) {
    const live = mode === "live";
    $("#sidebarModeTitle").textContent = live ? "Connected" : "Preview mode";
    $("#sidebarModeDetail").textContent = live ? "Google Sheets read-only" : "Sample data only";
    $("#topStatus").innerHTML = `<span></span> ${live ? "LIVE READ-ONLY" : "PREVIEW"}`;
    $("#bannerTitle").textContent = live ? "Read-only connection" : "Frontend preview";
    $("#bannerMessage").textContent = live
      ? "Dashboard and history are loaded from Google Sheets. New entries can be saved to your spreadsheet."
      : "this version uses sample data in your browser. It is not connected to Google Sheets, and adding entries here will not update your spreadsheet.";
    $("#chartNote").textContent = live ? "From spreadsheet date-allocation calculations" : "Sample monthly distribution";
  }

  function renderStats() {
    const summary = dashboardData.summary || {};
    $("#statEntries").textContent = Number(summary.totalViewingEntries || 0).toLocaleString("en-IN");
    $("#statMovies").textContent = Number(summary.movieEntries || 0).toLocaleString("en-IN");
    $("#statSeries").textContent = Number(summary.seriesEntries || 0).toLocaleString("en-IN");
    $("#statTime").textContent = formatMinutes(summary.totalWatchMinutes);
    $("#trendTotal").textContent = formatMinutes(summary.totalWatchMinutes);
    const rating = Number(summary.averageRating);
    $("#statRating").textContent = Number.isFinite(rating) ? rating.toFixed(1) : "—";
    $("#ratedCount").textContent = `${Number(summary.ratedEntries || 0)} rated ${Number(summary.ratedEntries || 0) === 1 ? "entry" : "entries"}`;
    $(".rating-meter span").style.width = `${Math.min(100, Math.max(0, (Number.isFinite(rating) ? rating : 0) * 10))}%`;

    const current = dashboardData.currentMonth || {};
    $("#currentMonthLabel").textContent = `${monthLabel(current.month)} watch time`;
    $("#currentMonthTotal").textContent = formatMinutes(current.watchMinutes || 0);
    const change = Number(current.changePercent);
    const changeElement = $("#monthChange");
    if (Number.isFinite(change)) {
      changeElement.textContent = `${change > 0 ? "+" : ""}${change.toFixed(1)}% vs previous month`;
      changeElement.className = `month-change ${change > 0 ? "positive" : change < 0 ? "negative" : "neutral"}`;
    } else {
      changeElement.textContent = "No comparison available";
      changeElement.className = "month-change neutral";
    }
  }

  function renderChart() {
    const chart = $("#monthlyChart");
    const trend = Array.isArray(dashboardData.monthlyTrend) ? dashboardData.monthlyTrend : [];
    const displayTrend = trend.slice(-12);
    const maximum = Math.max(1, ...displayTrend.map(item => Number(item.watchMinutes) || 0));
    chart.setAttribute("aria-label", "Monthly watch-time chart, in hours and minutes");
    chart.innerHTML = displayTrend.map(item => {
      const minutes = Math.max(0, Number(item.watchMinutes) || 0);
      const height = minutes === 0 ? 2 : Math.max(5, (minutes / maximum) * 100);
      return `<div class="chart-column">
        <div class="chart-bar-area"><div class="chart-bar" style="height:${height}%" title="${escapeHtml(monthLabel(item.month))}: ${escapeHtml(formatMinutes(minutes))}; allocated calendar days: ${Number(item.allocatedCalendarDays) || 0}"></div></div>
        <span class="chart-month">${escapeHtml(monthLabel(item.month))}</span>
      </div>`;
    }).join("");
  }

  function titleMarkup(entry) {
    const initial = (entry.title || "?").trim().charAt(0).toUpperCase();
    return `<div class="title-cell"><span class="poster-mini" aria-hidden="true">${escapeHtml(initial)}</span><span>${escapeHtml(entry.title)}</span></div>`;
  }

  function typeMarkup(type) {
    const normalized = type === "Series" ? "series" : "movie";
    return `<span class="type-badge ${normalized}">${escapeHtml(type || "Unknown")}</span>`;
  }

  function ratingMarkup(rating) {
    return rating === "" || rating === null || rating === undefined || !Number.isFinite(Number(rating))
      ? "—" : `<span class="rating-cell">★ ${escapeHtml(Number(rating).toFixed(1))}<span> / 10</span></span>`;
  }

  function renderRecent() {
    $("#recentRows").innerHTML = sortedEntries().slice(0, 5).map(entry => `
      <tr><td>${titleMarkup(entry)}</td><td>${typeMarkup(entry.type)}</td>
      <td>${escapeHtml(entry.language || "—")}</td><td>${ratingMarkup(entry.rating)}</td>
      <td>${escapeHtml(formatDate(getEndDate(entry)))}</td></tr>`).join("");
  }

  function populateLanguages() {
    const select = $("#languageFilter");
    const previous = select.value;
    const languages = [...new Set(entries.map(entry => entry.language).filter(Boolean))].sort((a, b) => a.localeCompare(b));
    select.innerHTML = '<option value="all">All languages</option>' + languages.map(language =>
      `<option value="${escapeHtml(language)}">${escapeHtml(language)}</option>`).join("");
    select.value = languages.includes(previous) ? previous : "all";
  }

  function renderHistory() {
    const query = $("#historySearch").value.trim().toLocaleLowerCase();
    const type = $("#typeFilter").value;
    const language = $("#languageFilter").value;
    const filtered = sortedEntries().filter(entry => {
      const searchable = [entry.title, entry.genre, entry.observations, entry.language, entry.type].join(" ").toLocaleLowerCase();
      return (!query || searchable.includes(query)) && (type === "all" || entry.type === type) && (language === "all" || entry.language === language);
    });
    $("#resultCount").textContent = `Showing ${filtered.length} of ${entries.length} ${entries.length === 1 ? "entry" : "entries"}`;
    $("#historyRows").innerHTML = filtered.map(entry => `
      <tr><td>${titleMarkup(entry)}</td><td>${typeMarkup(entry.type)}</td>
      <td>${escapeHtml(entry.language || "—")}</td><td>${ratingMarkup(entry.rating)}</td>
      <td>${escapeHtml(formatMinutes(entry.watchTime))}</td><td>${escapeHtml(formatDate(getEndDate(entry)))}</td></tr>`).join("");
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
    pendingEntry = null;
  }

  function closeDuplicateModal() {
    $("#duplicateModal").classList.add("hidden");
    pendingEntry = null;
  }

  function savePreviewEntry(entry) {
    entries.push({ ...entry, timestamp: new Date().toISOString() });
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
    if (!title) { $("#titleName").focus(); showToast("Enter a title name."); return null; }
    if (endDate && startDate && endDate < startDate) {
      $("#endDate").setCustomValidity("End date cannot be earlier than start date.");
      $("#endDate").reportValidity();
      $("#endDate").setCustomValidity("");
      return null;
    }
    if (!Number.isInteger(watchTime) || watchTime < 1 || watchTime > 100000) {
      $("#watchTime").focus(); showToast("Watch time must be a whole number of minutes."); return null;
    }
    const rating = ratingRaw === "" ? "" : Number(ratingRaw);
    if (rating !== "" && (!Number.isFinite(rating) || rating < 0 || rating > 10)) {
      $("#rating").focus(); showToast("Rating must be between 0 and 10."); return null;
    }
    return {
      title, type: String(formData.get("type")),
      language: String(formData.get("language") || "").trim(),
      startDate, endDate, rating, watchTime,
      genre: String(formData.get("genre") || "").trim(),
      observations: String(formData.get("observations") || "").trim()
    };
  }

  async function checkDuplicateTitle(title) {
    if (API_CONFIG.enabled && API_CONFIG.url) {
      const response = await getApiResponse("checkDuplicate", { title });
      const matches = Array.isArray(response.data) ? response.data.map(normalizeSheetEntry) : [];
      return matches;
    }
    return findDuplicates(title);
  }

  function openDuplicateModal(entry, matches) {
    pendingEntry = entry;
    $("#duplicateMessage").textContent = `${matches.length} matching ${matches.length === 1 ? "entry exists" : "entries exist"} in this ${API_CONFIG.enabled ? "spreadsheet" : "preview"}.`;
    $("#duplicateMatches").innerHTML = matches.slice(0, 3).map(match =>
      `<div>${escapeHtml(match.title)}<small>${escapeHtml(match.type)} · ${escapeHtml(match.language || "Language not specified")} · Ended ${escapeHtml(formatDate(getEndDate(match)))}</small></div>`).join("");
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

$("#addForm").addEventListener("submit", async event => {
  event.preventDefault();

  const entry = readForm();
  if (!entry) return;

  const submitButton = $("#addForm button[type='submit']");
  submitButton.disabled = true;
  submitButton.textContent = "Checking title…";

  try {
    const duplicates = await checkDuplicateTitle(entry.title);

    if (duplicates.length) {
      openDuplicateModal(entry, duplicates);
    } else if (API_CONFIG.enabled && API_CONFIG.url) {
      await saveLiveEntry(entry, false);
    } else {
      savePreviewEntry(entry);
    }
  } catch (error) {
    showToast(`Entry could not be processed: ${error.message}`);
  } finally {
    submitButton.disabled = false;
    submitButton.innerHTML = "Review entry <span>→</span>";
  }
});

    
$("#addAnyway").addEventListener("click", async () => {
  if (!pendingEntry) return;

  const entry = pendingEntry;

  if (API_CONFIG.enabled && API_CONFIG.url) {
    await saveLiveEntry(entry, true);
  } else {
    savePreviewEntry(entry);
  }
});

    $("#cancelDuplicate").addEventListener("click", closeDuplicateModal);
    $("#closeModal").addEventListener("click", closeDuplicateModal);
    $("#duplicateModal").addEventListener("click", event => { if (event.target === $("#duplicateModal")) closeDuplicateModal(); });
    document.addEventListener("keydown", event => { if (event.key === "Escape") closeDuplicateModal(); });
  }

  async function init() {
    bindEvents();
    setModeStatus("preview");
    renderAll();

    // Intentionally disabled until API deployment is explicitly approved.
    if (API_CONFIG.enabled && API_CONFIG.url) {
      try {
        $("#bannerMessage").textContent = "Loading read-only data from Google Sheets…";
        await loadLiveReadData();
      } catch (error) {
        setModeStatus("preview");
        showToast(`Live data could not be loaded: ${error.message}`);
      }
    }
  }

  init();
})();
