import React from "react";
import { BrowserRouter, Routes, Route, Link, useParams } from "react-router-dom";
import { beaches } from "./data/beaches.js";
import { mockReports } from "./data/mockReports.js";

/* =======================
   Utils: 24h counters
======================= */
function countsFromReports(reports) {
  const counts = { green: 0, orange: 0, red: 0 };
  for (const r of reports) {
    if (r.level === 1) counts.green += 1;
    else if (r.level === 2) counts.orange += 1;
    else if (r.level === 3) counts.red += 1;
  }
  return counts;
}

function timeAgo(ts) {
  const diff = Date.now() - ts;
  const min = Math.floor(diff / 60000);
  if (min < 1) return "à l’instant";
  if (min < 60) return `${min} min`;
  const h = Math.floor(min / 60);
  return `${h} h`;
}

function getBeachStatsFromReports(allReports, beachId) {
  const now = Date.now();
  const window24h = 24 * 60 * 60 * 1000;

  const recent = allReports.filter(
    (r) => r.beachId === beachId && now - r.ts <= window24h
  );

  const lastTs = recent.length ? Math.max(...recent.map((r) => r.ts)) : null;

  const sarg = recent.filter((r) => r.type === "sargasses");
  const rain = recent.filter((r) => r.type === "rain");
  const swim = recent.filter((r) => r.type === "swim");

  return {
    updatedAgo: lastTs ? timeAgo(lastTs) : "—",
    sargasses: countsFromReports(sarg),
    rain: countsFromReports(rain),
    swim: countsFromReports(swim),
  };
}

/* =======================
   Utils: decision + reliability (2h)
======================= */
function computeDecision(beachReports, type, windowMs = 2 * 60 * 60 * 1000) {
  const now = Date.now();

  const recent = beachReports.filter((r) => r.type === type && now - r.ts <= windowMs);

  if (recent.length === 0) {
    return {
      level: 0,
      reliability: "faible",
      count: 0,
      windowLabel: windowMs === 2 * 60 * 60 * 1000 ? "2 h" : "fenêtre",
    };
  }

  const counts = { 1: 0, 2: 0, 3: 0 };
  for (const r of recent) counts[r.level]++;

  // Dominante + prudence en cas d'égalité: 3 > 2 > 1
  let dominant = 1;
  if (counts[3] >= counts[2] && counts[3] >= counts[1]) dominant = 3;
  else if (counts[2] >= counts[1]) dominant = 2;

  let reliability = "faible";
  if (recent.length >= 4) reliability = "élevée";
  else if (recent.length >= 2) reliability = "moyenne";

  return {
    level: dominant,
    reliability,
    count: recent.length,
    windowLabel: windowMs === 2 * 60 * 60 * 1000 ? "2 h" : "fenêtre",
  };
}

/* =======================
   UI: Layout
======================= */
function Layout({ children }) {
  return (
    <div style={{ fontFamily: "system-ui", maxWidth: 560, margin: "0 auto", padding: 16 }}>
      <header style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
        <Link to="/" style={{ textDecoration: "none", color: "black", fontWeight: 900, fontSize: 18 }}>
          Gwada+
        </Link>
        <button
          type="button"
          title="Compte"
          style={{
            border: "1px solid #ddd",
            background: "white",
            borderRadius: 999,
            padding: "6px 10px",
            cursor: "pointer",
          }}
          onClick={() => alert("Connexion / Mon compte (plus tard)")}
        >
          👤
        </button>
      </header>

      {children}
    </div>
  );
}

