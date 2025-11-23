// src/App.jsx
import { useEffect, useState } from "react";
import axios from "axios";
import "./App.css";
import { MapContainer, TileLayer, CircleMarker, Tooltip } from "react-leaflet";
import "leaflet/dist/leaflet.css";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:4000";

// ----- TECHNICIANS (for login & labels) -----
const DUMMY_TECHNICIANS = [
  {
    id: "tech1",
    username: "tech1",
    displayName: "Technician 1",
    specialization: "Lifts & Electrical",
  },
  {
    id: "tech2",
    username: "tech2",
    displayName: "Technician 2",
    specialization: "Plumbing & Civil",
  },
];

// ----- i18n STRINGS (English / Kannada) -----
const STRINGS = {
  en: {
    app_title: "Campus Smart Complaint Portal",
    app_subtitle:
      "Unified maintenance, student complaints, technicians & admin monitoring",
    landing_title: "Welcome to the Campus Smart Complaint Portal.",
    landing_subtitle:
      "This portal is for the exclusive use of students, technicians and administrators to raise, track and resolve campus maintenance issues.",
    for_students: "FOR STUDENTS",
    for_technicians: "FOR TECHNICIANS",
    for_admin: "FOR ADMIN / MAINTENANCE TEAM",
    click_here: "Click Here",
    student_login: "Student Login",
    technician_login: "Technician Login",
    admin_login: "Admin Login",
    back_home: "Back to home",
    login_as_student: "Login as Student",
    login_as_technician: "Login as Technician",
    login_as_admin: "Login as Admin",
    raise_complaint: "Raise a New Complaint",
    recent_complaints: "Recent Complaints",
    prediction_alerts: "Prediction Alerts",
    problems_resolved: "Problems Resolved",
    problems_pending: "Problems Pending / In Progress",
    campus_issue_heatmap: "Campus Issue Heatmap",
    all_complaints_admin: "All Complaints (Admin View)",
    technician_performance_overview: "Technician Performance Overview",
    chat_with_assistant: "Chat with Assistant",
    filter_search_placeholder: "Search title / description...",
    filter_status: "Status",
    filter_category: "Category",
    filter_building: "Building",
    filter_priority: "Priority",
    filter_all: "All",
    tech_daily_summary: "Today's Workload",
    tech_score_label: "Score",
  },
  kn: {
    app_title: "ಕ್ಯಾಂಪಸ್ ಸ್ಮಾರ್ಟ್ ದೂರು ಪೋರ್ಟಲ್",
    app_subtitle:
      "ವಿದ್ಯಾರ್ಥಿಗಳು, ತಾಂತ್ರಿಕರು ಮತ್ತು ಆಡಳಿತಕ್ಕಾಗಿ ಒಟ್ಟುಗೂಡಿಸಿದ ನಿರ್ವಹಣಾ ವ್ಯವಸ್ಥೆ",
    landing_title: "ಕ್ಯಾಂಪಸ್ ಸ್ಮಾರ್ಟ್ ದೂರು ಪೋರ್ಟಲ್‌ಗೆ ಸ್ವಾಗತ.",
    landing_subtitle:
      "ಹಾಸ್ಟೆಲ್, ನೀರು, ವಿದ್ಯುತ್, ಇಂಟರ್ನೆಟ್ ಮುಂತಾದ ದೂರುಗಳನ್ನು ದಾಖಲಿಸಲು ಮತ್ತು ಟ್ರ್ಯಾಕ್ ಮಾಡಲು ಈ ಪೋರ್ಟಲ್.",
    for_students: "ವಿದ್ಯಾರ್ಥಿಗಳಿಗಾಗಿ",
    for_technicians: "ಟೆಕ್ನಿಷಿಯನ್‌ಗಳಿಗಾಗಿ",
    for_admin: "ಆಡಳಿತ / ಮೆಂಟೈನನ್ಸ್ ತಂಡ",
    click_here: "ಇಲ್ಲಿ ಕ್ಲಿಕ್ ಮಾಡಿ",
    student_login: "ವಿದ್ಯಾರ್ಥಿ ಲಾಗಿನ್",
    technician_login: "ಟೆಕ್ನಿಷಿಯನ್ ಲಾಗಿನ್",
    admin_login: "ಆಡ್ಮಿನ್ ಲಾಗಿನ್",
    back_home: "ಮುಖಪುಟಕ್ಕೆ ಹಿಂತಿರುಗಿ",
    login_as_student: "ವಿದ್ಯಾರ್ಥಿಯಾಗಿ ಲಾಗಿನ್",
    login_as_technician: "ಟೆಕ್ನಿಷಿಯನ್ ಆಗಿ ಲಾಗಿನ್",
    login_as_admin: "ಆಡ್ಮಿನ್ ಆಗಿ ಲಾಗಿನ್",
    raise_complaint: "ಹೊಸ ದೂರು ದಾಖಲಿಸಿ",
    recent_complaints: "ಇತ್ತೀಚಿನ ದೂರುಗಳು",
    prediction_alerts: "ಪ್ರಿಡಿಕ್ಷನ್ ಅಲರ್ಟ್‌ಗಳು",
    problems_resolved: "ಪರಿಹರಿಸಿದ ಸಮಸ್ಯೆಗಳು",
    problems_pending: "ಬಾಕಿ / ಪ್ರಗತಿಯಲ್ಲಿ ಇರುವ ಸಮಸ್ಯೆಗಳು",
    campus_issue_heatmap: "ಕ್ಯಾಂಪಸ್ ಇಶ್ಯೂ ಹೀಟ್ಮ್ಯಾಪ್",
    all_complaints_admin: "ಎಲ್ಲಾ ದೂರುಗಳು (ಆಡ್ಮಿನ್)",
    technician_performance_overview: "ಟೆಕ್ನಿಷಿಯನ್ ಕಾರ್ಯಕ್ಷಮತೆ",
    chat_with_assistant: "ಚಾಟ್ ಅಸಿಸ್ಟೆಂಟ್",
    filter_search_placeholder: "ಟೈಟಲ್ / ವಿವರ ಹುಡುಕಿ...",
    filter_status: "ಸ್ಥಿತಿ",
    filter_category: "ವರ್ಗ",
    filter_building: "ಬ್ಲಾಕ್ / ಕಟ್ಟಡ",
    filter_priority: "ಪ್ರಾಥಮಿಕತೆ",
    filter_all: "ಎಲ್ಲಾ",
    tech_daily_summary: "ಇಂದಿನ ಕೆಲಸದ ಭಾರ",
    tech_score_label: "ಸ್ಕೋರ್",
  },
};

// ====== BMSIT MAP CONFIG ======

const CAMPUS_CENTER = {
  lat: 13.1339,
  lng: 77.56802,
};

const CAMPUS_LOCATIONS = {
  "bsn block": { lat: 13.1343, lng: 77.5677 },
  "lab block": { lat: 13.1337, lng: 77.5684 },
  "main block": { lat: 13.1339, lng: 77.56802 },
  library: { lat: 13.1342, lng: 77.5683 },
  "hostel a": { lat: 13.1334, lng: 77.5676 },
  "hostel b": { lat: 13.1334, lng: 77.5683 },
};

const CATEGORY_COLORS = {
  water: "#1E88E5",
  electricity: "#FBC02D",
  internet: "#E53935",
  it: "#E53935",
  garbage: "#6D4C41",
  hostel: "#8E24AA",
  other: "#546E7A",
};

function normaliseBuildingName(name) {
  if (!name || typeof name !== "string") return "";
  return name.trim().toLowerCase();
}

function getIncidentCoordinates(inc) {
  if (typeof inc.lat === "number" && typeof inc.lng === "number") {
    return { lat: inc.lat, lng: inc.lng };
  }
  if (
    typeof inc.location?.lat === "number" &&
    typeof inc.location?.lng === "number"
  ) {
    return { lat: inc.location.lat, lng: inc.location.lng };
  }

  const rawBuilding = inc.location?.building || inc.building || "";
  const key = normaliseBuildingName(rawBuilding);
  if (CAMPUS_LOCATIONS[key]) {
    return CAMPUS_LOCATIONS[key];
  }

  return CAMPUS_CENTER;
}

