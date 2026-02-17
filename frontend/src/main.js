import "./style.css";

const API_BASE_URL = "http://localhost:4000";

const SEVERITIES = ["SEV1", "SEV2", "SEV3", "SEV4+"];
const STATUSES = ["OPEN", "MITIGATED", "RESOLVED"];

const state = {
  page: 1,
  pageSize: 20,
  totalPages: 1,
  total: 0,
  search: "",
  severity: "",
  status: "",
  sortBy: "createdAt",
  sortDirection: "desc",
  incidents: [],
  selectedIncidentId: null,
  editingIncidentId: null,
  isLoading: false,
  error: "",
};

let searchDebounceId = null;

function buildLayout() {
  const app = document.querySelector("#app");
  app.innerHTML = `
    <div class="page">
      <header class="page-header">
        <div>
          <h1 class="page-title">Incident Tracker</h1>
          <p class="page-subtitle">
            Create, search, and manage incidents with server-side filtering and pagination.
          </p>
        </div>
      </header>

      <section class="layout">
        <section class="layout-main">
          <div class="toolbar">
            <div class="toolbar-row">
              <div class="field">
                <label for="search">Search</label>
                <input
                  id="search"
                  type="search"
                  placeholder="Search by title, service, owner, or summary"
                />
              </div>
              <div class="field">
                <label for="severity-filter">Severity</label>
                <select id="severity-filter">
                  <option value="">All severities</option>
                  ${SEVERITIES.map(
                    (s) => `<option value="${s}">${s}</option>`
                  ).join("")}
                </select>
              </div>
              <div class="field">
                <label for="status-filter">Status</label>
                <select id="status-filter">
                  <option value="">All statuses</option>
                  ${STATUSES.map(
                    (s) => `<option value="${s}">${s}</option>`
                  ).join("")}
                </select>
              </div>
              <div class="field">
                <label for="sort-by">Sort by</label>
                <select id="sort-by">
                  <option value="createdAt">Created at</option>
                  <option value="updatedAt">Updated at</option>
                  <option value="severity">Severity</option>
                  <option value="status">Status</option>
                  <option value="service">Service</option>
                  <option value="title">Title</option>
                </select>
              </div>
            </div>
          </div>

          <div class="card">
            <div class="card-header">
              <h2>Incidents</h2>
              <span id="incident-count" class="badge"></span>
            </div>
            <div id="table-container" class="table-container">
              <table class="incidents-table">
                <thead>
                  <tr>
                    <th data-sort-key="id">ID</th>
                    <th data-sort-key="title">Title</th>
                    <th data-sort-key="service">Service</th>
                    <th data-sort-key="severity">Severity</th>
                    <th data-sort-key="status">Status</th>
                    <th data-sort-key="createdAt">Created</th>
                    <th data-sort-key="updatedAt">Updated</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody id="incidents-body">
                  <tr>
                    <td colspan="8" class="placeholder">Loading incidents...</td>
                  </tr>
                </tbody>
              </table>
            </div>
            <footer class="table-footer">
              <div class="pagination">
                <button id="prev-page" type="button">&larr; Previous</button>
                <span id="pagination-info"></span>
                <button id="next-page" type="button">Next &rarr;</button>
              </div>
            </footer>
          </div>
        </section>

        <aside class="layout-side">
          <section class="card">
            <div class="card-header">
              <h2>Incident details</h2>
            </div>
            <div id="incident-detail" class="incident-detail placeholder">
              Select a row to view full incident details.
            </div>
          </section>

          <section class="card">
            <div class="card-header">
              <h2 id="form-title">Create incident</h2>
            </div>
            <form id="incident-form" class="form">
              <div class="field">
                <label for="title-input">Title</label>
                <input id="title-input" name="title" placeholder="What happened?" required />
              </div>
              <div class="field">
                <label for="service-input">Service</label>
                <input id="service-input" name="service" placeholder="Impacted service" required />
              </div>
              <div class="field-group">
                <div class="field">
                  <label for="severity-input">Severity</label>
                  <select id="severity-input" name="severity" required>
                    ${SEVERITIES.map(
                      (s) => `<option value="${s}">${s}</option>`
                    ).join("")}
                  </select>
                </div>
                <div class="field">
                  <label for="status-input">Status</label>
                  <select id="status-input" name="status" required>
                    ${STATUSES.map(
                      (s) => `<option value="${s}">${s}</option>`
                    ).join("")}
                  </select>
                </div>
              </div>
              <div class="field">
                <label for="owner-input">Owner</label>
                <input id="owner-input" name="owner" placeholder="Primary responder" />
              </div>
              <div class="field">
                <label for="summary-input">Summary</label>
                <textarea
                  id="summary-input"
                  name="summary"
                  rows="3"
                  placeholder="Short description of impact, scope, and mitigation steps"
                ></textarea>
              </div>

              <div id="form-error" class="form-error" aria-live="polite"></div>

              <div class="form-actions">
                <button id="submit-button" type="submit">Create incident</button>
                <button id="reset-button" type="button" class="secondary">
                  Reset
                </button>
              </div>
            </form>
          </section>
        </aside>
      </section>
    </div>
  `;
}

