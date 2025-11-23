// backend/server.js
require("dotenv").config();
const express = require("express");
const cors = require("cors");
const { createClient } = require("@supabase/supabase-js");

const app = express();
const PORT = process.env.PORT || 4000;

// ---- Supabase client ----
if (!process.env.SUPABASE_URL || !process.env.SUPABASE_ANON_KEY) {
  console.error("❌ Missing SUPABASE_URL or SUPABASE_ANON_KEY in .env");
  process.exit(1);
}

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);

// ---- Middleware ----
app.use(cors());
app.use(express.json());

// ================== DEBUG ROUTES ==================

// TEMP: list all students (to verify passwords etc)
app.get("/api/debug/students", async (req, res) => {
  const { data, error } = await supabase
    .from("students")
    .select("id, usn, name, email, password")
    .order("usn");

  if (error) {
    console.error("DEBUG students error:", error);
    return res.status(500).json({ error: error.message });
  }

  console.log("DEBUG students data:", data);
  res.json(data);
});

// ================== AUTH – STUDENT LOGIN ==================

app.post("/api/auth/student-login", async (req, res) => {
  const { usn, password } = req.body;

  console.log("LOGIN ATTEMPT:", {
    usn,
    password,
    passwordType: typeof password,
  });

  if (!usn || !password) {
    return res
      .status(400)
      .json({ message: "USN and password are required." });
  }

  const usnTrimmed = usn.trim();

  try {
    const { data, error } = await supabase
      .from("students")
      .select("id, usn, name, password")
      .ilike("usn", usnTrimmed)
      .single();

    console.log("SUPABASE RESULT:", {
      data,
      error,
      dbPasswordType: data && typeof data.password,
    });

    if (error || !data) {
      return res.status(401).json({ message: "Invalid USN or password." });
    }

    const dbPassword =
      data.password === null || data.password === undefined
        ? null
        : String(data.password);
    const incomingPassword = String(password);

    if (!dbPassword || dbPassword !== incomingPassword) {
      return res.status(401).json({ message: "Invalid USN or password." });
    }

    return res.json({
      id: data.id,
      usn: data.usn,
      name: data.name,
    });
  } catch (err) {
    console.error("Student login server error:", err);
    return res
      .status(500)
      .json({ message: "Server error during login." });
  }
});

// ================== INCIDENTS (Supabase) ==================

// ---- Priority helper ----
function detectPriority({ title = "", description = "", category }) {
  const text = (title + " " + description).toLowerCase();

  const highWords = [
    "fire",
    "shock",
    "sparking",
    "major leak",
    "flood",
    "urgent",
    "danger",
    "emergency",
    "short circuit",
    "lift stuck",
    "lift not working",
  ];
  const mediumWords = [
    "leak",
    "slow",
    "intermittent",
    "drop",
    "unstable",
    "smell",
    "noise",
  ];

  if (highWords.some((w) => text.includes(w))) return "high";
  if (mediumWords.some((w) => text.includes(w))) return "medium";

  if (category === "electricity" || category === "water") return "medium";
  return "low";
}

