import React from "react";
import { Link, useNavigate } from "react-router-dom";
import Layout from "../components/Layout.jsx";
import { beaches } from "../data/beaches.js";

import { markerColorForBeach } from "../utils/reports.js";

import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";

import { TransformWrapper, TransformComponent } from "react-zoom-pan-pinch";

function clamp(n, a, b) {
  return Math.max(a, Math.min(b, n));
}

function textColorForBg(bg) {
  if (!bg) return "#111";
  const x = bg.replace("#", "");
  const r = parseInt(x.slice(0, 2), 16);
  const g = parseInt(x.slice(2, 4), 16);
  const b = parseInt(x.slice(4, 6), 16);
  const yiq = (r * 299 + g * 587 + b * 114) / 1000;
  return yiq >= 160 ? "#111" : "white";
}

function BeachRow({ b, reports, onGo }) {
  const bg = markerColorForBeach(reports, b.id);
  const color = textColorForBg(bg);

  return (
    <button
      type="button"
      onClick={() => onGo(b.id)}
      className="w-full flex items-center justify-between rounded-xl border bg-white px-3 py-2 text-left active:scale-[0.99]"
    >
      <div className="min-w-0">
        <div className="font-semibold truncate">{b.name}</div>
        <div className="text-xs text-muted-foreground truncate">
          {b.town} • {b.island}
        </div>
      </div>

      <span
        className="ml-3 inline-flex items-center rounded-full px-2 py-1 text-xs font-semibold"
        style={{ background: bg, color }}
        title="Couleur selon signalements récents"
      >
        ●
      </span>
    </button>
  );
}