/* =======================
   Screen: Map
======================= */
function MapScreen() {
  const [query, setQuery] = React.useState("");
  const q = query.trim().toLowerCase();

  const filtered = beaches.filter((b) => {
    const name = b.name.toLowerCase();
    const town = b.town.toLowerCase();
    return !q || name.includes(q) || town.includes(q);
  });

  return (
    <Layout>
      <h2 style={{ margin: "8px 0 12px" }}>Plages</h2>

      <div style={{ marginBottom: 12 }}>
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Rechercher une plage ou une commune…"
          style={{
            width: "100%",
            padding: "12px 12px",
            borderRadius: 12,
            border: "1px solid #ddd",
            outline: "none",
            fontSize: 14,
          }}
        />
      </div>

      <div style={{ color: "#666", fontSize: 13, marginBottom: 10 }}>
        {filtered.length} résultat{filtered.length > 1 ? "s" : ""}
      </div>

      <div style={{ display: "grid", gap: 10 }}>
        {filtered.map((b) => (
          <Link
            key={b.id}
            to={`/beach/${b.id}`}
            style={{
              textDecoration: "none",
              color: "black",
              border: "1px solid #eee",
              borderRadius: 12,
              padding: 12,
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              background: "white",
            }}
          >
            <div>
              <div style={{ fontWeight: 900 }}>{b.name}</div>
              <div style={{ color: "#666", fontSize: 13 }}>{b.town}</div>
            </div>
            <span style={{ fontSize: 18 }}>›</span>
          </Link>
        ))}
      </div>
    </Layout>
  );
}

/* =======================
   Screen: Beach (details + decisions)
======================= */
function BeachScreen({ reports }) {
  const { beachId } = useParams();
  const beach = beaches.find((b) => b.id === beachId);

  if (!beach) {
    return (
      <Layout>
        <p>Plage introuvable.</p>
        <Link to="/">← Retour</Link>
      </Layout>
    );
  }

  const stats24 = getBeachStatsFromReports(reports, beach.id);

  // IMPORTANT: décisions basées sur les reports de CETTE plage
  const beachReports = reports.filter((r) => r.beachId === beach.id);

  const sargDecision = computeDecision(beachReports, "sargasses"); // 2h
  const rainDecision = computeDecision(beachReports, "rain");      // 2h
  const swimDecision = computeDecision(beachReports, "swim");      // 2h

  return (
    <Layout>
      <h2 style={{ margin: "8px 0 4px" }}>{beach.name}</h2>
      <div style={{ color: "#666", marginBottom: 12 }}>{beach.town}</div>

      <div style={{ border: "1px solid #eee", borderRadius: 14, padding: 12, background: "white", marginBottom: 12 }}>
        <strong>État actuel (prototype)</strong>
        <div style={{ marginTop: 6, display: "flex", gap: 8 }}>
          <span>🧾</span>
          <span>Basé sur les signalements</span>
          <span style={{ marginLeft: "auto", color: "#666", fontSize: 13 }}>
            Maj : {stats24.updatedAgo}
          </span>
        </div>
      </div>

      {/* Conseils + fiabilité (fenêtre 2h) */}
      <DecisionBlock
        title="Baignade"
        decision={swimDecision}
        icons={{ 1: "🟢", 2: "🟠", 3: "🔴" }}
        messages={{
          1: "Baignade OK",
          2: "Baignade à surveiller",
          3: "Baignade déconseillée",
        }}
      />

      <DecisionBlock
        title="Sargasses"
        decision={sargDecision}
        icons={{ 1: "🟢", 2: "🟠", 3: "🔴" }}
        messages={{
          1: "Plage praticable",
          2: "Sargasses modérées",
          3: "Plage envahie",
        }}
      />

      <DecisionBlock
        title="Pluie"
        decision={rainDecision}
        icons={{ 1: "☀️", 2: "🌦️", 3: "🌧️" }}
        messages={{
          1: "Temps sec",
          2: "Averses possibles",
          3: "Pluie marquée",
        }}
      />

      {/* Détail brut 24h (compteurs) */}
      <Section title="Sargasses (24 h)" counts={stats24.sargasses} icons={{ g: "🟢", o: "🟠", r: "🔴" }} />
      <Section title="Pluie (24 h)" counts={stats24.rain} icons={{ g: "☀️", o: "🌦️", r: "🌧️" }} />
      <Section title="Baignade (24 h)" counts={stats24.swim} icons={{ g: "🟢", o: "🟠", r: "🔴" }} />

      <div style={{ marginTop: 14, display: "flex", gap: 10, alignItems: "center" }}>
        <span style={{ color: "#444" }}>Infos utiles ?</span>
        <button type="button" onClick={() => alert("👍 enregistré (plus tard)")} style={thumbStyle}>
          👍
        </button>
        <button type="button" onClick={() => alert("👎 enregistré (plus tard)")} style={thumbStyle}>
          👎
        </button>
      </div>

      <Link
        to={`/beach/${beach.id}/report`}
        style={{
          marginTop: 16,
          display: "block",
          textAlign: "center",
          textDecoration: "none",
          background: "black",
          color: "white",
          padding: "12px 14px",
          borderRadius: 12,
          fontWeight: 900,
        }}
      >
        ➕ Signaler
      </Link>

      <div style={{ marginTop: 16 }}>
        <Link to="/" style={{ color: "#444" }}>
          ← Retour à la liste
        </Link>
      </div>
    </Layout>
  );
}