// ---- Technician auto-assignment (uses technicians table) ----
async function autoAssignTechnician({ category = "", description = "" }) {
  const desc = (description || "").toLowerCase();
  const catLower = (category || "").toLowerCase();

  let neededSkill = "general";

  if (
    catLower === "electricity" ||
    desc.includes("electrical") ||
    desc.includes("lift")
  ) {
    neededSkill = "electrical";
  } else if (
    catLower === "water" ||
    desc.includes("leak") ||
    desc.includes("pipe")
  ) {
    neededSkill = "plumbing";
  } else if (
    catLower === "hostel" ||
    catLower === "garbage" ||
    desc.includes("civil")
  ) {
    neededSkill = "civil";
  } else if (
    catLower === "internet" ||
    catLower === "it" ||
    desc.includes("wifi") ||
    desc.includes("network")
  ) {
    neededSkill = "network";
  }

  const { data: technicians, error: techError } = await supabase
    .from("technicians")
    .select("id, display_name, specialization");

  if (techError || !technicians || technicians.length === 0) {
    console.error(
      "Error fetching technicians, using simple fallback:",
      techError
    );

    if (["water", "hostel", "garbage"].includes(catLower)) {
      return { username: "tech2", name: "Technician 2" };
    }
    return { username: "tech1", name: "Technician 1" };
  }

  const { data: openIncidents, error: incError } = await supabase
    .from("incidents")
    .select("assigned_technician_username, status")
    .in("status", ["new", "in_progress"]);

  const workload = {};
  if (!incError && openIncidents) {
    for (const inc of openIncidents) {
      const u = inc.assigned_technician_username;
      if (!u) continue;
      workload[u] = (workload[u] || 0) + 1;
    }
  }

  function scoreTech(t) {
    const spec = (t.specialization || "").toLowerCase();
    let score = 0;

    if (neededSkill === "electrical") {
      if (spec.includes("electrical")) score += 10;
      if (spec.includes("lift")) score += 8;
    } else if (neededSkill === "plumbing") {
      if (spec.includes("plumbing")) score += 10;
    } else if (neededSkill === "civil") {
      if (spec.includes("civil")) score += 10;
      if (spec.includes("plumbing")) score += 6;
    } else if (neededSkill === "network") {
      if (spec.includes("network") || spec.includes("it")) score += 10;
      if (spec.includes("electrical")) score += 5;
    } else if (neededSkill === "general") {
      score += 5;
    }

    return score;
  }

  let best = null;

  for (const t of technicians) {
    const s = scoreTech(t);
    if (s <= 0) continue;

    const load = workload[t.id] || 0;

    if (
      !best ||
      s > best.score ||
      (s === best.score && load < best.load)
    ) {
      best = {
        username: t.id,
        name: t.display_name || t.id,
        score: s,
        load,
      };
    }
  }

  if (best) {
    return { username: best.username, name: best.name };
  }

  const t0 = technicians[0];
  return { username: t0.id, name: t0.display_name || t0.id };
}

// Format DB row → shape expected by frontend
function formatIncidentRow(row) {
  return {
    _id: row.id,
    title: row.title,
    category: row.category,
    description: row.description,
    imageUrl: row.image_url,
    location: {
      building: row.building,
      room: row.room,
      lat: row.lat,
      lng: row.lng,
    },
    status: row.status,
    priority: row.priority,
    createdBy: {
      name: row.reporter_name,
      email: row.reporter_email,
    },
    assignedTechnician: row.assigned_technician_username
      ? {
          username: row.assigned_technician_username,
          name: row.assigned_technician_name,
        }
      : null,
    assignedAt: row.assigned_at,
    techNotes: row.tech_notes || "",
    createdAt: row.created_at,
  };
}

// ---- Health check ----
app.get("/", (req, res) => {
  res.json({ status: "ok", message: "Smart maintenance API running" });
});

// ---- GET /api/incidents ----
app.get("/api/incidents", async (req, res) => {
  try {
    const { data, error } = await supabase
      .from("incidents")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching incidents:", error);
      return res
        .status(500)
        .json({ message: "Error fetching incidents from database." });
    }

    const formatted = (data || []).map(formatIncidentRow);
    res.json(formatted);
  } catch (err) {
    console.error("Server error in GET /api/incidents:", err);
    res.status(500).json({ message: "Server error while fetching incidents." });
  }
});