async function fetchIncidents() {
  state.isLoading = true;
  setLoadingState(true);
  setError("");

  const params = new URLSearchParams();
  params.set("page", String(state.page));
  params.set("pageSize", String(state.pageSize));
  if (state.search) params.set("search", state.search);
  if (state.severity) params.set("severity", state.severity);
  if (state.status) params.set("status", state.status);
  if (state.sortBy) params.set("sortBy", state.sortBy);
  if (state.sortDirection) params.set("sortDirection", state.sortDirection);

  try {
    const response = await fetch(
      `${API_BASE_URL}/api/incidents?${params.toString()}`
    );
    if (!response.ok) {
      throw new Error(`Request failed with status ${response.status}`);
    }
    const result = await response.json();
    state.incidents = result.data || [];
    state.totalPages = result.totalPages || 1;
    state.total = typeof result.total === "number" ? result.total : state.total;
    state.page = result.page || state.page;
    renderIncidents();
  } catch (error) {
    console.error(error);
    setError("Unable to load incidents. Please ensure the backend is running.");
  } finally {
    state.isLoading = false;
    setLoadingState(false);
  }
}

function setLoadingState(isLoading) {
  const tbody = document.querySelector("#incidents-body");
  const prevButton = document.querySelector("#prev-page");
  const nextButton = document.querySelector("#next-page");

  if (!tbody || !prevButton || !nextButton) return;

  prevButton.disabled = isLoading;
  nextButton.disabled = isLoading;

  if (isLoading) {
    tbody.innerHTML = `
      <tr>
        <td colspan="8" class="placeholder">Loading incidents...</td>
      </tr>
    `;
  }
}

function setError(message) {
  state.error = message;
  const errorElement = document.querySelector("#form-error");
  if (errorElement) {
    errorElement.textContent = message || "";
  }
}