/* =======================
   Screen: Report (Sargasses + Pluie + Baignade)
======================= */
function ReportScreen({ addReports }) {
  const { beachId } = useParams();
  const beach = beaches.find((b) => b.id === beachId);

  const [sargasses, setSargasses] = React.useState(0);
  const [rain, setRain] = React.useState(0);
  const [swim, setSwim] = React.useState(0);

  function toggle(setter, current, value) {
    setter(current === value ? 0 : value);
  }

  function submit() {
    if (!sargasses && !rain && !swim) {
      alert("Choisis au moins 1 info à signaler 🙂");
      return;
    }

    const ts = Date.now();
    const batch = [];

    if (sargasses) batch.push({ beachId, type: "sargasses", level: sargasses, ts });
    if (rain) batch.push({ beachId, type: "rain", level: rain, ts });
    if (swim) batch.push({ beachId, type: "swim", level: swim, ts });

    addReports(batch);
    window.location.href = `/beach/${beachId}`;
  }

  const canSend = !!(sargasses || rain || swim);

  return (
    <Layout>
      <h2 style={{ margin: "8px 0 4px" }}>Signaler</h2>
      <div style={{ color: "#666", marginBottom: 12 }}>
        {beach ? beach.name : "Plage inconnue"}
      </div>

      <Card title="Sargasses">
        <PickButton active={sargasses === 1} onClick={() => toggle(setSargasses, sargasses, 1)} icon="🟢" label="Aucune" />
        <PickButton active={sargasses === 2} onClick={() => toggle(setSargasses, sargasses, 2)} icon="🟠" label="Modérées" />
        <PickButton active={sargasses === 3} onClick={() => toggle(setSargasses, sargasses, 3)} icon="🔴" label="Importantes" />
      </Card>

      <Card title="Pluie sur place">
        <PickButton active={rain === 1} onClick={() => toggle(setRain, rain, 1)} icon="☀️" label="Pas de pluie" />
        <PickButton active={rain === 2} onClick={() => toggle(setRain, rain, 2)} icon="🌦️" label="Averses" />
        <PickButton active={rain === 3} onClick={() => toggle(setRain, rain, 3)} icon="🌧️" label="Forte pluie" />
      </Card>

      <Card title="Baignade (drapeaux)">
        <PickButton active={swim === 1} onClick={() => toggle(setSwim, swim, 1)} icon="🟢" label="Drapeau vert" />
        <PickButton active={swim === 2} onClick={() => toggle(setSwim, swim, 2)} icon="🟠" label="Drapeau jaune" />
        <PickButton active={swim === 3} onClick={() => toggle(setSwim, swim, 3)} icon="🔴" label="Drapeau rouge" />
      </Card>

      <button
        type="button"
        onClick={submit}
        disabled={!canSend}
        style={{
          width: "100%",
          marginTop: 12,
          background: canSend ? "black" : "#999",
          color: "white",
          border: "none",
          borderRadius: 12,
          padding: 12,
          fontWeight: 900,
          cursor: canSend ? "pointer" : "not-allowed",
        }}
      >
        Envoyer le signalement
      </button>

      <div style={{ marginTop: 16 }}>
        <Link to={`/beach/${beachId}`} style={{ color: "#444" }}>
          ← Retour fiche plage
        </Link>
      </div>
    </Layout>
  );
}

