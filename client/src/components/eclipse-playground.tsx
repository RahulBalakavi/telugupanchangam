import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Loader2, Moon, Orbit, Pause, Play, Sun, Telescope } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { useLanguage } from "@/hooks/use-language";
import {
  buildEclipseTimeline,
  type EclipseTimeline,
  type LunarFrame,
  type SolarFrame,
} from "@/lib/eclipse-sim";

interface PlaygroundEclipse {
  type: "solar" | "lunar";
  kind: string;
  peakUtc: string;
  dateLocal: string;
}

interface Props {
  eclipses: PlaygroundEclipse[];
  location: { lat: number; lon: number; label: string } | null;
  timezone: string;
}

type T = (te: string, en: string) => string;

const INCLINATION = 5.14; // Moon's orbital tilt vs the ecliptic, degrees
const SOLAR_LIMIT = 1.5; // |ecliptic latitude| at new moon below which a solar eclipse can occur
const LUNAR_LIMIT = 1.05; // |ecliptic latitude| at full moon below which a lunar eclipse can occur

const wrap180 = (a: number) => ((((a + 180) % 360) + 360) % 360) - 180;

/* ------------------------------------------------------------------ */
/* Sandbox orrery: drag the Moon (and Earth) to discover why eclipses  */
/* only happen when a new/full moon lines up with an orbital node.     */
/* ------------------------------------------------------------------ */

function useSvgPointerAngle(svgRef: React.RefObject<SVGSVGElement>, viewW: number, viewH: number) {
  return useCallback(
    (e: { clientX: number; clientY: number }, cx: number, cy: number) => {
      const rect = svgRef.current?.getBoundingClientRect();
      if (!rect) return null;
      const x = ((e.clientX - rect.left) / rect.width) * viewW;
      const y = ((e.clientY - rect.top) / rect.height) * viewH;
      return (Math.atan2(-(y - cy), x - cx) * 180) / Math.PI;
    },
    [svgRef, viewW, viewH],
  );
}