// Apply filters + search
function applyFilters(incidents, filters) {
  const search = (filters.search || "").toLowerCase();

  return incidents.filter((inc) => {
    if (filters.status !== "all" && inc.status !== filters.status) return false;
    if (filters.category !== "all" && inc.category !== filters.category)
      return false;

    const building = (inc.location?.building || "").toLowerCase();
    if (
      filters.building !== "all" &&
      building !== (filters.building || "").toLowerCase()
    ) {
      return false;
    }

    if (filters.priority !== "all" && inc.priority !== filters.priority)
      return false;

    if (search) {
      const t = (inc.title || "").toLowerCase();
      const d = (inc.description || "").toLowerCase();
      if (!t.includes(search) && !d.includes(search)) return false;
    }

    return true;
  });
}

// format duration for job timer
function formatDuration(ms) {
  if (!ms || ms <= 0) return "00:00";
  const totalSec = Math.floor(ms / 1000);
  const h = Math.floor(totalSec / 3600);
  const m = Math.floor((totalSec % 3600) / 60);
  const s = totalSec % 60;
  const pad = (n) => n.toString().padStart(2, "0");
  if (h > 0) return `${pad(h)}:${pad(m)}:${pad(s)}`;
  return `${pad(m)}:${pad(s)}`;
}

// Filter bar component
function IncidentsFilterBar({ filters, onChange, buildings, t }) {
  return (
    <div className="filter-bar">
      <input
        className="filter-input"
        placeholder={t("filter_search_placeholder")}
        value={filters.search}
        onChange={(e) => onChange({ search: e.target.value })}
      />

      <div className="filter-bar-group">
        <label className="filter-label">{t("filter_status")}</label>
        <select
          className="filter-select"
          value={filters.status}
          onChange={(e) => onChange({ status: e.target.value })}
        >
          <option value="all">{t("filter_all")}</option>
          <option value="new">New</option>
          <option value="in_progress">In Progress</option>
          <option value="resolved">Resolved</option>
        </select>

        <label className="filter-label">{t("filter_category")}</label>
        <select
          className="filter-select"
          value={filters.category}
          onChange={(e) => onChange({ category: e.target.value })}
        >
          <option value="all">{t("filter_all")}</option>
          <option value="water">Water</option>
          <option value="electricity">Electricity</option>
          <option value="internet">Internet</option>
          <option value="garbage">Garbage</option>
          <option value="hostel">Hostel</option>
          <option value="it">IT</option>
          <option value="other">Other</option>
        </select>

        <label className="filter-label">{t("filter_building")}</label>
        <select
          className="filter-select"
          value={filters.building}
          onChange={(e) => onChange({ building: e.target.value })}
        >
          <option value="all">{t("filter_all")}</option>
          {buildings.map((b) => (
            <option key={b} value={b}>
              {b}
            </option>
          ))}
        </select>

        <label className="filter-label">{t("filter_priority")}</label>
        <select
          className="filter-select"
          value={filters.priority}
          onChange={(e) => onChange({ priority: e.target.value })}
        >
          <option value="all">{t("filter_all")}</option>
          <option value="low">Low</option>
          <option value="medium">Medium</option>
          <option value="high">High</option>
        </select>
      </div>
    </div>
  );
}

// Map component shown in Admin section
function CampusIssueMap({ incidents }) {
  const hasIncidents = Array.isArray(incidents) && incidents.length > 0;

  const markers = hasIncidents
    ? incidents
        .map((inc) => {
          const { lat, lng } = getIncidentCoordinates(inc);
          if (typeof lat !== "number" || typeof lng !== "number") return null;

          return {
            lat,
            lng,
            category: inc.category || "other",
            title: inc.title || "Issue",
            building: inc.location?.building || inc.building || "",
            priority: inc.priority,
            status: inc.status,
          };
        })
        .filter(Boolean)
    : [
        {
          lat: CAMPUS_CENTER.lat,
          lng: CAMPUS_CENTER.lng,
          category: "internet",
          title: "Demo WiFi issue – Main Block",
          building: "Main Block",
          priority: "high",
          status: "in_progress",
        },
      ];

  return (
    <div className="map-wrapper">
      <MapContainer
        center={[CAMPUS_CENTER.lat, CAMPUS_CENTER.lng]}
        zoom={17}
        scrollWheelZoom={false}
        className="leaflet-map"
      >
        <TileLayer
          attribution='&copy; OpenStreetMap contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        {markers.map((m, idx) => {
          const color = CATEGORY_COLORS[m.category] || CATEGORY_COLORS.other;
          return (
            <CircleMarker
              key={idx}
              center={[m.lat, m.lng]}
              radius={10}
              pathOptions={{ color, fillColor: color, fillOpacity: 0.8 }}
            >
              <Tooltip direction="top" offset={[0, -8]} opacity={0.95}>
                <div style={{ fontSize: 12 }}>
                  <div style={{ fontWeight: 600 }}>{m.title}</div>
                  {m.building && <div>{m.building}</div>}
                  <div>
                    Category: {m.category} • Priority: {m.priority || "—"}
                  </div>
                  {m.status && <div>Status: {m.status}</div>}
                </div>
              </Tooltip>
            </CircleMarker>
          );
        })}
      </MapContainer>
    </div>
  );
}

// ---------- VIRTUAL ASSISTANT CHAT (Swiggy-style) ----------
function VirtualAssistantChat({
  messages,
  input,
  onInputChange,
  onSend,
  onClose,
}) {
  return (
    <div className="va-chat-panel">
      <div className="va-chat-header">
        <div className="va-chat-header-left">
          <div className="va-chat-avatar">🤖</div>
          <div>
            <div className="va-chat-title">Campus Virtual Assistant</div>
            <div className="va-chat-header-subtitle">
              <span className="va-chat-status-dot" /> Online · Live status
              updates
            </div>
          </div>
        </div>
        <button type="button" className="va-chat-close" onClick={onClose}>
          ✕
        </button>
      </div>

      <div className="va-chat-body">
        {messages.length === 0 ? (
          <div className="va-chat-status">
            Start typing to ask about your complaint status or ETA.
          </div>
        ) : (
          messages.map((m, idx) => (
            <div
              key={idx}
              className={
                "va-chat-row " +
                (m.from === "user" ? "va-chat-row-user" : "va-chat-row-bot")
              }
            >
              <div className="va-chat-bubble">{m.text}</div>
            </div>
          ))
        )}
      </div>

      <form className="va-chat-input-row" onSubmit={onSend}>
        <input
          className="va-chat-input"
          placeholder="Ask about status, time, or a specific complaint..."
          value={input}
          onChange={(e) => onInputChange(e.target.value)}
        />
        <button className="va-chat-send-btn" type="submit">
          ➤
        </button>
      </form>
    </div>
  );
}

/* ------------ PREDICTION PANELS ------------- */

// Compact summary strip (used in both)
function PredictionSummary({ predictions }) {
  if (!predictions || predictions.length === 0) return null;

  const high = predictions.filter((p) => p.riskLabel === "high").length;
  const medium = predictions.filter((p) => p.riskLabel === "medium").length;
  const low = predictions.length - high - medium;
  const windowDays = predictions[0]?.riskWindowDays || 7;

  return (
    <div className="prediction-summary">
      <div className="prediction-summary-item">
        <span className="prediction-summary-label">Hotspots</span>
        <span className="prediction-summary-value">
          {predictions.length}
        </span>
      </div>
      <div className="prediction-summary-item">
        <span className="prediction-dot high" />
        <span className="prediction-summary-label">High</span>
        <span className="prediction-summary-value">{high}</span>
      </div>
      <div className="prediction-summary-item">
        <span className="prediction-dot medium" />
        <span className="prediction-summary-label">Medium</span>
        <span className="prediction-summary-value">{medium}</span>
      </div>
      <div className="prediction-summary-item">
        <span className="prediction-dot low" />
        <span className="prediction-summary-label">Low</span>
        <span className="prediction-summary-value">{low}</span>
      </div>
      <div className="prediction-summary-item">
        <span className="prediction-summary-label">Window</span>
        <span className="prediction-summary-value">
          Next {windowDays} days
        </span>
      </div>
    </div>
  );
}