function renderIncidents() {
  const tbody = document.querySelector("#incidents-body");
  const countElement = document.querySelector("#incident-count");
  const paginationInfo = document.querySelector("#pagination-info");

  if (!tbody || !countElement || !paginationInfo) {
    return;
  }

  if (!state.incidents || state.incidents.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="8" class="placeholder">
          No incidents found for the current filters.
        </td>
      </tr>
    `;
  } else {
    tbody.innerHTML = state.incidents
      .map((incident) => {
        const created = new Date(incident.createdAt);
        const updated = new Date(incident.updatedAt);
        const isSelected = state.selectedIncidentId === incident.id;
        return `
          <tr data-id="${incident.id}" class="${
            isSelected ? "row-selected" : ""
          }">
            <td>${incident.id}</td>
            <td class="cell-title">${escapeHtml(incident.title)}</td>
            <td>${escapeHtml(incident.service)}</td>
            <td><span class="pill pill-severity pill-${incident.severity.toLowerCase().replace("+", "plus")}">${incident.severity}</span></td>
            <td>
              <select class="status-select">
                ${STATUSES.map(
                  (status) =>
                    `<option value="${status}" ${
                      status === incident.status ? "selected" : ""
                    }>${status}</option>`
                ).join("")}
              </select>
            </td>
            <td>${created.toLocaleString()}</td>
            <td>${updated.toLocaleString()}</td>
            <td>
              <button type="button" class="small edit-button">Edit</button>
            </td>
          </tr>
        `;
      })
      .join("");
  }

  const total = state.total || state.incidents.length;
  countElement.textContent = `${total} incidents (page ${state.page} of ${state.totalPages})`;
  paginationInfo.textContent = `Page ${state.page} of ${state.totalPages}`;

  renderSelectedIncident();
}

function renderSelectedIncident() {
  const container = document.querySelector("#incident-detail");
  if (!container) return;

  const incident = state.incidents.find(
    (i) => i.id === state.selectedIncidentId
  );

  if (!incident) {
    container.classList.add("placeholder");
    container.innerHTML = "Select a row to view full incident details.";
    return;
  }

  container.classList.remove("placeholder");
  container.innerHTML = `
    <div class="detail-header">
      <div>
        <h3>${escapeHtml(incident.title)}</h3>
        <p class="detail-subtitle">
          ${escapeHtml(incident.service)} •
          <span class="pill pill-severity pill-${incident.severity
            .toLowerCase()
            .replace("+", "plus")}">${incident.severity}</span>
          <span class="pill pill-status">${incident.status}</span>
        </p>
      </div>
    </div>
    <dl class="detail-grid">
      <div>
        <dt>ID</dt>
        <dd>${incident.id}</dd>
      </div>
      <div>
        <dt>Owner</dt>
        <dd>${incident.owner ? escapeHtml(incident.owner) : "Unassigned"}</dd>
      </div>
      <div>
        <dt>Created</dt>
        <dd>${new Date(incident.createdAt).toLocaleString()}</dd>
      </div>
      <div>
        <dt>Last updated</dt>
        <dd>${new Date(incident.updatedAt).toLocaleString()}</dd>
      </div>
    </dl>
    <section class="detail-section">
      <h4>Summary</h4>
      <p>${incident.summary ? escapeHtml(incident.summary) : "No summary provided."}</p>
    </section>
  `;
}

async function handleStatusChange(incidentId, newStatus) {
  try {
    const response = await fetch(
      `${API_BASE_URL}/api/incidents/${incidentId}`,
      {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      }
    );
    if (!response.ok) {
      throw new Error("Failed to update incident");
    }
    await fetchIncidents();
  } catch (error) {
    console.error(error);
    alert("Unable to update status. Please try again.");
  }
}

function attachTableHandlers() {
  const tbody = document.querySelector("#incidents-body");
  const prev = document.querySelector("#prev-page");
  const next = document.querySelector("#next-page");
  const sortSelect = document.querySelector("#sort-by");

  if (!tbody || !prev || !next || !sortSelect) return;

  tbody.addEventListener("click", (event) => {
    const target = event.target;
    if (target.closest(".edit-button") || target.closest(".status-select")) {
      return;
    }
    const row = target.closest("tr[data-id]");
    if (!row) return;
    const id = Number(row.getAttribute("data-id"));
    state.selectedIncidentId = id;
    renderIncidents();
  });

  tbody.addEventListener("change", (event) => {
    const target = event.target;
    if (!target.classList.contains("status-select")) return;
    const row = target.closest("tr[data-id]");
    if (!row) return;
    const id = Number(row.getAttribute("data-id"));
    const newStatus = target.value;
    handleStatusChange(id, newStatus);
  });

  tbody.addEventListener("click", (event) => {
    const target = event.target;
    if (!target.classList.contains("edit-button")) return;
    const row = target.closest("tr[data-id]");
    if (!row) return;
    const id = Number(row.getAttribute("data-id"));
    startEdit(id);
  });

  prev.addEventListener("click", () => {
    if (state.page > 1) {
      state.page -= 1;
      fetchIncidents();
    }
  });

  next.addEventListener("click", () => {
    if (state.page < state.totalPages) {
      state.page += 1;
      fetchIncidents();
    }
  });

  sortSelect.addEventListener("change", () => {
    state.sortBy = sortSelect.value;
    state.page = 1;
    fetchIncidents();
  });
}

function attachFilterHandlers() {
  const searchInput = document.querySelector("#search");
  const severityFilter = document.querySelector("#severity-filter");
  const statusFilter = document.querySelector("#status-filter");

  if (!searchInput || !severityFilter || !statusFilter) return;

  searchInput.addEventListener("input", () => {
    const value = searchInput.value.trim();
    if (searchDebounceId) {
      clearTimeout(searchDebounceId);
    }
    searchDebounceId = setTimeout(() => {
      state.search = value;
      state.page = 1;
      fetchIncidents();
    }, 400);
  });

  severityFilter.addEventListener("change", () => {
    state.severity = severityFilter.value;
    state.page = 1;
    fetchIncidents();
  });

  statusFilter.addEventListener("change", () => {
    state.status = statusFilter.value;
    state.page = 1;
    fetchIncidents();
  });
}

function attachFormHandlers() {
  const form = document.querySelector("#incident-form");
  const resetButton = document.querySelector("#reset-button");

  if (!form || !resetButton) return;

  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    setError("");

    const formData = new FormData(form);
    const payload = {
      title: String(formData.get("title") || "").trim(),
      service: String(formData.get("service") || "").trim(),
      severity: String(formData.get("severity") || ""),
      status: String(formData.get("status") || ""),
      owner: String(formData.get("owner") || "").trim() || undefined,
      summary: String(formData.get("summary") || "").trim() || undefined,
    };

    if (!payload.title || !payload.service) {
      setError("Title and service are required.");
      return;
    }

    const isEditing = Boolean(state.editingIncidentId);
    const method = isEditing ? "PATCH" : "POST";
    const url = isEditing
      ? `${API_BASE_URL}/api/incidents/${state.editingIncidentId}`
      : `${API_BASE_URL}/api/incidents`;

    try {
      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const data = await response.json().catch(() => null);
        const message =
          (data && data.errors && data.errors.join(", ")) ||
          data?.error ||
          "Unable to save incident.";
        throw new Error(message);
      }

      await response.json();
      resetForm();
      await fetchIncidents();
    } catch (error) {
      console.error(error);
      setError(error.message || "Unable to save incident.");
    }
  });

  resetButton.addEventListener("click", () => {
    resetForm();
  });
}

function resetForm() {
  const form = document.querySelector("#incident-form");
  const formTitle = document.querySelector("#form-title");
  const submitButton = document.querySelector("#submit-button");

  if (!form || !formTitle || !submitButton) return;

  form.reset();
  state.editingIncidentId = null;
  formTitle.textContent = "Create incident";
  submitButton.textContent = "Create incident";
  setError("");
}

function startEdit(incidentId) {
  const incident = state.incidents.find((i) => i.id === incidentId);
  if (!incident) return;

  const form = document.querySelector("#incident-form");
  const formTitle = document.querySelector("#form-title");
  const submitButton = document.querySelector("#submit-button");

  if (!form || !formTitle || !submitButton) return;

  form.querySelector("#title-input").value = incident.title;
  form.querySelector("#service-input").value = incident.service;
  form.querySelector("#severity-input").value = incident.severity;
  form.querySelector("#status-input").value = incident.status;
  form.querySelector("#owner-input").value = incident.owner || "";
  form.querySelector("#summary-input").value = incident.summary || "";

  state.editingIncidentId = incident.id;
  formTitle.textContent = `Edit incident #${incident.id}`;
  submitButton.textContent = "Save changes";
  setError("");
}

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function bootstrap() {
  buildLayout();
  attachTableHandlers();
  attachFilterHandlers();
  attachFormHandlers();
  fetchIncidents();
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", bootstrap);
} else {
  bootstrap();
}