// ---- POST /api/incidents ----
app.post("/api/incidents", async (req, res) => {
  try {
    const {
      reporterName,
      reporterEmail,
      title,
      category,
      description,
      imageUrl,
      building,
      room,
      lat,
      lng,
    } = req.body || {};

    if (!reporterName || !reporterEmail) {
      return res
        .status(400)
        .json({ message: "Reporter name and email are required." });
    }

    if (!title || !category) {
      return res
        .status(400)
        .json({ message: "Issue title and category are mandatory." });
    }

    if (!description && !imageUrl) {
      return res.status(400).json({
        message: "Either description or image URL must be provided.",
      });
    }

    if (!building) {
      return res
        .status(400)
        .json({ message: "Building / block is required." });
    }

    let parsedLat = null;
    let parsedLng = null;
    if (lat !== null && lat !== undefined && lat !== "") {
      const num = Number(lat);
      if (!Number.isNaN(num)) parsedLat = num;
    }
    if (lng !== null && lng !== undefined && lng !== "") {
      const num = Number(lng);
      if (!Number.isNaN(num)) parsedLng = num;
    }

    const priority = detectPriority({ title, description, category });

    const tech = await autoAssignTechnician({ category, description });
    const assignedAt = new Date().toISOString();

    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();

    const { data: recent, error: dupError } = await supabase
      .from("incidents")
      .select("id")
      .eq("reporter_email", reporterEmail)
      .eq("category", category)
      .eq("building", building)
      .gte("created_at", oneHourAgo);

    if (dupError) {
      console.error("Error checking duplicates:", dupError);
    } else if (recent && recent.length > 0) {
      return res.status(400).json({
        message:
          "Similar complaint already raised recently for this building and category. Please wait before raising again.",
      });
    }

    const { data, error } = await supabase
      .from("incidents")
      .insert([
        {
          title,
          category,
          description,
          image_url: imageUrl || null,
          building,
          room: room || null,
          lat: parsedLat,
          lng: parsedLng,
          status: "new",
          priority,
          reporter_name: reporterName,
          reporter_email: reporterEmail,
          assigned_technician_username: tech.username,
          assigned_technician_name: tech.name,
          assigned_at: assignedAt,
          tech_notes: null,
        },
      ])
      .select("*")
      .single();

    if (error) {
      console.error("Error inserting incident:", error);
      return res
        .status(500)
        .json({ message: "Error saving incident to database." });
    }

    const formatted = formatIncidentRow(data);
    res.status(201).json(formatted);
  } catch (err) {
    console.error("Server error in POST /api/incidents:", err);
    res.status(500).json({ message: "Server error while creating incident." });
  }
});

// ---- PATCH /api/incidents/:id/status ----
app.patch("/api/incidents/:id/status", async (req, res) => {
  const { id } = req.params;
  const { status, note, technicianUsername } = req.body || {};

  const allowedStatuses = ["new", "in_progress", "resolved"];
  if (!status || !allowedStatuses.includes(status)) {
    return res
      .status(400)
      .json({ message: "Invalid status value provided." });
  }

  try {
    const { data: existing, error: fetchError } = await supabase
      .from("incidents")
      .select("tech_notes")
      .eq("id", id)
      .single();

    if (fetchError) {
      console.error("Error reading existing notes:", fetchError);
    }

    let combinedNotes = existing?.tech_notes || null;

    if (note && technicianUsername) {
      const ts = new Date().toISOString();
      const line = `[${ts}] ${technicianUsername} -> ${status}: ${note}`;
      combinedNotes = combinedNotes ? `${combinedNotes}\n${line}` : line;
    }

    const updatePayload = {
      status,
      tech_notes: combinedNotes,
    };

    const { data, error } = await supabase
      .from("incidents")
      .update(updatePayload)
      .eq("id", id)
      .select("*")
      .single();

    if (error) {
      console.error("Error updating incident status:", error);
      return res
        .status(500)
        .json({ message: "Error updating incident status." });
    }

    if (!data) {
      return res.status(404).json({ message: "Incident not found." });
    }

    const formatted = formatIncidentRow(data);
    res.json(formatted);
  } catch (err) {
    console.error("Server error in PATCH /api/incidents/:id/status:", err);
    res
      .status(500)
      .json({ message: "Server error while updating incident status." });
  }
});