// ⭐ STUDENT VIEW – minimal: only percentage & days
function PredictionPanelStudent({ predictions }) {
  if (!predictions || predictions.length === 0) {
    return <div style={{ fontSize: 13 }}>No prediction alerts yet.</div>;
  }

  return (
    <div className="prediction-wrapper">
      <PredictionSummary predictions={predictions} />

      <div className="prediction-grid">
        {predictions.map((p, idx) => {
          const risk = p.riskLabel || "low";
          const cardClass =
            risk === "high"
              ? "prediction-card-high"
              : risk === "medium"
              ? "prediction-card-medium"
              : "prediction-card-low";

          const prob =
            typeof p.riskProbabilityPercent === "number"
              ? `${p.riskProbabilityPercent}%`
              : p.riskScore != null
              ? `${p.riskScore}%`
              : "Not enough data";

          const daysText =
            typeof p.expectedDaysBetweenIncidents === "number"
              ? `~${p.expectedDaysBetweenIncidents} days`
              : "Not enough data";

          return (
            <div key={idx} className={`prediction-card ${cardClass}`}>
              <div className="prediction-card-header">
                <div className="prediction-title-group">
                  <div className="prediction-building">
                    {(p.building || "Unknown block").toUpperCase()}
                  </div>
                  <div className="prediction-category-chip">
                    {p.category || "other"}
                  </div>
                </div>
                <span
                  className={
                    "prediction-risk-badge " +
                    (risk === "high"
                      ? "prediction-risk-high"
                      : risk === "medium"
                      ? "prediction-risk-medium"
                      : "prediction-risk-low")
                  }
                >
                  {risk[0].toUpperCase() + risk.slice(1)} Risk
                </span>
              </div>

              {/* Only two numbers for students */}
              <div className="prediction-meta-row">
                <div className="prediction-meta-item">
                  <span className="prediction-meta-label">
                    Chance next {p.riskWindowDays || 7} days
                  </span>
                  <span className="prediction-meta-value">{prob}</span>
                </div>
                <div className="prediction-meta-item">
                  <span className="prediction-meta-label">
                    Avg gap between issues
                  </span>
                  <span className="prediction-meta-value">{daysText}</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// 👑 ADMIN VIEW – full details
function PredictionPanelAdmin({ predictions }) {
  if (!predictions || predictions.length === 0) {
    return (
      <div style={{ fontSize: 13 }}>
        No prediction alerts yet. Once enough complaints are logged, high-risk
        blocks will appear here.
      </div>
    );
  }

  return (
    <div className="prediction-wrapper">
      <PredictionSummary predictions={predictions} />

      <div className="prediction-grid">
        {predictions.map((p, idx) => {
          const risk = p.riskLabel || "low";
          const cardClass =
            risk === "high"
              ? "prediction-card-high"
              : risk === "medium"
              ? "prediction-card-medium"
              : "prediction-card-low";

          const prob =
            typeof p.riskProbabilityPercent === "number"
              ? `${p.riskProbabilityPercent}%`
              : p.riskScore != null
              ? `${p.riskScore}%`
              : "Not enough data";

          const daysText =
            typeof p.expectedDaysBetweenIncidents === "number"
              ? `~${p.expectedDaysBetweenIncidents} days`
              : "Not enough data";

          const lastReported = p.lastReportedAt
            ? new Date(p.lastReportedAt).toLocaleString()
            : "—";

          return (
            <div key={idx} className={`prediction-card ${cardClass}`}>
              <div className="prediction-card-header">
                <div className="prediction-title-group">
                  <div className="prediction-building">
                    {(p.building || "Unknown block").toUpperCase()}
                  </div>
                  <div className="prediction-category-chip">
                    {p.category || "other"}
                  </div>
                </div>
                <span
                  className={
                    "prediction-risk-badge " +
                    (risk === "high"
                      ? "prediction-risk-high"
                      : risk === "medium"
                      ? "prediction-risk-medium"
                      : "prediction-risk-low")
                  }
                >
                  {risk[0].toUpperCase() + risk.slice(1)} Risk
                </span>
              </div>

              <div className="prediction-message">{p.message}</div>

              <div className="prediction-meta-row">
                <div className="prediction-meta-item">
                  <span className="prediction-meta-label">
                    Chance next {p.riskWindowDays || 7} days
                  </span>
                  <span className="prediction-meta-value">{prob}</span>
                </div>
                <div className="prediction-meta-item">
                  <span className="prediction-meta-label">
                    Avg gap between issues
                  </span>
                  <span className="prediction-meta-value">{daysText}</span>
                </div>
                <div className="prediction-meta-item">
                  <span className="prediction-meta-label">
                    Total complaints
                  </span>
                  <span className="prediction-meta-value">
                    {p.totalCount ?? p.count ?? 0}
                  </span>
                </div>
                <div className="prediction-meta-item">
                  <span className="prediction-meta-label">
                    Open complaints
                  </span>
                  <span className="prediction-meta-value">
                    {p.openCount ?? 0}
                  </span>
                </div>
                <div className="prediction-meta-item">
                  <span className="prediction-meta-label">Last reported</span>
                  <span className="prediction-meta-value">{lastReported}</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ------------ MAIN APP ------------- */

function App() {
  const [view, setView] = useState("landing");

  const [studentInfo, setStudentInfo] = useState(null);
  const [adminInfo, setAdminInfo] = useState(null);
  const [technicianInfo, setTechnicianInfo] = useState(null);

  // NEW: Admin tab state – overview / complaints
  const [adminSection, setAdminSection] = useState("overview");

  const [studentLogin, setStudentLogin] = useState({ usn: "", password: "" });
  const [adminLogin, setAdminLogin] = useState({ username: "", password: "" });
  const [technicianLogin, setTechnicianLogin] = useState({
    username: "",
    password: "",
  });
  const [loginError, setLoginError] = useState("");

  const [form, setForm] = useState({
    reporterName: "",
    reporterEmail: "",
    title: "",
    category: "water",
    description: "",
    imageUrl: "",
    building: "",
    room: "",
    lat: "",
    lng: "",
  });

  const [incidents, setIncidents] = useState([]);
  const [predictions, setPredictions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState({ type: "", text: "" });

  // filters
  const [filters, setFilters] = useState({
    search: "",
    status: "all",
    category: "all",
    building: "all",
    priority: "all",
  });

  // tech note drafts per incident & job timers
  const [techNoteDrafts, setTechNoteDrafts] = useState({});
  const [jobTimers, setJobTimers] = useState({}); // { incidentId: { startedAt, endedAt } }

  // virtual assistant state
  const [assistantOpen, setAssistantOpen] = useState(false);
  const [assistantMessages, setAssistantMessages] = useState([
    {
      from: "bot",
      text:
        "Hi! I'm your campus virtual assistant. Ask me about your complaint status or how long it may take to resolve. Use the same email you used in the complaint form.",
    },
  ]);
  const [assistantInput, setAssistantInput] = useState("");

  // ticker for live timers
  const [nowTs, setNowTs] = useState(Date.now());

  // language
  const [lang, setLang] = useState("en");
  const t = (key) =>
    (STRINGS[lang] && STRINGS[lang][key]) || STRINGS.en[key] || key;

  const issuePresets = [
    { label: "Hostel Issue", category: "hostel" },
    { label: "Water Supply", category: "water" },
    { label: "Electricity", category: "electricity" },
    { label: "Internet / IT", category: "internet" },
    { label: "Garbage / Cleanliness", category: "garbage" },
    { label: "Other Campus Issue", category: "other" },
  ];

  // Initialise: load incidents + predictions + QR building prefill
  useEffect(() => {
    fetchIncidents();
    fetchPredictions();

    const params = new URLSearchParams(window.location.search);
    const buildingFromQR = params.get("building");
    if (buildingFromQR) {
      setForm((prev) => ({ ...prev, building: buildingFromQR }));
    }
  }, []);

  // Timer ticker for technician "Start Job" timers
  useEffect(() => {
    const interval = setInterval(() => {
      setNowTs(Date.now());
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  async function fetchIncidents() {
    try {
      const res = await axios.get(`${API_URL}/api/incidents`);
      setIncidents(res.data);
    } catch (err) {
      console.error("Error loading incidents:", err.message);
    }
  }

  async function fetchPredictions() {
    try {
      const res = await axios.get(`${API_URL}/api/incidents/predictions`);
      setPredictions(res.data.alerts || []);
    } catch (err) {
      console.error("Error loading predictions:", err?.message || err);
      setPredictions([]);
    }
  }

  function handleComplaintChange(e) {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  }

  function handleStudentLoginChange(e) {
    const { name, value } = e.target;
    setStudentLogin((prev) => ({ ...prev, [name]: value }));
  }

  function handleAdminLoginChange(e) {
    const { name, value } = e.target;
    setAdminLogin((prev) => ({ ...prev, [name]: value }));
  }

  function handleTechnicianLoginChange(e) {
    const { name, value } = e.target;
    setTechnicianLogin((prev) => ({ ...prev, [name]: value }));
  }

  async function handleSubmitComplaint(e) {
    e.preventDefault();
    setLoading(true);
    setMsg({ type: "", text: "" });

    try {
      const body = {
        ...form,
        lat: form.lat ? Number(form.lat) : null,
        lng: form.lng ? Number(form.lng) : null,
      };

      const res = await axios.post(`${API_URL}/api/incidents`, body);

      setIncidents((prev) => [res.data, ...prev]);
      setMsg({ type: "success", text: "Complaint submitted successfully." });

      setForm((prev) => ({
        ...prev,
        title: "",
        description: "",
        imageUrl: "",
        building: "",
        room: "",
        lat: "",
        lng: "",
      }));

      // refresh predictions when new complaint added
      fetchPredictions();
    } catch (err) {
      console.error(err);
      const text =
        err.response?.data?.message ||
        "Failed to submit complaint. (Backend might not be running yet.)";
      setMsg({ type: "error", text });
    } finally {
      setLoading(false);
    }
  }

  async function handleStudentLoginSubmit(e) {
    e.preventDefault();
    setLoginError("");

    if (!studentLogin.usn || !studentLogin.password) {
      setLoginError("Please enter both USN and password.");
      return;
    }

    try {
      const res = await axios.post(`${API_URL}/api/auth/student-login`, {
        usn: studentLogin.usn,
        password: studentLogin.password,
      });

      setStudentInfo({
        id: res.data.id,
        usn: res.data.usn,
        name: res.data.name,
      });
      setView("studentDashboard");
    } catch (err) {
      console.error("Student login error (frontend):", err);
      const text = err.response?.data?.message || "Invalid USN or password.";
      setLoginError(text);
    }
  }

  function handleAdminLoginSubmit(e) {
    e.preventDefault();
    setLoginError("");

    if (adminLogin.username === "admin" && adminLogin.password === "admin123") {
      setAdminInfo({ username: adminLogin.username });
      setView("adminDashboard");
    } else {
      setLoginError("Invalid admin credentials. Use admin / admin123 (demo).");
    }
  }

  function handleTechnicianLoginSubmit(e) {
    e.preventDefault();
    setLoginError("");

    const tech = DUMMY_TECHNICIANS.find(
      (t) => t.username === technicianLogin.username
    );

  if (!tech || technicianLogin.password !== "tech123") {
      setLoginError(
        "Invalid technician credentials. Demo users: tech1 or tech2, password: tech123."
      );
      return;
    }

    setTechnicianInfo({
      id: tech.id,
      username: tech.username,
      name: tech.displayName,
    });
    setView("technicianDashboard");
  }

  function handleLogout() {
    setStudentInfo(null);
    setAdminInfo(null);
    setTechnicianInfo(null);
    setStudentLogin({ usn: "", password: "" });
    setAdminLogin({ username: "", password: "" });
    setTechnicianLogin({ username: "", password: "" });
    setLoginError("");
    setAssistantOpen(false);
    setAdminSection("overview");
    setView("landing");
  }

  // core function: update incident + (optional) note
  async function handleUpdateIncidentStatus(incidentId, status) {
    const note = techNoteDrafts[incidentId] || "";
    const hasNote = note.trim().length > 0;

    const allowedStatuses = ["new", "in_progress", "resolved"];
    if (!allowedStatuses.includes(status)) {
      alert("Invalid status");
      return;
    }

    try {
      const body = { status };
      if (hasNote) {
        body.note = note.trim();
      }
      if (technicianInfo?.username) {
        body.technicianUsername = technicianInfo.username;
      }

      const res = await axios.patch(
        `${API_URL}/api/incidents/${incidentId}/status`,
        body
      );
      const updated = res.data;

      setIncidents((prev) =>
        prev.map((inc) => (inc._id === updated._id ? updated : inc))
      );

      if (hasNote) {
        setTechNoteDrafts((prev) => ({ ...prev, [incidentId]: "" }));
      }

      // refresh predictions when statuses change
      fetchPredictions();
      return updated;
    } catch (err) {
      console.error("Error updating incident status:", err);
      alert(
        err.response?.data?.message ||
          "Failed to update incident status. Check backend."
      );
      throw err;
    }
  }

  // ---- Technician helpers: Start Job / Resolve / Save Note ----
  async function handleTechStartJob(incident) {
    try {
      await handleUpdateIncidentStatus(incident._id, "in_progress");
      setJobTimers((prev) => ({
        ...prev,
        [incident._id]: {
          ...(prev[incident._id] || {}),
          startedAt: prev[incident._id]?.startedAt || Date.now(),
          endedAt: undefined,
        },
      }));
    } catch {
      // error already alerted
    }
  }

  async function handleTechResolveJob(incident) {
    try {
      await handleUpdateIncidentStatus(incident._id, "resolved");
      setJobTimers((prev) => {
        const existing = prev[incident._id];
        const startedAt = existing?.startedAt || Date.now();
        return {
          ...prev,
          [incident._id]: {
            startedAt,
            endedAt: Date.now(),
          },
        };
      });
    } catch {
      // error already alerted
    }
  }

  async function handleSaveTechNote(incident) {
    const note = techNoteDrafts[incident._id] || "";
    if (!note.trim()) {
      alert("Please type a note before saving.");
      return;
    }
    try {
      // keep same status, only append note
      await handleUpdateIncidentStatus(incident._id, incident.status);
    } catch {
      // error already alerted
    }
  }

  function statusBadge(status) {
    if (status === "in_progress")
      return (
        <span className="status-badge status-in-progress">In Progress</span>
      );
    if (status === "resolved")
      return <span className="status-badge status-resolved">Resolved</span>;
    return <span className="status-badge status-new">New</span>;
  }

  function priorityBadge(priority) {
    if (priority === "high")
      return <span className="priority-badge priority-high">High</span>;
    if (priority === "medium")
      return <span className="priority-badge priority-medium">Medium</span>;
    return <span className="priority-badge priority-low">Low</span>;
  }

  // -------- CAMPUS HEALTH SCORE (Admin) --------
  function computeCampusHealth(incidentsList, predictionAlerts) {
    if (!Array.isArray(incidentsList) || incidentsList.length === 0) {
      return {
        score: 100,
        label: "No data yet",
        tone: "excellent",
        open: 0,
        openHigh: 0,
        openMedium: 0,
        avgRisk: 0,
      };
    }

    const total = incidentsList.length;
    const resolved = incidentsList.filter(
      (i) => i.status === "resolved"
    ).length;
    const open = total - resolved;

    const openHigh = incidentsList.filter(
      (i) => i.status !== "resolved" && i.priority === "high"
    ).length;
    const openMedium = incidentsList.filter(
      (i) => i.status !== "resolved" && i.priority === "medium"
    ).length;

    const riskArray =
      Array.isArray(predictionAlerts) && predictionAlerts.length > 0
        ? predictionAlerts
            .map((p) => p.riskProbabilityPercent ?? 0)
            .filter((v) => typeof v === "number")
        : [];

    const avgRisk =
      riskArray.length > 0
        ? riskArray.reduce((sum, v) => sum + v, 0) / riskArray.length
        : 0;

    let penalty = 0;
    penalty += Math.min(30, open * 2); // open complaints
    penalty += Math.min(25, openHigh * 5); // high priority
    penalty += Math.min(15, openMedium * 2); // medium priority
    penalty += Math.round(avgRisk * 0.3); // future risk

    const rawScore = 100 - penalty;
    const score = Math.max(0, Math.min(100, Math.round(rawScore)));

    let label = "Excellent";
    let tone = "excellent";
    if (score < 40) {
      label = "Critical";
      tone = "critical";
    } else if (score < 60) {
      label = "Needs attention";
      tone = "attention";
    } else if (score < 80) {
      label = "Good";
      tone = "good";
    }

    return {
      score,
      label,
      tone,
      open,
      openHigh,
      openMedium,
      avgRisk: Math.round(avgRisk),
    };
  }

  // -------- VIRTUAL ASSISTANT LOGIC --------
  function getAssistantReply(userText) {
    const text = userText.toLowerCase().trim();

    const email = (form.reporterEmail || "").trim().toLowerCase();
    const myIncidents = email
      ? incidents
          .filter(
            (inc) =>
              (inc.createdBy?.email || "").trim().toLowerCase() === email
          )
          .sort(
            (a, b) =>
              new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
          )
      : [];

    if (!email || myIncidents.length === 0) {
      return (
        "I couldn't find any complaints linked to your email yet. " +
        "Please make sure you have submitted a complaint using the same email in the form above. " +
        "If you already did, wait a few seconds and try again."
      );
    }

    // helper: build status + ETA text for one incident
    function describeIncident(inc, indexForUser) {
      const status = inc.status || "new";
      const priority = inc.priority || "low";
      const building = inc.location?.building || "your building";
      const title = inc.title || "your complaint";

      let slaMinutes = 120;
      if (priority === "high") slaMinutes = 30;
      else if (priority === "medium") slaMinutes = 60;
      if (inc.category === "electricity" || inc.category === "water") {
        slaMinutes = Math.min(slaMinutes, 60);
      }

      let etaText = "";
      if (inc.createdAt) {
        const created = new Date(inc.createdAt);
        const now = new Date();
        const elapsed = Math.max(
          0,
          Math.round((now.getTime() - created.getTime()) / 60000)
        );
        const remaining = slaMinutes - elapsed;

        if (status === "resolved") {
          etaText = "This complaint is already marked as resolved.";
        } else if (remaining <= 0) {
          etaText =
            "It may be slightly delayed. The technician is still working on it, please bear with us.";
        } else {
          etaText = `Estimated remaining time: around ${remaining} minutes (approx).`;
        }
      }

      const label =
        typeof indexForUser === "number"
          ? `Complaint #${indexForUser}: `
          : "";

      return (
        label +
        `"${title}" in ${building} is currently ` +
        status.replace("_", " ") +
        ` with ${priority} priority. ${etaText}`
      );
    }

    const total = myIncidents.length;

    // "all / every / list" → summary of all complaints
    if (
      text.includes("all") ||
      text.includes("every") ||
      text.includes("list")
    ) {
      const parts = myIncidents.map((inc, idx) =>
        describeIncident(inc, idx + 1)
      );
      return (
        `You have ${total} complaints linked to this email.\n\n` +
        parts.join("\n")
      );
    }

    // If user mentions a number → treat as complaint index (1 = latest)
    const numMatch = text.match(/(\d+)/);
    if (numMatch) {
      const index = parseInt(numMatch[1], 10);
      if (index >= 1 && index <= total) {
        const inc = myIncidents[index - 1];
        return describeIncident(inc, index);
      }
    }

    // Try match by title text
    const byTitle = myIncidents.find((inc) => {
      const title = (inc.title || "").toLowerCase();
      return title && text.length > 3 && title.includes(text);
    });
    if (byTitle) {
      const idx = myIncidents.indexOf(byTitle);
      return describeIncident(byTitle, idx + 1);
    }

    // Default: latest complaint, and hint about other ones
    const latest = myIncidents[0];
    const base = describeIncident(latest, 1);

    if (total === 1) return base;

    return (
      base +
      `\n\nYou have ${total - 1} other complaint(s) as well. ` +
      `You can ask like "status of complaint 2" or type part of the issue title to get details of a specific one.`
    );
  }

  function handleAssistantSend(e) {
    e.preventDefault();
    const trimmed = assistantInput.trim();
    if (!trimmed) return;

    const userMsg = { from: "user", text: trimmed };
    const botMsg = { from: "bot", text: getAssistantReply(trimmed) };

    setAssistantMessages((prev) => [...prev, userMsg, botMsg]);
    setAssistantInput("");
  }

  // derived data for filters
  const buildingOptions = Array.from(
    new Set(
      incidents
        .map((inc) => inc.location?.building)
        .filter((b) => b && b.trim() !== "")
    )
  );

  const filteredIncidents = applyFilters(incidents, filters);

  const handleFilterChange = (partial) =>
    setFilters((prev) => ({ ...prev, ...partial }));

  // ---------- LANDING ----------
  if (view === "landing") {
    return (
      <div className="landing-root">
        <div className="bms-topbar">
          <div className="bms-logo-wrap">
            <img
              src="/bms-logo.png"
              alt="BMS Institute of Technology & Management"
              className="bms-logo-img"
            />
            <div className="bms-logo-text">
              <div className="bms-logo-main">
                BMS INSTITUTE OF TECHNOLOGY &amp; MANAGEMENT
              </div>
              <div className="bms-logo-sub">
                Yelahanka, Bengaluru – 560064 • Autonomous Institution under VTU
              </div>
            </div>
          </div>
        </div>

        <div className="landing-hero">
          <div className="landing-overlay">
            <div className="landing-content">
              <h1 className="landing-title">{t("landing_title")}</h1>
              <p className="landing-subtitle">{t("landing_subtitle")}</p>

              <div className="portal-cards">
                <div className="portal-card">
                  <div className="portal-card-title">{t("for_students")}</div>
                  <div className="portal-card-sub">
                    Raise complaints related to hostel, water, electricity,
                    internet, garbage and other campus facilities.
                  </div>
                  <button
                    className="portal-card-btn"
                    type="button"
                    onClick={() => {
                      setView("studentLogin");
                      setLoginError("");
                    }}
                  >
                    {t("click_here")}
                  </button>
                </div>

                <div className="portal-card">
                  <div className="portal-card-title">
                    {t("for_technicians")}
                  </div>
                  <div className="portal-card-sub">
                    View your assigned tasks, lift issues, SLA timers and
                    personal performance score.
                  </div>
                  <button
                    className="portal-card-btn"
                    type="button"
                    onClick={() => {
                      setView("technicianLogin");
                      setLoginError("");
                    }}
                  >
                    {t("click_here")}
                  </button>
                </div>

                <div className="portal-card">
                  <div className="portal-card-title">{t("for_admin")}</div>
                  <div className="portal-card-sub">
                    Monitor all complaints, see which are resolved, and track
                    technician performance &amp; hotspots.
                  </div>
                  <button
                    className="portal-card-btn"
                    type="button"
                    onClick={() => {
                      setView("adminLogin");
                      setLoginError("");
                    }}
                  >
                    {t("click_here")}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        <footer className="landing-footer">
          Copyright © Smart Maintenance Portal • Inspired by BMSIT Student
          Portal
        </footer>
      </div>
    );
  }

  // ---------- ALL OTHER VIEWS ----------
  return (
    <div className="app-root">
      <header className="header">
        <div>
          <div className="header-title">{t("app_title")}</div>
          <div className="header-sub">{t("app_subtitle")}</div>
        </div>
        <div className="header-right">
          <div className="lang-toggle">
            <button
              type="button"
              className={lang === "en" ? "lang-btn active" : "lang-btn"}
              onClick={() => setLang("en")}
            >
              EN
            </button>
            <span className="lang-separator">|</span>
            <button
              type="button"
              className={lang === "kn" ? "lang-btn active" : "lang-btn"}
              onClick={() => setLang("kn")}
            >
              KN
            </button>
          </div>

          {studentInfo && (
            <span className="header-chip">Student: {studentInfo.usn}</span>
          )}
          {technicianInfo && (
            <span className="header-chip">
              Technician: {technicianInfo.name}
            </span>
          )}
          {adminInfo && (
            <span className="header-chip">Admin: {adminInfo.username}</span>
          )}
          {(studentInfo || technicianInfo || adminInfo) && (
            <button className="header-logout" onClick={handleLogout}>
              Logout
            </button>
          )}
        </div>
      </header>

      <main className="main-layout">
        {/* STUDENT LOGIN */}
        {view === "studentLogin" && (
          <div className="card login-card">
            <div className="login-title">{t("student_login")}</div>
            <div className="login-subtitle">
              Enter your USN and password to access the complaint portal.
            </div>

            <form onSubmit={handleStudentLoginSubmit}>
              <div className="form-col">
                <label>USN</label>
                <input
                  name="usn"
                  value={studentLogin.usn}
                  onChange={handleStudentLoginChange}
                  placeholder="1TD24AI081"
                  required
                />
              </div>
              <div className="form-col">
                <label>Password</label>
                <input
                  type="password"
                  name="password"
                  value={studentLogin.password}
                  onChange={handleStudentLoginChange}
                  placeholder="••••••••"
                  required
                />
              </div>

              <div className="login-actions">
                <button className="btn-primary" type="submit">
                  {t("login_as_student")}
                </button>
                <button
                  type="button"
                  className="link-button"
                  onClick={() => {
                    setView("landing");
                    setLoginError("");
                  }}
                >
                  {t("back_home")}
                </button>
              </div>

              {loginError && <div className="login-error">{loginError}</div>}
            </form>
          </div>
        )}

        {/* TECHNICIAN LOGIN */}
        {view === "technicianLogin" && (
          <div className="card login-card">
            <div className="login-title">{t("technician_login")}</div>
            <div className="login-subtitle">
              Demo credentials – Username: <b>tech1</b> or <b>tech2</b>,
              Password: <b>tech123</b>
            </div>

            <form onSubmit={handleTechnicianLoginSubmit}>
              <div className="form-col">
                <label>Username</label>
                <input
                  name="username"
                  value={technicianLogin.username}
                  onChange={handleTechnicianLoginChange}
                  placeholder="tech1"
                  required
                />
              </div>
              <div className="form-col">
                <label>Password</label>
                <input
                  type="password"
                  name="password"
                  value={technicianLogin.password}
                  onChange={handleTechnicianLoginChange}
                  placeholder="••••••••"
                  required
                />
              </div>

              <div className="login-actions">
                <button className="btn-primary" type="submit">
                  {t("login_as_technician")}
                </button>
              </div>

              {loginError && <div className="login-error">{loginError}</div>}

              <button
                type="button"
                className="link-button"
                onClick={() => {
                  setView("landing");
                  setLoginError("");
                }}
              >
                {t("back_home")}
              </button>
            </form>
          </div>
        )}

        {/* ADMIN LOGIN */}
        {view === "adminLogin" && (
          <div className="card login-card">
            <div className="login-title">{t("admin_login")}</div>
            <div className="login-subtitle">
              Demo credentials – Username: <b>admin</b>, Password:{" "}
              <b>admin123</b>
            </div>

            <form onSubmit={handleAdminLoginSubmit}>
              <div className="form-col">
                <label>Username</label>
                <input
                  name="username"
                  value={adminLogin.username}
                  onChange={handleAdminLoginChange}
                  placeholder="admin"
                  required
                />
              </div>
              <div className="form-col">
                <label>Password</label>
                <input
                  type="password"
                  name="password"
                  value={adminLogin.password}
                  onChange={handleAdminLoginChange}
                  placeholder="••••••••"
                  required
                />
              </div>

              <div className="login-actions">
                <button className="btn-primary" type="submit">
                  {t("login_as_admin")}
                </button>
                <button
                  type="button"
                  className="link-button"
                  onClick={() => {
                    setView("landing");
                    setLoginError("");
                  }}
                >
                  {t("back_home")}
                </button>
              </div>

              {loginError && <div className="login-error">{loginError}</div>}
            </form>
          </div>
        )}

        {/* STUDENT DASHBOARD */}
        {view === "studentDashboard" && (
          <>
            <div className="card">
              <div className="card-title">{t("raise_complaint")}</div>
              <div className="card-subtitle">
                Choose the issue category and describe the problem. Priority is
                auto-detected at the backend from your description.
              </div>

              <div className="issue-chips">
                {issuePresets.map((preset) => (
                  <button
                    key={preset.category}
                    type="button"
                    className={
                      "issue-chip" +
                      (form.category === preset.category ? " active" : "")
                    }
                    onClick={() =>
                      setForm((prev) => ({
                        ...prev,
                        category: preset.category,
                      }))
                    }
                  >
                    {preset.label}
                  </button>
                ))}
              </div>

              <form onSubmit={handleSubmitComplaint}>
                <div className="form-row">
                  <div className="form-col">
                    <label>Your Name</label>
                    <input
                      name="reporterName"
                      value={form.reporterName}
                      onChange={handleComplaintChange}
                      placeholder="e.g., Lalith C"
                      required
                    />
                  </div>
                  <div className="form-col">
                    <label>Your Email</label>
                    <input
                      type="email"
                      name="reporterEmail"
                      value={form.reporterEmail}
                      onChange={handleComplaintChange}
                      placeholder="you@bmsit.in"
                      required
                    />
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-col">
                    <label>Issue Title</label>
                    <input
                      name="title"
                      value={form.title}
                      onChange={handleComplaintChange}
                      placeholder="Water leakage near washroom"
                      required
                    />
                  </div>
                  <div className="form-col">
                    <label>Category</label>
                    <select
                      name="category"
                      value={form.category}
                      onChange={handleComplaintChange}
                    >
                      <option value="water">Water</option>
                      <option value="electricity">Electricity</option>
                      <option value="internet">Internet</option>
                      <option value="garbage">Garbage</option>
                      <option value="hostel">Hostel</option>
                      <option value="it">IT</option>
                      <option value="other">Other</option>
                    </select>
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-col">
                    <label>Description</label>
                    <textarea
                      name="description"
                      value={form.description}
                      onChange={handleComplaintChange}
                      placeholder="Explain what is happening, where, and how severe it is."
                      required
                    />
                  </div>
                  <div className="form-col">
                    <label>Image URL (optional)</label>
                    <input
                      name="imageUrl"
                      value={form.imageUrl}
                      onChange={handleComplaintChange}
                      placeholder="https://..."
                    />
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-col">
                    <label>Building / Block</label>
                    <input
                      name="building"
                      value={form.building}
                      onChange={handleComplaintChange}
                      placeholder="Hostel A / CS Block / Library..."
                      required
                    />
                  </div>
                  <div className="form-col">
                    <label>Room / Floor</label>
                    <input
                      name="room"
                      value={form.room}
                      onChange={handleComplaintChange}
                      placeholder="Room 207, 2nd Floor"
                    />
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-col">
                    <label>Latitude (optional)</label>
                    <input
                      name="lat"
                      value={form.lat}
                      onChange={handleComplaintChange}
                      placeholder="13.1339"
                    />
                  </div>
                  <div className="form-col">
                    <label>Longitude (optional)</label>
                    <input
                      name="lng"
                      value={form.lng}
                      onChange={handleComplaintChange}
                      placeholder="77.56802"
                    />
                  </div>
                </div>

                <button
                  className="btn-primary"
                  type="submit"
                  disabled={loading}
                >
                  {loading ? "Submitting..." : "Submit Complaint"}
                </button>

                {msg.text && (
                  <div
                    className={
                      "message " + (msg.type === "error" ? "error" : "success")
                    }
                  >
                    {msg.text}
                  </div>
                )}
              </form>
            </div>

            <div className="card">
              <div className="card-title">{t("recent_complaints")}</div>
              <div className="card-subtitle">
                Latest incidents with status, technician assignment and
                backend-generated priority.
              </div>

              {incidents.length > 0 && (
                <IncidentsFilterBar
                  filters={filters}
                  onChange={handleFilterChange}
                  buildings={buildingOptions}
                  t={t}
                />
              )}

              {filteredIncidents.length === 0 ? (
                <div style={{ fontSize: 13 }}>
                  No complaints yet or backend not connected / filtered out.
                </div>
              ) : (
                <table className="incidents-table">
                  <thead>
                    <tr>
                      <th>Title</th>
                      <th>Category</th>
                      <th>Building</th>
                      <th>Status</th>
                      <th>Priority</th>
                      <th>Technician</th>
                      <th>Tech Notes</th>
                      <th>Created</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredIncidents.map((inc) => (
                      <tr key={inc._id}>
                        <td>{inc.title}</td>
                        <td>{inc.category}</td>
                        <td>{inc.location?.building}</td>
                        <td>{statusBadge(inc.status)}</td>
                        <td>{priorityBadge(inc.priority)}</td>
                        <td>
                          {inc.assignedTechnician?.name ||
                            inc.assignedTechnician?.username ||
                            "-"}
                        </td>
                        <td style={{ fontSize: 11 }}>
                          {inc.techNotes
                            ? inc.techNotes.split("\n").slice(-1)[0]
                            : "-"}
                        </td>
                        <td>{new Date(inc.createdAt).toLocaleString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>

            <div className="card">
              <div className="card-title">{t("prediction_alerts")}</div>
              <div className="card-subtitle">
                Chance of future issues per building (based on last 60 days of
                complaints). Students see only risk percentage & expected days.
              </div>

              <PredictionPanelStudent predictions={predictions} />
            </div>

            {/* floating assistant button */}
            <button
              type="button"
              className="assistant-fab"
              onClick={() => setAssistantOpen(true)}
            >
              <span className="assistant-fab-icon">💬</span>
              <span className="assistant-fab-label">
                {t("chat_with_assistant")}
              </span>
            </button>
          </>
        )}

        {/* TECHNICIAN DASHBOARD */}
        {view === "technicianDashboard" && technicianInfo && (
          <>
            {(() => {
              const techUsername = technicianInfo.username;
              const myIncidents = incidents.filter(
                (inc) => inc.assignedTechnician?.username === techUsername
              );

              const total = myIncidents.length;
              const resolved = myIncidents.filter(
                (inc) => inc.status === "resolved"
              ).length;
              const pending = total - resolved;

              const todayStr = new Date().toDateString();
              const todayIncidents = myIncidents.filter(
                (inc) =>
                  new Date(inc.createdAt).toDateString() === todayStr
              );
              const todayNew = todayIncidents.filter(
                (inc) => inc.status === "new"
              ).length;
              const todayInProgress = todayIncidents.filter(
                (inc) => inc.status === "in_progress"
              ).length;
              const todayResolved = todayIncidents.filter(
                (inc) => inc.status === "resolved"
              ).length;

              const score = resolved * 10 - pending * 2;

              return (
                <div className="tech-grid">
                  <div className="card">
                    <div className="card-title">
                      My Assigned Incidents – {technicianInfo.name}
                    </div>
                    <div className="card-subtitle">
                      Update status from New → In Progress → Resolved. Start a
                      job to see live timer, and add notes that are visible to
                      admin / students.
                    </div>

                    {myIncidents.length === 0 ? (
                      <div style={{ fontSize: 13 }}>
                        No incidents assigned yet.
                      </div>
                    ) : (
                      <table className="incidents-table">
                        <thead>
                          <tr>
                            <th>Issue</th>
                            <th>Building</th>
                            <th>Category</th>
                            <th>Status</th>
                            <th>Priority</th>
                            <th>Note</th>
                            <th>Actions / Timer</th>
                          </tr>
                        </thead>
                        <tbody>
                          {myIncidents.map((inc) => {
                            const timerInfo = jobTimers[inc._id];
                            let timerLabel = "";
                            if (inc.status === "in_progress" && timerInfo?.startedAt) {
                              const ms =
                                (timerInfo.endedAt || nowTs) -
                                timerInfo.startedAt;
                              if (ms > 0) {
                                timerLabel = `⏱ ${formatDuration(
                                  ms
                                )} running`;
                              }
                            } else if (
                              inc.status === "resolved" &&
                              timerInfo?.startedAt
                            ) {
                              const ms =
                                (timerInfo.endedAt || nowTs) -
                                timerInfo.startedAt;
                              if (ms > 0) {
                                timerLabel = `✅ ${formatDuration(
                                  ms
                                )} total`;
                              }
                            }

                            return (
                              <tr key={inc._id}>
                                <td>{inc.title}</td>
                                <td>{inc.location?.building}</td>
                                <td>{inc.category}</td>
                                <td>{statusBadge(inc.status)}</td>
                                <td>{priorityBadge(inc.priority)}</td>
                                <td>
                                  <div className="tech-note-cell">
                                    <input
                                      className="tech-note-input"
                                      placeholder="Type a quick note for this job..."
                                      value={techNoteDrafts[inc._id] || ""}
                                      onChange={(e) =>
                                        setTechNoteDrafts((prev) => ({
                                          ...prev,
                                          [inc._id]: e.target.value,
                                        }))
                                      }
                                    />
                                    <div className="tech-note-actions">
                                      <button
                                        type="button"
                                        className="btn-secondary small-btn"
                                        onClick={() => handleSaveTechNote(inc)}
                                      >
                                        Save Note
                                      </button>
                                      {inc.techNotes && (
                                        <div className="tech-note-last">
                                          <div className="tech-note-last-label">
                                            Last note
                                          </div>
                                          <div className="tech-note-last-text">
                                            {inc.techNotes
                                              .split("\n")
                                              .slice(-1)[0]}
                                          </div>
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                </td>
                                <td>
                                  <div className="tech-actions">
                                    {timerLabel && (
                                      <div className="tech-job-timer">
                                        {timerLabel}
                                      </div>
                                    )}

                                    {inc.status === "new" && (
                                      <div className="tech-actions-buttons">
                                        <button
                                          type="button"
                                          className="btn-primary small-btn"
                                          onClick={() =>
                                            handleTechStartJob(inc)
                                          }
                                        >
                                          Start Job
                                        </button>
                                        <button
                                          type="button"
                                          className="btn-secondary small-btn"
                                          onClick={() =>
                                            handleTechResolveJob(inc)
                                          }
                                        >
                                          Resolve
                                        </button>
                                      </div>
                                    )}

                                    {inc.status === "in_progress" && (
                                      <div className="tech-actions-buttons">
                                        <button
                                          type="button"
                                          className="btn-primary small-btn"
                                          onClick={() =>
                                            handleTechResolveJob(inc)
                                          }
                                        >
                                          Mark Resolved
                                        </button>
                                      </div>
                                    )}

                                    {inc.status === "resolved" && (
                                      <span className="tech-actions-done">
                                        Done
                                      </span>
                                    )}
                                  </div>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    )}
                  </div>

                  <div className="card">
                    <div className="card-title">{t("tech_daily_summary")}</div>
                    <div className="card-subtitle">
                      Overview of your workload and completed jobs.
                    </div>

                    <div className="tech-metrics">
                      <div className="tech-metric">
                        <div className="tech-metric-label">Total Assigned</div>
                        <div className="tech-metric-value">{total}</div>
                      </div>
                      <div className="tech-metric">
                        <div className="tech-metric-label">Resolved</div>
                        <div className="tech-metric-value">{resolved}</div>
                      </div>
                      <div className="tech-metric">
                        <div className="tech-metric-label">
                          Pending / In Progress
                        </div>
                        <div className="tech-metric-value">{pending}</div>
                      </div>

                      <div className="tech-metric">
                        <div className="tech-metric-label">
                          Today - New / In Prog / Resolved
                        </div>
                        <div className="tech-metric-value">
                          {todayNew} / {todayInProgress} / {todayResolved}
                        </div>
                      </div>

                      <div className="tech-metric tech-metric-score">
                        <div className="tech-metric-label">
                          {t("tech_score_label")}
                        </div>
                        <div className="tech-metric-value">
                          {score < 0 ? 0 : score}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })()}
          </>
        )}

        {/* ADMIN DASHBOARD */}
        {view === "adminDashboard" && (
          <>
            <div className="admin-tabs">
              <button
                type="button"
                className={
                  adminSection === "overview"
                    ? "admin-tab admin-tab-active"
                    : "admin-tab"
                }
                onClick={() => setAdminSection("overview")}
              >
                Overview
              </button>
              <button
                type="button"
                className={
                  adminSection === "complaints"
                    ? "admin-tab admin-tab-active"
                    : "admin-tab"
                }
                onClick={() => setAdminSection("complaints")}
              >
                Complaints
              </button>
            </div>

            {/* --- OVERVIEW SECTION --- */}
            {adminSection === "overview" && (
              <>
                {(() => {
                  const resolvedIssues = incidents.filter(
                    (inc) => inc.status === "resolved"
                  ).length;
                  const pendingIssues = incidents.filter(
                    (inc) => inc.status !== "resolved"
                  ).length;

                  const health = computeCampusHealth(incidents, predictions);

                  return (
                    <div className="admin-stats-row">
                      <div className="admin-stat-card resolved">
                        <div className="admin-stat-label">
                          {t("problems_resolved")}
                        </div>
                        <div className="admin-stat-value">
                          {resolvedIssues}
                        </div>
                        <div className="admin-stat-sub">
                          Tickets closed successfully by technicians.
                        </div>
                      </div>
                      <div className="admin-stat-card pending">
                        <div className="admin-stat-label">
                          {t("problems_pending")}
                        </div>
                        <div className="admin-stat-value">
                          {pendingIssues}
                        </div>
                        <div className="admin-stat-sub">
                          Open issues across all buildings and categories.
                        </div>
                      </div>

                      {/* Campus Health Score */}
                      <div
                        className={`admin-stat-card health health-${health.tone}`}
                      >
                        <div className="admin-stat-label">
                          Campus Health Score
                        </div>
                        <div className="admin-stat-value">
                          {health.score}
                        </div>
                        <div className="admin-stat-sub">
                          {health.label} • {health.open} open issue(s)
                          {health.openHigh > 0 || health.openMedium > 0
                            ? ` (${health.openHigh} high, ${health.openMedium} medium)`
                            : ""}
                          {health.avgRisk > 0
                            ? ` • Avg predicted risk ${health.avgRisk}%`
                            : ""}
                        </div>
                      </div>
                    </div>
                  );
                })()}

                <div className="card">
                  <div className="card-title">{t("campus_issue_heatmap")}</div>
                  <div className="card-subtitle">
                    Live view of reported issues on the BMSIT campus map. Only
                    open / in-progress issues are shown.
                  </div>
                  <CampusIssueMap
                    incidents={incidents.filter(
                      (inc) => inc.status !== "resolved"
                    )}
                  />
                </div>

                <div className="card">
                  <div className="card-title">
                    {t("technician_performance_overview")}
                  </div>
                  <div className="card-subtitle">
                    Based on real incidents assigned from the backend.
                  </div>

                  <table className="incidents-table">
                    <thead>
                      <tr>
                        <th>Technician</th>
                        <th>Specialization</th>
                        <th>Total Assigned</th>
                        <th>Resolved</th>
                        <th>Pending</th>
                        <th>Score</th>
                      </tr>
                    </thead>
                    <tbody>
                      {DUMMY_TECHNICIANS.map((tech) => {
                        const techIncidents = incidents.filter(
                          (inc) => inc.assignedTechnician?.username === tech.id
                        );
                        const total = techIncidents.length;
                        const resolved = techIncidents.filter(
                          (inc) => inc.status === "resolved"
                        ).length;
                        const pending = total - resolved;
                        const score = resolved * 10 - pending * 2;

                        return (
                          <tr key={tech.id}>
                            <td>{tech.displayName}</td>
                            <td>{tech.specialization}</td>
                            <td>{total}</td>
                            <td>{resolved}</td>
                            <td>{pending}</td>
                            <td>{score < 0 ? 0 : score}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                <div className="card">
                  <div className="card-title">{t("prediction_alerts")}</div>
                  <div className="card-subtitle">
                    High-risk buildings and categories based purely on complaint
                    patterns (last 60 days). Admins see complete breakdown.
                  </div>

                  <PredictionPanelAdmin predictions={predictions} />
                </div>
              </>
            )}

            {/* --- COMPLAINTS SECTION --- */}
            {adminSection === "complaints" && (
              <div className="card">
                <div className="card-title">{t("all_complaints_admin")}</div>
                <div className="card-subtitle">
                  Monitor all incidents across campus with their status,
                  technician assignment and priority.
                </div>

                {incidents.length > 0 && (
                  <IncidentsFilterBar
                    filters={filters}
                    onChange={handleFilterChange}
                    buildings={buildingOptions}
                    t={t}
                  />
                )}

                {applyFilters(incidents, filters).length === 0 ? (
                  <div style={{ fontSize: 13 }}>
                    No complaints yet or filtered out / backend not connected.
                  </div>
                ) : (
                  <table className="incidents-table">
                    <thead>
                      <tr>
                        <th>Title</th>
                        <th>Category</th>
                        <th>Building</th>
                        <th>Status</th>
                        <th>Priority</th>
                        <th>Technician</th>
                        <th>Reporter</th>
                        <th>Tech Notes</th>
                        <th>Created</th>
                      </tr>
                    </thead>
                    <tbody>
                      {applyFilters(incidents, filters).map((inc) => (
                        <tr key={inc._id}>
                          <td>{inc.title}</td>
                          <td>{inc.category}</td>
                          <td>{inc.location?.building}</td>
                          <td>{statusBadge(inc.status)}</td>
                          <td>{priorityBadge(inc.priority)}</td>
                          <td>
                            {inc.assignedTechnician?.name ||
                              inc.assignedTechnician?.username ||
                              "-"}
                          </td>
                          <td>{inc.createdBy?.name || "Unknown"}</td>
                          <td style={{ fontSize: 11 }}>
                            {inc.techNotes
                              ? inc.techNotes.split("\n").slice(-1)[0]
                              : "-"}
                          </td>
                          <td>{new Date(inc.createdAt).toLocaleString()}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            )}
          </>
        )}

        {/* VIRTUAL ASSISTANT PANEL (student side only) */}
        {assistantOpen && view === "studentDashboard" && (
          <VirtualAssistantChat
            messages={assistantMessages}
            input={assistantInput}
            onInputChange={setAssistantInput}
            onSend={handleAssistantSend}
            onClose={() => setAssistantOpen(false)}
          />
        )}
      </main>
    </div>
  );
}

export default App;
