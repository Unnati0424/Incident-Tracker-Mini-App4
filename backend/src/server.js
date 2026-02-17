const express = require("express");
const cors = require("cors");

const app = express();
const PORT = process.env.PORT || 4000;

app.use(cors());
app.use(express.json());

const SEVERITIES = ["SEV1", "SEV2", "SEV3", "SEV4+"];
const STATUSES = ["OPEN", "MITIGATED", "RESOLVED"];

let nextId = 1;
const incidents = [];

function randomChoice(values) {
  return values[Math.floor(Math.random() * values.length)];
}

function randomFrom(array) {
  return array[Math.floor(Math.random() * array.length)];
}

function createSeedIncident() {
  const services = ["Payments", "Auth", "Search", "Billing", "Notifications"];
  const owners = ["Alex", "Jordan", "Taylor", "Sam", "Morgan"];

  const createdAt = new Date(
    Date.now() - Math.floor(Math.random() * 1000 * 60 * 60 * 24 * 30)
  );
  const updatedAt =
    Math.random() > 0.5
      ? new Date(createdAt.getTime() + Math.floor(Math.random() * 1000 * 60 * 60 * 24))
      : createdAt;

  const severity = randomChoice(SEVERITIES);
  const status = randomChoice(STATUSES);

  return {
    id: nextId,
    title: `Incident #${nextId}`,
    service: randomFrom(services),
    severity,
    status,
    owner: randomFrom(owners),
    summary: `Auto-generated incident affecting ${severity} on ${randomFrom(services)}.`,
    createdAt: createdAt.toISOString(),
    updatedAt: updatedAt.toISOString(),
  };
}

function seedIncidents(count = 200) {
  for (let i = 0; i < count; i++) {
    incidents.push(createSeedIncident());
    nextId += 1;
  }
}

function validateIncidentPayload(payload, { partial = false } = {}) {
  const errors = [];

  function requireField(field, predicate, message) {
    const value = payload[field];
    if (value === undefined || value === null || value === "") {
      if (!partial) {
        errors.push(`${field} is required`);
      }
      return;
    }
    if (predicate && !predicate(value)) {
      errors.push(message || `${field} is invalid`);
    }
  }

  requireField("title", (v) => typeof v === "string" && v.trim().length >= 3);
  requireField("service", (v) => typeof v === "string" && v.trim().length >= 2);
  requireField("severity", (v) => SEVERITIES.includes(v), "severity must be one of SEV1, SEV2, SEV3, SEV4+");
  requireField("status", (v) => STATUSES.includes(v), "status must be one of OPEN, MITIGATED, RESOLVED");

  if (payload.owner !== undefined && typeof payload.owner !== "string") {
    errors.push("owner must be a string");
  }
  if (payload.summary !== undefined && typeof payload.summary !== "string") {
    errors.push("summary must be a string");
  }

  return errors;
}

function listIncidents(query) {
  const page = Number(query.page) > 0 ? Number(query.page) : 1;
  const pageSize =
    Number(query.pageSize) > 0 && Number(query.pageSize) <= 100
      ? Number(query.pageSize)
      : 20;

  const search = (query.search || "").toLowerCase();
  const severityFilter = query.severity || "";
  const statusFilter = query.status || "";

  let filtered = incidents.slice();

  if (search) {
    filtered = filtered.filter((i) => {
      return (
        i.title.toLowerCase().includes(search) ||
        i.service.toLowerCase().includes(search) ||
        (i.owner && i.owner.toLowerCase().includes(search)) ||
        (i.summary && i.summary.toLowerCase().includes(search))
      );
    });
  }

  if (severityFilter && SEVERITIES.includes(severityFilter)) {
    filtered = filtered.filter((i) => i.severity === severityFilter);
  }

  if (statusFilter && STATUSES.includes(statusFilter)) {
    filtered = filtered.filter((i) => i.status === statusFilter);
  }

  const sortBy = query.sortBy || "createdAt";
  const sortDirection = query.sortDirection === "asc" ? "asc" : "desc";

  filtered.sort((a, b) => {
    let aValue = a[sortBy];
    let bValue = b[sortBy];

    if (sortBy === "severity") {
      aValue = SEVERITIES.indexOf(a.severity);
      bValue = SEVERITIES.indexOf(b.severity);
    }

    if (sortBy === "status") {
      aValue = STATUSES.indexOf(a.status);
      bValue = STATUSES.indexOf(b.status);
    }

    if (aValue < bValue) {
      return sortDirection === "asc" ? -1 : 1;
    }
    if (aValue > bValue) {
      return sortDirection === "asc" ? 1 : -1;
    }
    return 0;
  });

  const total = filtered.length;
  const totalPages = Math.ceil(total / pageSize) || 1;
  const start = (page - 1) * pageSize;
  const end = start + pageSize;

  const pageItems = filtered.slice(start, end);

  return {
    data: pageItems,
    page,
    pageSize,
    total,
    totalPages,
  };
}

app.get("/api/incidents", (req, res) => {
  const result = listIncidents(req.query);
  res.json(result);
});

app.get("/api/incidents/:id", (req, res) => {
  const id = Number(req.params.id);
  const incident = incidents.find((i) => i.id === id);
  if (!incident) {
    res.status(404).json({ error: "Incident not found" });
    return;
  }
  res.json(incident);
});

app.post("/api/incidents", (req, res) => {
  const payload = req.body || {};
  const errors = validateIncidentPayload(payload);
  if (errors.length > 0) {
    res.status(400).json({ errors });
    return;
  }

  const now = new Date().toISOString();
  const incident = {
    id: nextId++,
    title: payload.title.trim(),
    service: payload.service.trim(),
    severity: payload.severity,
    status: payload.status,
    owner: payload.owner || null,
    summary: payload.summary || "",
    createdAt: now,
    updatedAt: now,
  };

  incidents.push(incident);
  res.status(201).json(incident);
});

app.patch("/api/incidents/:id", (req, res) => {
  const id = Number(req.params.id);
  const incident = incidents.find((i) => i.id === id);
  if (!incident) {
    res.status(404).json({ error: "Incident not found" });
    return;
  }

  const payload = req.body || {};
  const errors = validateIncidentPayload(payload, { partial: true });
  if (errors.length > 0) {
    res.status(400).json({ errors });
    return;
  }

  if (payload.title !== undefined) {
    incident.title = payload.title.trim();
  }
  if (payload.service !== undefined) {
    incident.service = payload.service.trim();
  }
  if (payload.severity !== undefined) {
    incident.severity = payload.severity;
  }
  if (payload.status !== undefined) {
    incident.status = payload.status;
  }
  if (payload.owner !== undefined) {
    incident.owner = payload.owner;
  }
  if (payload.summary !== undefined) {
    incident.summary = payload.summary;
  }

  incident.updatedAt = new Date().toISOString();

  res.json(incident);
});

app.use((err, _req, res, _next) => {
  console.error(err);
  res.status(500).json({ error: "Unexpected server error" });
});

seedIncidents(200);

app.listen(PORT, () => {
  console.log(`Incident Tracker API listening on http://localhost:${PORT}`);
});