/* =======================
   Components: Decision + Cards + Counters
======================= */
function DecisionBlock({ title, decision, messages, icons }) {
  if (decision.level === 0) {
    return (
      <div style={decisionBox}>
        <div style={{ fontWeight: 900 }}>{title}</div>
        <div style={{ color: "#666", marginTop: 4 }}>
          Pas assez d’infos récentes ({decision.windowLabel})
        </div>
        <div style={{ color: "#666", marginTop: 4, fontSize: 13 }}>
          Fiabilité {decision.reliability}
        </div>
      </div>
    );
  }

  const icon = icons[decision.level];
  const text = messages[decision.level];

  return (
    <div style={decisionBox}>
      <div style={{ fontWeight: 900 }}>
        {icon} {title} — {text}
      </div>
      <div style={{ color: "#666", marginTop: 4, fontSize: 13 }}>
        Fiabilité {decision.reliability} — {decision.count} signalement{decision.count > 1 ? "s" : ""} ({decision.windowLabel})
      </div>
    </div>
  );
}

const decisionBox = {
  border: "1px solid #ddd",
  borderRadius: 14,
  padding: 12,
  background: "#fafafa",
  marginBottom: 12,
};

function Card({ title, children }) {
  return (
    <div
      style={{
        border: "1px solid #eee",
        borderRadius: 14,
        padding: 12,
        background: "white",
        marginBottom: 10,
      }}
    >
      <div style={{ fontWeight: 900, marginBottom: 8 }}>{title}</div>
      <div style={{ display: "grid", gap: 8 }}>{children}</div>
      <div style={{ marginTop: 8, color: "#666", fontSize: 12 }}>
        (Retape sur le même choix pour l’enlever)
      </div>
    </div>
  );
}

function PickButton({ active, onClick, icon, label }) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: 10,
        padding: "10px 12px",
        borderRadius: 12,
        border: active ? "2px solid black" : "1px solid #ddd",
        background: active ? "#f4f4f4" : "white",
        cursor: "pointer",
        textAlign: "left",
      }}
    >
      <span style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <span>{icon}</span>
        <span style={{ fontWeight: 900 }}>{label}</span>
      </span>
      <span style={{ color: "#666", fontSize: 12 }}>{active ? "Sélectionné" : ""}</span>
    </button>
  );
}

function Section({ title, counts, icons }) {
  return (
    <div style={{ border: "1px solid #eee", borderRadius: 14, padding: 12, background: "white", marginBottom: 10 }}>
      <div style={{ fontWeight: 900, marginBottom: 8 }}>{title}</div>
      <div style={{ display: "flex", gap: 14, alignItems: "center" }}>
        <Stat icon={icons.g} value={counts.green} />
        <Stat icon={icons.o} value={counts.orange} />
        <Stat icon={icons.r} value={counts.red} />
      </div>
    </div>
  );
}

function Stat({ icon, value }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 6, minWidth: 70 }}>
      <span>{icon}</span>
      <span style={{ fontWeight: 900 }}>{value}</span>
    </div>
  );
}

const thumbStyle = {
  border: "1px solid #ddd",
  background: "white",
  borderRadius: 10,
  padding: "6px 10px",
  cursor: "pointer",
};

/* =======================
   App: state + routes
======================= */
export default function App() {
  const [reports, setReports] = React.useState(() => {
    const saved = localStorage.getItem("gwada_reports_v1");
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {
        return mockReports;
      }
    }
    return mockReports;
  });

  React.useEffect(() => {
    localStorage.setItem("gwada_reports_v1", JSON.stringify(reports));
  }, [reports]);

  function addReports(newReports) {
    setReports((prev) => [...prev, ...newReports]);
  }

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<MapScreen />} />
        <Route path="/beach/:beachId" element={<BeachScreen reports={reports} />} />
        <Route path="/beach/:beachId/report" element={<ReportScreen addReports={addReports} />} />
      </Routes>
    </BrowserRouter>
  );
}