// ---- GET /api/incidents/predictions ----
// Purely data-based (no external ML): uses last 60 days of complaints.
app.get("/api/incidents/predictions", async (req, res) => {
  try {
    const DAYS_LOOKBACK = 60; // how many past days we analyse
    const RISK_WINDOW_DAYS = 7; // risk window for "next X days"

    const sinceIso = new Date(
      Date.now() - DAYS_LOOKBACK * 24 * 60 * 60 * 1000
    ).toISOString();

    const { data, error } = await supabase
      .from("incidents")
      .select("building, category, created_at, status, priority")
      .gte("created_at", sinceIso);

    if (error) {
      console.error("Error fetching incidents for predictions:", error);
      return res
        .status(500)
        .json({ message: "Error calculating prediction alerts." });
    }

    if (!data || data.length === 0) {
      return res.json({ alerts: [] });
    }

    // Group by (building, category)
    const groups = {};
    for (const row of data) {
      const building = row.building || "Unknown";
      const category = row.category || "other";
      const key = `${building}::${category}`;

      if (!groups[key]) {
        groups[key] = {
          building,
          category,
          totalCount: 0,
          openCount: 0,
          highPriorityCount: 0,
          lastReportedAt: null,
        };
      }
      const g = groups[key];
      g.totalCount += 1;
      if (row.status !== "resolved") g.openCount += 1;
      if (row.priority === "high") g.highPriorityCount += 1;

      if (!g.lastReportedAt || row.created_at > g.lastReportedAt) {
        g.lastReportedAt = row.created_at;
      }
    }

    const alerts = Object.values(groups)
      .map((g) => {
        const { totalCount, highPriorityCount } = g;

        // λ = avg complaints per day
        const lambdaPerDay =
          totalCount > 0 ? totalCount / DAYS_LOOKBACK : 0;

        // Poisson model: P(at least one incident in next RISK_WINDOW_DAYS)
        const riskProbability =
          lambdaPerDay > 0
            ? 1 - Math.exp(-lambdaPerDay * RISK_WINDOW_DAYS)
            : 0;

        const riskProbabilityPercent = Math.round(
          riskProbability * 100
        );

        // Expected days between incidents = 1 / λ
        const expectedDaysBetweenIncidents =
          lambdaPerDay > 0
            ? Math.round(1 / lambdaPerDay)
            : null;

        let riskLabel = "low";
        if (riskProbabilityPercent >= 70 || highPriorityCount >= 3) {
          riskLabel = "high";
        } else if (
          riskProbabilityPercent >= 40 ||
          highPriorityCount >= 1 ||
          totalCount >= 3
        ) {
          riskLabel = "medium";
        }

        let message;
        if (riskLabel === "high") {
          message = `High risk of ${g.category} issues in ${g.building} – ${totalCount} complaint(s) in the last ${DAYS_LOOKBACK} days.`;
        } else if (riskLabel === "medium") {
          message = `Medium risk of ${g.category} issues in ${g.building} (${totalCount} complaint(s) in the last ${DAYS_LOOKBACK} days).`;
        } else {
          message = `Low risk in ${g.building} – only ${totalCount} ${g.category} complaint(s) recently.`;
        }

        if (riskProbabilityPercent > 0) {
          message += ` Based on this history, there is about a ${riskProbabilityPercent}% chance of at least one more ${g.category} complaint in the next ${RISK_WINDOW_DAYS} days.`;
        }

        return {
          building: g.building,
          category: g.category,
          totalCount: g.totalCount,
          openCount: g.openCount,
          highPriorityCount: g.highPriorityCount,
          lastReportedAt: g.lastReportedAt,
          riskLabel,
          riskWindowDays: RISK_WINDOW_DAYS,
          riskProbabilityPercent,
          expectedDaysBetweenIncidents,
          message,
        };
      })
      // sort highest risk first
      .sort(
        (a, b) =>
          b.riskProbabilityPercent - a.riskProbabilityPercent
      );

    res.json({ alerts });
  } catch (err) {
    console.error("Server error in GET /api/incidents/predictions:", err);
    res
      .status(500)
      .json({ message: "Server error while calculating predictions." });
  }
});

// ================== START SERVER ==================
app.listen(PORT, () => {
  console.log(`✅ Backend server running on http://localhost:${PORT}`);
});