function OrrerySandbox({ t }: { t: T }) {
  const [earthAngle, setEarthAngle] = useState(205);
  const [moonAngle, setMoonAngle] = useState(25); // inertial angle; nodes lie along 0°/180°
  const [playing, setPlaying] = useState(false);
  const dragging = useRef<"moon" | "earth" | null>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const pointerAngle = useSvgPointerAngle(svgRef, 720, 400);

  const W = 720, H = 400, SUN = { x: 360, y: 186 }, R_EARTH_ORBIT = 148, R_MOON_ORBIT = 46;
  const earth = {
    x: SUN.x + R_EARTH_ORBIT * Math.cos((earthAngle * Math.PI) / 180),
    y: SUN.y - R_EARTH_ORBIT * Math.sin((earthAngle * Math.PI) / 180),
  };
  const moon = {
    x: earth.x + R_MOON_ORBIT * Math.cos((moonAngle * Math.PI) / 180),
    y: earth.y - R_MOON_ORBIT * Math.sin((moonAngle * Math.PI) / 180),
  };

  // Phase: 0 = new moon (Moon between Earth and Sun), ±180 = full moon.
  const sunDir = wrap180(earthAngle + 180);
  const phase = wrap180(moonAngle - sunDir);
  const beta = INCLINATION * Math.sin((moonAngle * Math.PI) / 180); // ecliptic latitude, deg
  const nearNew = Math.abs(phase) < 12;
  const nearFull = Math.abs(wrap180(phase - 180)) < 12;
  const solarEclipse = nearNew && Math.abs(beta) < SOLAR_LIMIT;
  const lunarEclipse = nearFull && Math.abs(beta) < LUNAR_LIMIT;

  useEffect(() => {
    if (!playing) return;
    let raf = 0;
    let last = performance.now();
    const tick = (now: number) => {
      const dt = Math.min(64, now - last);
      last = now;
      // Moon: ~27.3-day sidereal orbit; Earth advances in step (1 : 13.37).
      setMoonAngle((a) => (a + dt * 0.045) % 360);
      setEarthAngle((a) => (a + (dt * 0.045) / 13.37) % 360);
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [playing]);

  const onPointerMove = (e: React.PointerEvent) => {
    if (!dragging.current) return;
    e.preventDefault();
    if (dragging.current === "moon") {
      const a = pointerAngle(e, earth.x, earth.y);
      if (a !== null) setMoonAngle((a + 360) % 360);
    } else {
      const a = pointerAngle(e, SUN.x, SUN.y);
      if (a !== null) setEarthAngle((a + 360) % 360);
    }
  };
  const stopDrag = () => (dragging.current = null);
  const grab = (what: "moon" | "earth") => (e: React.PointerEvent) => {
    dragging.current = what;
    setPlaying(false);
    try { (e.target as Element).setPointerCapture?.(e.pointerId); } catch { /* fine without capture */ }
  };

  // Snap helpers used by the guided buttons.
  const snapNewMoonAtNode = () => { setPlaying(false); setEarthAngle(180); setMoonAngle(0); };
  const snapFullMoonAtNode = () => { setPlaying(false); setEarthAngle(0); setMoonAngle(0); };
  const snapNewMoonOffNode = () => { setPlaying(false); setEarthAngle(270); setMoonAngle(90); };

  const verdict = solarEclipse
    ? { tone: "solar" as const, icon: <Sun className="h-4 w-4" />, text: t("సూర్యగ్రహణం! చంద్రుడు సరిగ్గా సూర్యుడు–భూమి మధ్య, కక్ష్యా సంధి (node) దగ్గర ఉన్నాడు.", "Solar eclipse! The Moon sits between Sun and Earth, right at an orbital node.") }
    : lunarEclipse
    ? { tone: "lunar" as const, icon: <Moon className="h-4 w-4" />, text: t("చంద్రగ్రహణం! నిండు చంద్రుడు భూమి నీడలోకి, సంధి బిందువు దగ్గర వచ్చాడు.", "Lunar eclipse! The full Moon passes through Earth's shadow, right at a node.") }
    : nearNew
    ? { tone: "miss" as const, icon: <Orbit className="h-4 w-4" />, text: t(`అమావాస్యే — కానీ చంద్రుడు క్రాంతివృత్తానికి ${beta >= 0 ? "పైన" : "కింద"} ${Math.abs(beta).toFixed(1)}° ఉన్నాడు. నీడ భూమిని తప్పిపోతుంది.`, `It's a new moon — but the Moon is ${Math.abs(beta).toFixed(1)}° ${beta >= 0 ? "above" : "below"} the ecliptic, so its shadow misses Earth.`) }
    : nearFull
    ? { tone: "miss" as const, icon: <Orbit className="h-4 w-4" />, text: t(`పున్నమే — కానీ చంద్రుడు భూమి నీడకు ${beta >= 0 ? "పైగా" : "కిందుగా"} ${Math.abs(beta).toFixed(1)}° దూరంలో వెళ్తున్నాడు.`, `It's a full moon — but the Moon passes ${Math.abs(beta).toFixed(1)}° ${beta >= 0 ? "above" : "below"} Earth's shadow.`) }
    : { tone: "idle" as const, icon: <Orbit className="h-4 w-4" />, text: t("చంద్రుణ్ని లాగి అమావాస్య/పున్నమి స్థానానికి తీసుకురండి. సంధి రేఖ (బంగారు గీత) దగ్గరే గ్రహణం సాధ్యం.", "Drag the Moon to a new-moon or full-moon position. Eclipses are only possible near the golden node line.") };

  const phaseName = nearNew ? t("అమావాస్య", "New moon") : nearFull ? t("పున్నమి", "Full moon") : Math.abs(phase) < 90 ? t("నెలవంక", "Crescent") : t("గిబ్బస్", "Gibbous");
  // Edge-on inset: how far above/below the ecliptic the Moon rides.
  const insetMoonY = 43 - beta * 5.2;

  return (
    <div data-testid="orrery-sandbox">
      <div className="mb-3 flex flex-wrap items-center gap-2">
        <Button size="sm" variant="secondary" onClick={() => setPlaying((p) => !p)} data-testid="button-orrery-play">
          {playing ? <Pause className="mr-1.5 h-3.5 w-3.5" /> : <Play className="mr-1.5 h-3.5 w-3.5" />}
          {playing ? t("ఆపండి", "Pause") : t("నెలలు నడపండి", "Play the months")}
        </Button>
        <Button size="sm" variant="outline" onClick={snapNewMoonAtNode} data-testid="button-snap-solar">{t("సూర్యగ్రహణ అమరిక", "Line up a solar eclipse")}</Button>
        <Button size="sm" variant="outline" onClick={snapFullMoonAtNode} data-testid="button-snap-lunar">{t("చంద్రగ్రహణ అమరిక", "Line up a lunar eclipse")}</Button>
        <Button size="sm" variant="outline" onClick={snapNewMoonOffNode} data-testid="button-snap-miss">{t("తప్పిపోయే అమావాస్య", "A near-miss new moon")}</Button>
      </div>
      <svg
        ref={svgRef}
        viewBox={`0 0 ${W} ${H}`}
        className="h-auto w-full touch-none select-none overflow-visible rounded-xl bg-[hsl(228_40%_8%)]"
        role="application"
        aria-label={t("సూర్యుడు, భూమి, చంద్రుల ఇంటరాక్టివ్ నమూనా", "Interactive Sun, Earth and Moon model")}
        onPointerMove={onPointerMove}
        onPointerUp={stopDrag}
        onPointerLeave={stopDrag}
      >
        <defs>
          <radialGradient id="lab-sun"><stop stopColor="#fff2b2" /><stop offset=".45" stopColor="#e8a543" /><stop offset="1" stopColor="#b65d20" /></radialGradient>
          <radialGradient id="lab-earth"><stop stopColor="#88c4c9" /><stop offset="1" stopColor="#244e68" /></radialGradient>
          <filter id="lab-glow"><feGaussianBlur stdDeviation="6" /></filter>
        </defs>
        {/* node line: where the Moon's tilted orbit crosses the ecliptic */}
        <line x1={SUN.x - R_EARTH_ORBIT - 70} y1={SUN.y} x2={SUN.x + R_EARTH_ORBIT + 70} y2={SUN.y} stroke="hsl(39 70% 69% / .5)" strokeDasharray="7 6" />
        <text x={SUN.x + R_EARTH_ORBIT + 66} y={SUN.y - 8} textAnchor="end" fill="#d8a85b" fontSize="12">{t("సంధి రేఖ (nodes)", "node line")}</text>
        {/* Earth's orbit */}
        <circle cx={SUN.x} cy={SUN.y} r={R_EARTH_ORBIT} fill="none" stroke="hsl(var(--foreground) / .14)" />
        {/* Sun */}
        <circle cx={SUN.x} cy={SUN.y} r={40} fill="none" stroke="#e8a543" opacity=".2" filter="url(#lab-glow)" />
        <circle cx={SUN.x} cy={SUN.y} r={28} fill="url(#lab-sun)" className="eclipse-pulse" />
        {/* Earth's shadow cone (points away from the Sun) */}
        {(() => {
          const ux = (earth.x - SUN.x) / R_EARTH_ORBIT, uy = (earth.y - SUN.y) / R_EARTH_ORBIT;
          const tipX = earth.x + ux * 92, tipY = earth.y + uy * 92;
          const px = -uy, py = ux;
          return <polygon points={`${earth.x + px * 11},${earth.y + py * 11} ${earth.x - px * 11},${earth.y - py * 11} ${tipX},${tipY}`} fill={lunarEclipse ? "hsl(12 65% 35% / .5)" : "hsl(228 30% 20% / .55)"} />;
        })()}
        {/* Moon's shadow cone when near new moon */}
        {nearNew && (() => {
          const ux = (moon.x - SUN.x), uy = (moon.y - SUN.y);
          const L = Math.hypot(ux, uy);
          const tipX = moon.x + (ux / L) * 60, tipY = moon.y + (uy / L) * 60;
          const px = -uy / L, py = ux / L;
          return <polygon points={`${moon.x + px * 5},${moon.y + py * 5} ${moon.x - px * 5},${moon.y - py * 5} ${tipX},${tipY}`} fill={solarEclipse ? "hsl(39 80% 55% / .45)" : "hsl(228 30% 22% / .5)"} />;
        })()}
        {/* Moon's orbit around Earth */}
        <circle cx={earth.x} cy={earth.y} r={R_MOON_ORBIT} fill="none" stroke="hsl(39 70% 69% / .3)" strokeDasharray="3 5" />
        {/* Earth (draggable) */}
        <g onPointerDown={grab("earth")} style={{ cursor: "grab" }} data-testid="drag-earth">
          <circle cx={earth.x} cy={earth.y} r={22} fill="transparent" />
          <circle cx={earth.x} cy={earth.y} r={13} fill="url(#lab-earth)" />
        </g>
        {/* Moon (draggable) with above/below-plane ring */}
        <g onPointerDown={grab("moon")} style={{ cursor: "grab" }} data-testid="drag-moon">
          <circle cx={moon.x} cy={moon.y} r={20} fill="transparent" />
          <circle cx={moon.x} cy={moon.y} r={7.5} fill="#cfc8b8" stroke={Math.abs(beta) < 1.5 ? "#e8b85f" : "hsl(var(--foreground) / .35)"} strokeWidth="2" />
        </g>
        <text x={SUN.x} y={SUN.y + 52} textAnchor="middle" fill="#d8cca6" fontSize="13">{t("సూర్యుడు", "Sun")}</text>
        <text x={earth.x} y={earth.y + 30} textAnchor="middle" fill="#d8cca6" fontSize="12">{t("భూమి", "Earth")}</text>
        <text x={moon.x} y={moon.y - 14} textAnchor="middle" fill="#d8cca6" fontSize="11">{t("చంద్రుడు", "Moon")}{Math.abs(beta) >= 0.05 ? ` ${beta > 0 ? "▲" : "▼"}${Math.abs(beta).toFixed(1)}°` : ""}</text>
        {/* Edge-on inset: the 5° tilt that makes most months eclipse-free */}
        <g transform={`translate(${W - 232} , ${H - 96})`}>
          <rect width="220" height="86" rx="10" fill="hsl(228 38% 11%)" stroke="hsl(var(--gold) / .25)" />
          <text x="10" y="17" fill="#d8a85b" fontSize="10" letterSpacing=".12em">{t("పక్క నుండి చూస్తే", "EDGE-ON VIEW")}</text>
          <line x1="12" y1="43" x2="208" y2="43" stroke="hsl(39 70% 69% / .4)" strokeDasharray="4 4" />
          <rect x="12" y={43 - LUNAR_LIMIT * 5.2} width="196" height={LUNAR_LIMIT * 10.4} fill="hsl(12 60% 40% / .18)" />
          <circle cx="46" cy="43" r="7" fill="url(#lab-earth)" />
          <circle cx="150" cy={insetMoonY} r="4.5" fill="#cfc8b8" />
          <text x="208" y={insetMoonY < 38 ? insetMoonY + 14 : insetMoonY - 8} textAnchor="end" fill="#9aa2b5" fontSize="9.5">{Math.abs(beta) < LUNAR_LIMIT ? t("నీడ పరిధిలో!", "in shadow range!") : t("నీడ దాటి", "clears the shadow")}</text>
        </g>
      </svg>
      <div className={`mt-3 flex items-start gap-2 rounded-xl border p-3 text-sm ${verdict.tone === "solar" ? "border-orange-400/45 bg-orange-500/12" : verdict.tone === "lunar" ? "border-red-400/40 bg-red-500/12" : "border-[hsl(var(--gold)/.25)] bg-white/[.05]"}`} data-testid="orrery-verdict" aria-live="polite">
        <span className="mt-0.5 shrink-0 text-[hsl(var(--gold))]">{verdict.icon}</span>
        <div>
          <p className="font-medium">{verdict.text}</p>
          <p className="mt-1 text-xs text-[hsl(0_0%_72%)]">
            {t("దశ", "Phase")}: <strong className="text-[hsl(0_0%_92%)]">{phaseName}</strong>
            {" · "}{t("క్రాంతివృత్తం నుండి", "Off the ecliptic")}: <strong className="text-[hsl(0_0%_92%)]">{beta >= 0 ? "+" : "−"}{Math.abs(beta).toFixed(1)}°</strong>
            {" · "}{t("చంద్రుని కక్ష్య 5.1° వాలుగా ఉండటం వల్ల ప్రతి అమావాస్యకూ గ్రహణం రాదు.", "The Moon's 5.1° tilt is why most new moons pass without an eclipse.")}
          </p>
        </div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Real-eclipse playback: scrub through the selected eclipse, computed */
/* live from astronomy-engine for the user's own sky.                  */
/* ------------------------------------------------------------------ */

function SolarDiskView({ frame }: { frame: SolarFrame }) {
  const R = 78;
  const scale = R / frame.rSun;
  const mx = 230 + frame.x * scale;
  const my = 150 - frame.y * scale;
  const rm = frame.rMoon * scale;
  const total = frame.obsc >= 0.999;
  const skyDim = 1 - frame.obsc * 0.88;
  return (
    <svg viewBox="0 0 460 300" className="h-auto w-full rounded-xl" data-testid="solar-disk-view">
      <rect width="460" height="300" fill={`hsl(224 45% ${Math.max(5, 34 * skyDim)}%)`} />
      <defs>
        <radialGradient id="play-sun"><stop stopColor="#fff6c8" /><stop offset=".55" stopColor="#f0b04a" /><stop offset="1" stopColor="#c96f24" /></radialGradient>
        <filter id="play-glow"><feGaussianBlur stdDeviation="9" /></filter>
      </defs>
      <circle cx="230" cy="150" r={R * 1.12} fill="none" stroke="#e8a543" opacity={0.3 * skyDim + 0.05} strokeWidth="10" filter="url(#play-glow)" />
      <circle cx="230" cy="150" r={R} fill="url(#play-sun)" />
      {/* The Moon's night side — deliberately visible against the sky so its approach can be followed */}
      <circle cx={mx} cy={my} r={rm} fill="#171c2b" stroke="hsl(228 25% 45% / .5)" strokeWidth="1" />
      {/* Corona bursts out around the black disk at totality */}
      {total && <circle cx={mx} cy={my} r={rm * 1.03} fill="none" stroke="#f2ecd8" strokeWidth="9" opacity=".85" filter="url(#play-glow)" />}
    </svg>
  );
}

function LunarDiskView({ frame }: { frame: LunarFrame }) {
  const scale = 132 / frame.rPenumbra;
  const mx = 230 + frame.x * scale;
  const my = 150 - frame.y * scale;
  const rm = frame.rMoon * scale;
  return (
    <svg viewBox="0 0 460 300" className="h-auto w-full rounded-xl" data-testid="lunar-disk-view">
      <rect width="460" height="300" fill="hsl(226 45% 7%)" />
      {[[38, 40], [92, 250], [140, 80], [406, 60], [370, 240], [430, 180], [60, 150], [330, 30]].map(([x, y], i) => (
        <circle key={i} cx={x} cy={y} r={i % 3 === 0 ? 1.6 : 1} fill="#cdd3e8" opacity=".7" />
      ))}
      <defs>
        <radialGradient id="play-moon"><stop stopColor="#f4efdf" /><stop offset="1" stopColor="#b9b3a0" /></radialGradient>
      </defs>
      {/* Moon first, then Earth's shadow circles darken whatever they cover */}
      <circle cx={mx} cy={my} r={rm} fill="url(#play-moon)" />
      <circle cx="230" cy="150" r={frame.rPenumbra * scale} fill="hsl(230 40% 6% / .38)" />
      <circle cx="230" cy="150" r={frame.rUmbra * scale} fill="hsl(14 70% 14% / .8)" />
      <circle cx="230" cy="150" r={frame.rUmbra * scale} fill="none" stroke="hsl(14 60% 40% / .5)" strokeDasharray="3 4" />
      <circle cx="230" cy="150" r={frame.rPenumbra * scale} fill="none" stroke="hsl(230 30% 40% / .35)" strokeDasharray="3 5" />
    </svg>
  );
}

function EclipsePlayback({ eclipse, location, timezone, t, language }: { eclipse: PlaygroundEclipse; location: { lat: number; lon: number; label: string } | null; timezone: string; t: T; language: string }) {
  const [timeline, setTimeline] = useState<EclipseTimeline | null>(null);
  const [error, setError] = useState(false);
  const [idx, setIdx] = useState(0);
  const [playing, setPlaying] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setTimeline(null);
    setError(false);
    setPlaying(false);
    buildEclipseTimeline(eclipse.type, eclipse.peakUtc, location ? { lat: location.lat, lon: location.lon } : null)
      .then((tl) => {
        if (cancelled) return;
        setTimeline(tl);
        // Start at first contact so pressing play shows the whole story.
        const frames = tl.frames as Array<SolarFrame | LunarFrame>;
        const firstTouch = frames.findIndex((f) => ("obsc" in f ? f.obsc : (f as LunarFrame).umbralObsc) > 0);
        setIdx(firstTouch > 0 ? Math.max(0, firstTouch - 4) : 0);
      })
      .catch(() => !cancelled && setError(true));
    return () => { cancelled = true; };
  }, [eclipse.type, eclipse.peakUtc, location?.lat, location?.lon]);

  useEffect(() => {
    if (!playing || !timeline) return;
    const id = window.setInterval(() => {
      setIdx((i) => {
        if (i >= timeline.frames.length - 1) { setPlaying(false); return i; }
        return i + 1;
      });
    }, 90);
    return () => window.clearInterval(id);
  }, [playing, timeline]);

  if (error) return <p className="rounded-xl border border-destructive/40 p-4 text-sm text-destructive">{t("గణన లోడ్ కాలేదు — మళ్లీ ప్రయత్నించండి.", "Could not load the simulation — please try again.")}</p>;
  if (!timeline) return (
    <div className="grid h-64 place-items-center rounded-xl border border-[hsl(var(--gold)/.2)] bg-[hsl(228_40%_8%)]">
      <span className="flex items-center gap-2 text-sm text-[hsl(0_0%_72%)]"><Loader2 className="h-4 w-4 animate-spin" />{t("ఖగోళ గణన జరుగుతోంది…", "Computing the real geometry…")}</span>
    </div>
  );

  const frame = timeline.frames[Math.min(idx, timeline.frames.length - 1)];
  const timeLabel = new Date(frame.t).toLocaleTimeString(language === "telugu" ? "te-IN" : "en-US", { timeZone: timezone, hour: "numeric", minute: "2-digit" });
  const coverage = timeline.type === "solar" ? (frame as SolarFrame).obsc : (frame as LunarFrame).umbralObsc;
  const solarView = timeline.type === "solar" ? timeline.view : null;
  const lunarAlt = timeline.type === "lunar" ? (frame as LunarFrame).alt : null;

  return (
    <div data-testid="eclipse-playback">
      <div className="mb-2 flex flex-wrap items-center justify-between gap-2 text-xs text-[hsl(0_0%_72%)]">
        <span>
          {timeline.type === "solar"
            ? solarView === "your-location"
              ? t("మీ ఆకాశం నుండి నిజమైన దృశ్యం", "The real view from your sky")
              : `${t("భూమిపై ఉత్తమ దృశ్యం", "Best view on Earth")} (${timeline.observer.lat.toFixed(0)}°, ${timeline.observer.lon.toFixed(0)}°)${location ? " — " + t("మీ ప్రాంతంలో ఈ గ్రహణం కనిపించదు", "this eclipse is not visible at your location") : ""}`
            : t("భూమి నీడ గుండా చంద్రుని ప్రయాణం", "The Moon's path through Earth's shadow")}
        </span>
        <span>{t("గణన: astronomy-engine", "Computed live · astronomy-engine")}</span>
      </div>
      {timeline.type === "solar" ? <SolarDiskView frame={frame as SolarFrame} /> : <LunarDiskView frame={frame as LunarFrame} />}
      <div className="mt-3 flex items-center gap-3">
        <Button size="icon" variant="secondary" className="h-9 w-9 shrink-0" onClick={() => { if (!playing && idx >= timeline.frames.length - 1) setIdx(0); setPlaying((p) => !p); }} data-testid="button-playback-play" aria-label={playing ? t("ఆపండి", "Pause") : t("ప్లే", "Play")}>
          {playing ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
        </Button>
        <Slider value={[idx]} min={0} max={timeline.frames.length - 1} step={1} onValueChange={(v) => { setPlaying(false); setIdx(v[0]); }} className="flex-1" data-testid="slider-playback" aria-label={t("గ్రహణ సమయం", "Eclipse time")} />
      </div>
      <div className="mt-3 grid grid-cols-3 gap-3 text-sm">
        <div className="rounded-xl border border-[hsl(var(--gold)/.2)] bg-white/[.04] p-3"><span className="block text-xs opacity-60">{t("స్థానిక సమయం", "Local time")}</span><strong data-testid="text-playback-time">{timeLabel}</strong></div>
        <div className="rounded-xl border border-[hsl(var(--gold)/.2)] bg-white/[.04] p-3"><span className="block text-xs opacity-60">{timeline.type === "solar" ? t("సూర్యుడు కప్పబడినది", "Sun covered") : t("నీడలో చంద్రుడు", "Moon in umbra")}</span><strong data-testid="text-playback-coverage">{(coverage * 100).toFixed(0)}%</strong></div>
        <div className="rounded-xl border border-[hsl(var(--gold)/.2)] bg-white/[.04] p-3">
          <span className="block text-xs opacity-60">{timeline.type === "solar" ? t("సూర్యుని ఎత్తు", "Sun altitude") : t("మీ ఆకాశంలో", "In your sky")}</span>
          <strong>
            {timeline.type === "solar"
              ? `${(frame as SolarFrame).alt.toFixed(0)}°`
              : lunarAlt === null ? t("ప్రాంతం సెట్ చేయలేదు", "Set location") : lunarAlt > 0 ? t("చంద్రుడు పైనే ఉన్నాడు", "Moon is up") : t("హోరిజన్ కింద", "Below horizon")}
          </strong>
        </div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */

export default function EclipsePlayground({ eclipses, location, timezone }: Props) {
  const { language, t } = useLanguage();
  const [mode, setMode] = useState<"orrery" | "playback">("orrery");
  const [selected, setSelected] = useState(0);
  const eclipse = eclipses[Math.min(selected, eclipses.length - 1)];

  const dateLabel = useMemo(
    () => (e: PlaygroundEclipse) =>
      new Date(e.peakUtc).toLocaleDateString(language === "telugu" ? "te-IN" : "en-US", { timeZone: timezone, month: "short", day: "numeric", year: "numeric" }),
    [language, timezone],
  );

  return (
    <section id="eclipse-lab" className="scroll-mt-24 overflow-hidden rounded-[1.5rem] border border-[hsl(var(--gold)/.3)] bg-[hsl(228_38%_10%)] p-5 text-[hsl(0_0%_96%)] shadow-lg md:p-7" data-testid="card-eclipse-lab">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="max-w-2xl text-sm text-[hsl(0_0%_80%)]">{t("గ్రహాలను మీరే కదిలించండి — గ్రహణం ఎందుకు, ఎప్పుడు వస్తుందో చూడండి. లేదా రాబోయే గ్రహణాన్ని నిజమైన ఖగోళ గణనతో ముందుగానే చూడండి.", "Move the planets yourself to see why eclipses happen — or scrub through an upcoming eclipse, computed with real astronomy.")}</p>
        <div className="flex rounded-full border border-[hsl(var(--gold)/.35)] bg-[hsl(var(--background)/.15)] p-1" role="tablist">
          <button role="tab" aria-selected={mode === "orrery"} onClick={() => setMode("orrery")} className={`flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-sm font-medium transition ${mode === "orrery" ? "bg-[hsl(var(--gold)/.9)] text-[hsl(228_40%_12%)]" : "text-[hsl(0_0%_82%)] hover:text-white"}`} data-testid="tab-orrery">
            <Orbit className="h-3.5 w-3.5" />{t("ఎందుకు?", "Why it happens")}
          </button>
          <button role="tab" aria-selected={mode === "playback"} onClick={() => setMode("playback")} className={`flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-sm font-medium transition ${mode === "playback" ? "bg-[hsl(var(--gold)/.9)] text-[hsl(228_40%_12%)]" : "text-[hsl(0_0%_82%)] hover:text-white"}`} data-testid="tab-playback">
            <Telescope className="h-3.5 w-3.5" />{t("ఈ గ్రహణం చూడండి", "Watch the eclipse")}
          </button>
        </div>
      </div>
      <div className="mt-5">
        {mode === "orrery" ? (
          <OrrerySandbox t={t} />
        ) : !eclipse ? (
          <p className="text-sm text-[hsl(0_0%_72%)]">{t("రాబోయే గ్రహణాలు లేవు", "No upcoming eclipses to play back")}</p>
        ) : (
          <div className="space-y-4">
            <div className="flex flex-wrap gap-2" data-testid="playback-eclipse-picker">
              {eclipses.slice(0, 6).map((e, i) => (
                <button key={`${e.peakUtc}-${e.type}`} onClick={() => setSelected(i)} className={`flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium transition ${i === Math.min(selected, eclipses.length - 1) ? "border-[hsl(var(--gold))] bg-[hsl(var(--gold)/.18)] text-white" : "border-[hsl(var(--gold)/.25)] text-[hsl(0_0%_78%)] hover:border-[hsl(var(--gold)/.6)]"}`} data-testid={`chip-eclipse-${i}`}>
                  {e.type === "solar" ? <Sun className="h-3 w-3 text-orange-300" /> : <Moon className="h-3 w-3 text-indigo-200" />}
                  {dateLabel(e)}
                </button>
              ))}
            </div>
            <EclipsePlayback eclipse={eclipse} location={location} timezone={timezone} t={t} language={language} />
          </div>
        )}
      </div>
    </section>
  );
}