export default function MapScreen({ userPosition, gpsError, reports }) {
  const navigate = useNavigate();

  const [query, setQuery] = React.useState("");
  const q = query.trim().toLowerCase();
  const showSuggestions = q.length > 0;

  const filtered = React.useMemo(() => {
    if (!showSuggestions) return [];
    return beaches
      .filter((b) => {
        const name = b.name.toLowerCase();
        const town = b.town.toLowerCase();
        return name.includes(q) || town.includes(q);
      })
      .slice(0, 8);
  }, [q, showSuggestions]);

  const markers = React.useMemo(() => {
    return beaches.map((b) => (b.map ? b : null)).filter(Boolean);
  }, []);

  const [scale, setScale] = React.useState(1);

  function goBeach(id) {
    navigate(`/beach/${id}`);
  }

  return (
    <Layout>
      {/* Search + list button */}
      <div className="space-y-3">
        <div className="relative">
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Rechercher une plage ou une commune…"
            className="w-full rounded-2xl border bg-white px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-black/10"
          />

          {/* Suggestions only when typing */}
          {showSuggestions && (
            <div className="absolute z-20 mt-2 w-full overflow-hidden rounded-2xl border bg-white shadow-lg">
              {filtered.length === 0 ? (
                <div className="px-4 py-3 text-sm text-muted-foreground">
                  Aucun résultat
                </div>
              ) : (
                <div className="max-h-72 overflow-auto p-2 space-y-2">
                  {filtered.map((b) => (
                    <BeachRow
                      key={b.id}
                      b={b}
                      reports={reports}
                      onGo={(id) => {
                        setQuery("");
                        goBeach(id);
                      }}
                    />
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        <Sheet>
          <SheetTrigger asChild>
            <button
              type="button"
              className="w-full rounded-2xl border bg-white px-4 py-3 text-sm font-semibold active:scale-[0.99]"
            >
              Liste des plages
            </button>
          </SheetTrigger>

          <SheetContent side="bottom" className="h-[85vh] rounded-t-3xl">
            <SheetHeader>
              <SheetTitle>Plages</SheetTitle>
            </SheetHeader>

            <div className="mt-4 space-y-2 overflow-auto pb-6">
              {beaches.map((b) => (
                <BeachRow key={b.id} b={b} reports={reports} onGo={goBeach} />
              ))}
            </div>
          </SheetContent>
        </Sheet>
      </div>

      {/* Map */}
      <div className="mt-4 rounded-3xl border bg-white overflow-hidden">
        <div className="relative">
          <TransformWrapper
            initialScale={1}
            minScale={1} // ✅ pas de dézoom en dessous
            maxScale={5}
            limitToBounds={true}
            centerOnInit={true}
            smooth={true}
            wheel={{ step: 0.12 }}
            pinch={{ step: 5 }}
            doubleClick={{ disabled: true }}
            panning={{ disabled: scale <= 1.0001 }} // ✅ pas de déplacement quand scale=1
            onTransformed={(ref) => setScale(ref.state.scale)}
          >
            {({ zoomIn, zoomOut, resetTransform }) => (
              <>
                {/* Controls: in row */}
                <div className="absolute z-10 right-3 top-3 flex gap-2">
                  <button
                    type="button"
                    onClick={() => zoomIn()}
                    className="h-10 w-10 rounded-xl border bg-white/95 shadow-sm grid place-items-center text-lg font-black"
                    title="Zoom +"
                  >
                    +
                  </button>
                  <button
                    type="button"
                    onClick={() => zoomOut()}
                    className="h-10 w-10 rounded-xl border bg-white/95 shadow-sm grid place-items-center text-lg font-black"
                    title="Zoom -"
                  >
                    –
                  </button>
                  <button
                    type="button"
                    onClick={() => resetTransform()}
                    className="h-10 w-10 rounded-xl border bg-white/95 shadow-sm grid place-items-center"
                    title="Reset"
                  >
                    <img
                      src="/reset.png"
                      alt="Reset"
                      className="h-5 w-5"
                      draggable="false"
                    />
                  </button>
                </div>

                <TransformComponent
                  wrapperStyle={{
                    width: "100%",
                    height: "420px",
                    touchAction: "none",
                    background: "#f6f6f6",
                  }}
                  contentStyle={{
                    width: "100%",
                    height: "100%",
                    position: "relative",
                  }}
                >
                  {/* MAP + markers in same coordinate system */}
                  <div className="relative w-full h-full">
                    <img
                      src="/map2.svg"
                      alt="Carte de la Guadeloupe"
                      className="w-full h-full object-contain select-none"
                      draggable={false}
                    />

                    {/* MARKERS: follow zoom/pan naturally, but each marker keeps constant size */}
                    {markers.map((b) => {
                      const bg = markerColorForBeach(reports, b.id);
                      const s = 1 / scale; // inverse scale per marker

                      return (
                        <button
                          key={b.id}
                          type="button"
                          onClick={() => goBeach(b.id)}
                          title={b.name}
                          style={{
                            position: "absolute",
                            left: `${clamp(b.map.x, 0, 100)}%`,
                            top: `${clamp(b.map.y, 0, 100)}%`,
                            transform: `translate(-50%, -50%) scale(${s})`,
                            transformOrigin: "center",
                            width: 6,
                            height: 6,
                            borderRadius: 999,
                            background: bg,
                            border: "1px solid rgba(255,255,255,0.9)", // ✅ outline plus fin
                            boxShadow: "0 1px 4px rgba(0,0,0,0.25)",
                            padding: 0,
                            cursor: "pointer",
                          }}
                        />
                      );
                    })}
                  </div>
                </TransformComponent>
              </>
            )}
          </TransformWrapper>
        </div>
      </div>

      {/* GPS status outside map */}
      <div className="mt-2 text-xs text-muted-foreground">
        {userPosition ? (
          <>📍 Position détectée (≈ {Math.round(userPosition.accuracy)} m)</>
        ) : gpsError ? (
          <>📍 Position indisponible ({gpsError})</>
        ) : (
          <>📍 Position en attente…</>
        )}
      </div>

      <div className="mt-4">
        <Link to="/" className="text-sm text-muted-foreground underline">
          (tu es déjà sur la carte 😄)
        </Link>
      </div>
    </Layout>
  );
}
