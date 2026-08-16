// The Orrery — a real-geometry 3D Sun–Earth–Moon scene that answers one
// question: why isn't there an eclipse at every new/full moon?
//
// Real angles (Sun/Moon ecliptic positions from astronomy-engine), stylized
// distances/sizes (honestly labeled). The Moon's 5.1° orbital tilt and the
// slowly regressing line of nodes are the stars of the show; a tilt slider
// lets you flatten the orbit and watch eclipses fire every fortnight.

import { useEffect, useMemo, useRef, useState } from "react";
import { useLocation } from "wouter";
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { ArrowLeft, FastForward, Pause, Play, Rewind } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { ThemeToggle } from "@/components/theme-toggle";
import { useLanguage } from "@/hooks/use-language";
import { nakshatraNames, nakshatraNamesTelugu } from "@shared/schema";

type Astro = typeof import("astronomy-engine");
let astroPromise: Promise<Astro> | null = null;
const loadAstro = () => (astroPromise ??= import("astronomy-engine"));

// ---- stylized scene dimensions (not to scale; angles are real) ----
const R_EARTH_ORBIT = 26;
const R_MOON_ORBIT = 5;
const SUN_RADIUS = 3.2;
const EARTH_RADIUS = 1.05;
const MOON_RADIUS = 0.42;
const MOON_TILT_DEG = 5.145;

const DEG = Math.PI / 180;
const DAY_MS = 86400_000;

// Lahiri ayanamsa — the SAME formula as server/panchang.ts getAyanamsa, so
// the nakshatra shown here always agrees with the eclipses/panchangam pages.
function ayanamsa(tMs: number): number {
  const d = new Date(tMs);
  const year = d.getFullYear() + (d.getMonth() + 1) / 12;
  return 23.85 + (year - 2000) * (50.3 / 3600);
}

interface Sample {
  sunLon: number; // geocentric ecliptic longitude of Sun, deg
  moonLon: number; // geocentric ecliptic longitude of Moon, deg
  moonLat: number; // geocentric ecliptic latitude of Moon, deg
  phase: number; // (moonLon - sunLon) normalized 0..360; 0=new, 180=full
}

function sampleAt(A: Astro, tMs: number): Sample {
  const time = A.MakeTime(new Date(tMs));
  const sunLon = A.SunPosition(time).elon;
  const m = A.EclipticGeoMoon(time);
  const phase = (((m.lon - sunLon) % 360) + 360) % 360;
  return { sunLon, moonLon: m.lon, moonLat: m.lat, phase };
}

/** Ascending-node longitude: where the Moon's latitude next crosses - to +. */
function findNodeLon(A: Astro, tMs: number): number {
  let prev = sampleAt(A, tMs);
  for (let d = 1; d <= 29; d++) {
    const cur = sampleAt(A, tMs + d * DAY_MS);
    if (prev.moonLat < 0 && cur.moonLat >= 0) {
      // refine to ~an hour
      let lo = tMs + (d - 1) * DAY_MS;
      let hi = tMs + d * DAY_MS;
      for (let i = 0; i < 10; i++) {
        const mid = (lo + hi) / 2;
        if (sampleAt(A, mid).moonLat < 0) lo = mid;
        else hi = mid;
      }
      return sampleAt(A, (lo + hi) / 2).moonLon;
    }
    prev = cur;
  }
  return prev.moonLon;
}

function eclipticToVec(lonDeg: number, latDeg: number, r: number): THREE.Vector3 {
  // Ecliptic plane = XZ plane; +Y = ecliptic north. Longitude runs
  // counter-clockwise seen from north.
  const lon = lonDeg * DEG;
  const lat = latDeg * DEG;
  return new THREE.Vector3(
    r * Math.cos(lat) * Math.cos(lon),
    r * Math.sin(lat),
    -r * Math.cos(lat) * Math.sin(lon),
  );
}

// Text is drawn white so the sprite material's `color` can tint it at runtime
// (used to highlight affected nakshatras during an eclipse).
function textSprite(text: string, color = "#e8dcc0", size = 42): THREE.Sprite {
  const canvas = document.createElement("canvas");
  canvas.width = 512;
  canvas.height = 128;
  const ctx = canvas.getContext("2d")!;
  ctx.font = `600 ${size}px Georgia, serif`;
  ctx.fillStyle = "#ffffff";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(text, 256, 64);
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  const mat = new THREE.SpriteMaterial({ map: tex, transparent: true, depthWrite: false });
  mat.color.set(color);
  const sprite = new THREE.Sprite(mat);
  sprite.scale.set(6, 1.5, 1);
  return sprite;
}

interface EclipseMark {
  t: number;
  type: "solar" | "lunar";
  label: string;
}

interface HudState {
  dateLabel: string;
  phaseName: string;
  nakshatra: string;
  eclipse: "solar" | "lunar" | null;
  season: boolean;
  /** janma · anujanma · trijanma names, present while an eclipse is active */
  affected: string[] | null;
}

export default function SkyPage() {
  const { t, language } = useLanguage();
  const mountRef = useRef<HTMLDivElement>(null);
  const [ready, setReady] = useState(false);
  // ?t=<ISO or epoch ms> deep-links to a moment (e.g. an eclipse peak) and starts paused.
  const initialTime = useMemo(() => {
    const p = new URLSearchParams(window.location.search).get("t");
    if (!p) return null;
    const parsed = /^\d+$/.test(p) ? Number(p) : Date.parse(p);
    if (!Number.isFinite(parsed)) return null;
    const lo = Date.now() - 366 * DAY_MS;
    const hi = Date.now() + 500 * DAY_MS;
    return Math.min(hi, Math.max(lo, parsed));
  }, []);
  const [playing, setPlaying] = useState(initialTime === null);
  const [speed, setSpeed] = useState(1); // days per second
  const [tilt, setTilt] = useState(1); // 0..1 fraction of real 5.1°
  const [timeMs, setTimeMs] = useState(() => initialTime ?? Date.now());
  const [hud, setHud] = useState<HudState | null>(null);
  const [marks, setMarks] = useState<EclipseMark[]>([]);

  // Refs so the render loop reads the latest values without re-mounting.
  const playingRef = useRef(playing);
  const speedRef = useRef(speed);
  const tiltRef = useRef(tilt);
  const timeRef = useRef(timeMs);
  playingRef.current = playing;
  speedRef.current = speed;
  tiltRef.current = tilt;

  const rangeStart = useMemo(() => Date.now() - 366 * DAY_MS, []);
  const rangeEnd = useMemo(() => Date.now() + 500 * DAY_MS, []);

  // Real eclipse markers for the timeline.
  useEffect(() => {
    fetch("/api/eclipses?timezone=Asia/Kolkata")
      .then((r) => r.json())
      .then((d) => {
        const all = [...(d.past ?? []), ...(d.eclipses ?? [])];
        setMarks(
          all.map((e: { type: "solar" | "lunar"; peakUtc: string; dateLocal: string }) => ({
            t: new Date(e.peakUtc).getTime(),
            type: e.type,
            label: e.dateLocal,
          })),
        );
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return;
    let disposed = false;
    let raf = 0;

    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(mount.clientWidth, mount.clientHeight);
    mount.appendChild(renderer.domElement);

    const scene = new THREE.Scene();
    scene.background = new THREE.Color("#050510");

    const camera = new THREE.PerspectiveCamera(45, mount.clientWidth / mount.clientHeight, 0.1, 500);
    camera.position.set(R_EARTH_ORBIT + 14, 10, 10);

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.minDistance = 3;
    controls.maxDistance = 120;

    // stars
    {
      const starGeo = new THREE.BufferGeometry();
      const n = 1200;
      const pos = new Float32Array(n * 3);
      for (let i = 0; i < n; i++) {
        const v = new THREE.Vector3().randomDirection().multiplyScalar(200 + Math.random() * 100);
        pos.set([v.x, v.y, v.z], i * 3);
      }
      starGeo.setAttribute("position", new THREE.BufferAttribute(pos, 3));
      scene.add(new THREE.Points(starGeo, new THREE.PointsMaterial({ color: 0x9aa4c0, size: 0.7, sizeAttenuation: true })));
    }

    // Sun
    const sun = new THREE.Mesh(
      new THREE.SphereGeometry(SUN_RADIUS, 48, 48),
      new THREE.MeshBasicMaterial({ color: 0xffc24d }),
    );
    scene.add(sun);
    const sunLight = new THREE.PointLight(0xfff2d0, 2200, 0, 2);
    scene.add(sunLight, new THREE.AmbientLight(0x404050, 0.7));
    const glow = new THREE.Sprite(
      new THREE.SpriteMaterial({
        map: (() => {
          const c = document.createElement("canvas");
          c.width = c.height = 256;
          const g = c.getContext("2d")!;
          const grad = g.createRadialGradient(128, 128, 20, 128, 128, 128);
          grad.addColorStop(0, "rgba(255,200,90,0.9)");
          grad.addColorStop(0.4, "rgba(255,160,60,0.25)");
          grad.addColorStop(1, "rgba(255,140,40,0)");
          g.fillStyle = grad;
          g.fillRect(0, 0, 256, 256);
          return new THREE.CanvasTexture(c);
        })(),
        transparent: true,
        depthWrite: false,
      }),
    );
    glow.scale.set(18, 18, 1);
    scene.add(glow);

    // Earth's orbit ring + ecliptic disc
    const orbitPts: THREE.Vector3[] = [];
    for (let i = 0; i <= 128; i++) orbitPts.push(eclipticToVec((i / 128) * 360, 0, R_EARTH_ORBIT));
    scene.add(
      new THREE.Line(
        new THREE.BufferGeometry().setFromPoints(orbitPts),
        new THREE.LineBasicMaterial({ color: 0x3a4a6a, transparent: true, opacity: 0.8 }),
      ),
    );

    // Nakshatra ring: 27 sidereal segments just outside Earth's orbit —
    // boundaries and labels shifted by the ayanamsa so the ring matches the
    // panchangam's sidereal reckoning.
    const NAK_BASE = 0x8a6b3a;
    const ay0 = ayanamsa(Date.now());
    const segDeg = 360 / 27;
    const nakLabels: THREE.Sprite[] = [];
    const nakLabelPos: THREE.Vector3[] = [];
    {
      const tickMat = new THREE.LineBasicMaterial({ color: NAK_BASE, transparent: true, opacity: 0.6 });
      const names = language === "telugu" ? nakshatraNamesTelugu : nakshatraNames;
      for (let i = 0; i < 27; i++) {
        const boundary = i * segDeg + ay0;
        const a = eclipticToVec(boundary, 0, R_EARTH_ORBIT + 2.2);
        const b = eclipticToVec(boundary, 0, R_EARTH_ORBIT + 3.0);
        scene.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints([a, b]), tickMat));

        const center = boundary + segDeg / 2;
        const s = textSprite(names[i], "#8a6b3a", 44);
        s.scale.set(3.6, 0.9, 1);
        const pos = eclipticToVec(center, 0, R_EARTH_ORBIT + 4.4);
        s.position.copy(pos);
        scene.add(s);
        nakLabels.push(s);
        nakLabelPos.push(pos);
      }
    }

    // Eclipse emphasis: glowing wedges over the affected ring segments plus
    // connector lines from the Moon to each affected star. Index 0 = janma
    // (red), 1..2 = anujanma/trijanma (gold).
    const wedgeColors = [0xff5544, 0xe8b45a, 0xe8b45a];
    const wedges = wedgeColors.map((color) => {
      const geom = new THREE.RingGeometry(R_EARTH_ORBIT + 2.2, R_EARTH_ORBIT + 5.4, 24, 1, 0, segDeg * DEG);
      const mesh = new THREE.Mesh(
        geom,
        new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0.22, side: THREE.DoubleSide, depthWrite: false }),
      );
      mesh.rotation.x = -Math.PI / 2;
      mesh.visible = false;
      scene.add(mesh);
      return mesh;
    });
    const connectors = wedgeColors.map((color, i) => {
      const mat = new THREE.LineBasicMaterial({ color, transparent: true, opacity: i === 0 ? 0.95 : 0.55 });
      const geom = new THREE.BufferGeometry();
      const line = new THREE.Line(geom, mat);
      line.visible = false;
      scene.add(line);
      return { line, geom };
    });
    /** Aim a wedge at nakshatra index i (rotation about Y sets thetaStart). */
    const aimWedge = (mesh: THREE.Mesh, i: number) => {
      mesh.rotation.set(-Math.PI / 2, 0, 0);
      mesh.rotateZ((i * segDeg + ay0) * DEG);
    };

    // Earth + Moon + Moon orbit plane + node line
    const earth = new THREE.Mesh(
      new THREE.SphereGeometry(EARTH_RADIUS, 40, 40),
      new THREE.MeshStandardMaterial({ color: 0x3d6fd6, roughness: 0.7, metalness: 0.05 }),
    );
    scene.add(earth);
    const earthLabel = textSprite("Earth · భూమి");
    earthLabel.scale.set(4.6, 1.15, 1);
    scene.add(earthLabel);

    const moon = new THREE.Mesh(
      new THREE.SphereGeometry(MOON_RADIUS, 32, 32),
      new THREE.MeshStandardMaterial({ color: 0xcfc8bd, roughness: 0.95 }),
    );
    scene.add(moon);

    // Moon's orbital plane: a translucent ring parented to a group whose
    // rotation encodes the node longitude (Y) and inclination (about node axis).
    const moonPlaneGroup = new THREE.Group();
    const moonRing = new THREE.Mesh(
      new THREE.RingGeometry(R_MOON_ORBIT - 0.05, R_MOON_ORBIT + 0.05, 96),
      new THREE.MeshBasicMaterial({ color: 0xd9a24a, transparent: true, opacity: 0.85, side: THREE.DoubleSide }),
    );
    moonRing.rotation.x = -Math.PI / 2; // ring lies in the local XZ plane
    const moonDisc = new THREE.Mesh(
      new THREE.CircleGeometry(R_MOON_ORBIT, 96),
      new THREE.MeshBasicMaterial({ color: 0xd9a24a, transparent: true, opacity: 0.06, side: THREE.DoubleSide, depthWrite: false }),
    );
    moonDisc.rotation.x = -Math.PI / 2;
    moonPlaneGroup.add(moonRing, moonDisc);
    scene.add(moonPlaneGroup);

    // Node line through Earth (along the intersection of the two planes).
    const nodeLineMat = new THREE.LineBasicMaterial({ color: 0x77e0b0, transparent: true, opacity: 0.9 });
    const nodeGeom = new THREE.BufferGeometry().setFromPoints([
      new THREE.Vector3(-R_MOON_ORBIT * 1.7, 0, 0),
      new THREE.Vector3(R_MOON_ORBIT * 1.7, 0, 0),
    ]);
    const nodeLine = new THREE.Line(nodeGeom, nodeLineMat);
    scene.add(nodeLine);
    const nodeLabel = textSprite("line of nodes", "#77e0b0", 34);
    scene.add(nodeLabel);

    // Sun–Earth sight line (helps read "nodes point at the Sun").
    const sightMat = new THREE.LineDashedMaterial({ color: 0x666a7a, dashSize: 0.8, gapSize: 0.5, transparent: true, opacity: 0.7 });
    const sightGeom = new THREE.BufferGeometry();
    const sightLine = new THREE.Line(sightGeom, sightMat);
    scene.add(sightLine);

    let A: Astro | null = null;
    let nodeLon = 0;
    let nodeComputedAt = 0;
    loadAstro().then((mod) => {
      if (disposed) return;
      A = mod;
      nodeLon = findNodeLon(A, timeRef.current);
      nodeComputedAt = timeRef.current;
      setReady(true);
    });

    let lastFrame = performance.now();
    let lastHud = 0;

    const onResize = () => {
      camera.aspect = mount.clientWidth / mount.clientHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(mount.clientWidth, mount.clientHeight);
    };
    window.addEventListener("resize", onResize);

    const animate = (now: number) => {
      raf = requestAnimationFrame(animate);
      const dt = Math.min(now - lastFrame, 100);
      lastFrame = now;

      if (playingRef.current) {
        timeRef.current = Math.min(rangeEnd, Math.max(rangeStart, timeRef.current + speedRef.current * DAY_MS * (dt / 1000)));
      }

      if (A) {
        const tm = timeRef.current;
        const s = sampleAt(A, tm);
        if (Math.abs(tm - nodeComputedAt) > 2 * DAY_MS) {
          nodeLon = findNodeLon(A, tm);
          nodeComputedAt = tm;
        }

        // Earth on its orbit (heliocentric lon = geocentric sun lon + 180).
        const earthPos = eclipticToVec(s.sunLon + 180, 0, R_EARTH_ORBIT);
        earth.position.copy(earthPos);
        earthLabel.position.copy(earthPos).add(new THREE.Vector3(0, 2.1, 0));

        // Moon relative to Earth, latitude scaled by the tilt slider. The
        // latitude is exaggerated visually with the same factor the orbital
        // ring uses, so the Moon stays glued to its drawn orbit plane.
        const tiltF = tiltRef.current;
        const moonRel = eclipticToVec(s.moonLon, s.moonLat * tiltF, R_MOON_ORBIT);
        moon.position.copy(earthPos).add(moonRel);

        // Moon orbital plane: yaw the local +X axis onto the ascending node,
        // then tilt the plane about that node axis (local X).
        moonPlaneGroup.position.copy(earthPos);
        moonPlaneGroup.rotation.set(0, 0, 0);
        moonPlaneGroup.rotateY(nodeLon * DEG);
        moonPlaneGroup.rotateX(MOON_TILT_DEG * tiltF * DEG);
        // Node line lies along the node axis.
        nodeLine.position.copy(earthPos);
        nodeLine.rotation.set(0, nodeLon * DEG, 0);
        nodeLabel.position
          .copy(earthPos)
          .add(eclipticToVec(nodeLon, 0, R_MOON_ORBIT * 1.9))
          .add(new THREE.Vector3(0, 0.9, 0));

        // Sight line Earth→Sun (and beyond, for lunar side).
        const dir = new THREE.Vector3().sub(earthPos).normalize();
        sightGeom.setFromPoints([
          earthPos.clone().add(dir.clone().multiplyScalar(R_MOON_ORBIT * 1.7)),
          earthPos.clone().sub(dir.clone().multiplyScalar(R_MOON_ORBIT * 1.7)),
        ]);
        sightLine.computeLineDistances();

        // Eclipse-season / eclipse detection (approximate, geometry-based).
        const nodeDelta = Math.min(
          Math.abs((((s.sunLon - nodeLon) % 360) + 540) % 360 - 180),
          Math.abs((((s.sunLon - nodeLon + 180) % 360) + 540) % 360 - 180),
        );
        const season = nodeDelta > 180 - 16 || nodeDelta < 16;
        const effLat = Math.abs(s.moonLat * tiltF);
        const nearNew = s.phase < 12 || s.phase > 348;
        const nearFull = Math.abs(s.phase - 180) < 12;
        // Ecliptic limits: partial solar eclipses occur up to |lat| ≈ 1.55°,
        // penumbral lunar up to ≈ 1.5° — so a jump to any real eclipse peak
        // reliably lights up.
        const solarNow = nearNew && effLat < 1.6;
        const lunarNow = nearFull && effLat < 1.55;
        const ringColor = solarNow || lunarNow ? 0xff5544 : season ? 0x77e0b0 : 0xd9a24a;
        (moonRing.material as THREE.MeshBasicMaterial).color.setHex(ringColor);
        (nodeLineMat as THREE.LineBasicMaterial).opacity = season ? 1 : 0.45;

        controls.target.lerp(earthPos, 0.08);

        if (now - lastHud > 120) {
          lastHud = now;
          const d = new Date(tm);
          const ay = ayanamsa(tm);
          const sidereal = (((s.moonLon - ay) % 360) + 360) % 360;
          const nIdx = Math.floor(sidereal / (360 / 27)) % 27;

          // Nakshatra ring highlighting. Base state: dim gold, with the
          // Moon's current star gently brightened so its day-by-day march
          // around the ring is visible. During an eclipse: the star the
          // eclipse occurs in (janma) burns red, and its trine stars —
          // the 10th (anujanma) and 19th (trijanma) counted from it — go
          // bright gold: the traditional "affected" set.
          const eclipseNow = solarNow || lunarNow;
          const janma = nIdx;
          const anujanma = (nIdx + 9) % 27;
          const trijanma = (nIdx + 18) % 27;
          for (let i = 0; i < 27; i++) {
            const sprite = nakLabels[i];
            const mat = sprite.material as THREE.SpriteMaterial;
            if (eclipseNow && i === janma) {
              mat.color.set("#ff6655");
              mat.opacity = 1;
              sprite.scale.set(5.2, 1.3, 1);
            } else if (eclipseNow && (i === anujanma || i === trijanma)) {
              mat.color.set("#ffcf70");
              mat.opacity = 1;
              sprite.scale.set(4.6, 1.15, 1);
            } else if (!eclipseNow && i === nIdx) {
              mat.color.set("#e8dcc0");
              mat.opacity = 1;
              sprite.scale.set(4.2, 1.05, 1);
            } else {
              mat.color.set("#8a6b3a");
              mat.opacity = 0.75;
              sprite.scale.set(3.6, 0.9, 1);
            }
          }
          const affectedIdx = [janma, anujanma, trijanma];
          wedges.forEach((w, i) => {
            w.visible = eclipseNow;
            if (eclipseNow) aimWedge(w, affectedIdx[i]);
          });
          connectors.forEach((c, i) => {
            c.line.visible = eclipseNow;
            if (eclipseNow) {
              c.geom.setFromPoints([moon.position.clone(), nakLabelPos[affectedIdx[i]].clone()]);
            }
          });
          const phaseName =
            s.phase < 12 || s.phase > 348
              ? t("అమావాస్య (New Moon)", "New Moon")
              : Math.abs(s.phase - 180) < 12
                ? t("పూర్ణిమ (Full Moon)", "Full Moon")
                : s.phase < 180
                  ? t("శుక్ల పక్షం", "Waxing")
                  : t("కృష్ణ పక్షం", "Waning");
          const names = language === "telugu" ? nakshatraNamesTelugu : nakshatraNames;
          setHud({
            dateLabel: d.toLocaleDateString(language === "telugu" ? "te-IN" : "en-US", {
              year: "numeric",
              month: "short",
              day: "numeric",
            }),
            phaseName,
            nakshatra: names[nIdx],
            eclipse: solarNow ? "solar" : lunarNow ? "lunar" : null,
            season,
            affected: eclipseNow ? [names[janma], names[anujanma], names[trijanma]] : null,
          });
          setTimeMs(tm);
        }
      }

      controls.update();
      renderer.render(scene, camera);
    };
    raf = requestAnimationFrame(animate);

    return () => {
      disposed = true;
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", onResize);
      controls.dispose();
      renderer.dispose();
      mount.removeChild(renderer.domElement);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [language]);

  // Land paused exactly on the eclipse peak, so the highlight and the
  // affected-stars panel are on screen for as long as the user wants.
  const jumpToNextEclipse = () => {
    const next = marks.find((m) => m.t > timeRef.current + DAY_MS);
    if (next) {
      timeRef.current = next.t;
      setTimeMs(timeRef.current);
      setPlaying(false);
    }
  };

  const [, navigate] = useLocation();
  const goBack = () => {
    // Back through history when the user navigated here inside the app;
    // external arrivals (Reddit, search) land on /eclipses instead of leaving the site.
    const depth = Number(sessionStorage.getItem("nav-depth") || "0");
    if (depth > 1) {
      window.history.back();
    } else {
      navigate("/eclipses");
    }
  };

  const pct = ((timeMs - rangeStart) / (rangeEnd - rangeStart)) * 100;

  return (
    <div className="fixed inset-0 flex flex-col bg-[#050510] text-[#e8dcc0]">
      <header className="flex items-center justify-between gap-3 px-4 py-2.5 border-b border-white/10 bg-black/30 backdrop-blur z-10">
        <div className="flex items-center gap-3 min-w-0">
          <button
            onClick={goBack}
            className="inline-flex shrink-0 items-center gap-1.5 rounded-full border border-white/15 px-3 py-1.5 text-sm text-white/70 hover:bg-white/10 hover:text-white"
            data-testid="link-back-eclipses"
          >
            <ArrowLeft className="h-4 w-4" />
            {t("వెనుకకు", "Back")}
          </button>
          <h1 className="text-base md:text-lg font-semibold truncate" data-testid="text-sky-title">
            {t("గ్రహణాలు ఎందుకు అరుదు? — 3D దృశ్యం", "Why are eclipses rare? — a 3D answer")}
          </h1>
        </div>
        <ThemeToggle />
      </header>

      <div ref={mountRef} className="relative flex-1 min-h-0" data-testid="orrery-canvas">
        {!ready && (
          <div className="absolute inset-0 grid place-items-center text-white/50 text-sm">
            {t("లోడ్ అవుతోంది…", "Loading the sky…")}
          </div>
        )}

        {hud && (
          <div className="absolute top-3 left-3 space-y-1 text-sm pointer-events-none" data-testid="orrery-hud">
            <p className="text-lg font-semibold tabular-nums">{hud.dateLabel}</p>
            <p className="text-white/70">
              {hud.phaseName} · {t("నక్షత్రం", "Moon in")} {hud.nakshatra}
            </p>
            {hud.eclipse ? (
              <div className="space-y-1">
                <p className="inline-block rounded bg-red-500/90 px-2 py-0.5 font-semibold text-white">
                  {hud.eclipse === "solar"
                    ? t("సూర్యగ్రహణం!", "SOLAR ECLIPSE!")
                    : t("చంద్రగ్రహణం!", "LUNAR ECLIPSE!")}
                </p>
                {hud.affected && (
                  <div
                    className="max-w-[290px] space-y-1.5 rounded-lg border border-amber-400/25 bg-black/60 p-2.5 text-xs leading-snug backdrop-blur pointer-events-auto"
                    data-testid="text-affected-stars"
                  >
                    <p className="text-amber-200/90 font-medium">
                      {t("ప్రభావిత నక్షత్రాలు", "Affected stars")}:{" "}
                      <span className="text-red-300">{hud.affected[0]}</span>
                      {" · "}{hud.affected[1]}{" · "}{hud.affected[2]}
                    </p>
                    <p className="text-white/65">
                      {t(
                        `ఈ క్షణంలో చంద్రుడు ${hud.affected[0]} నక్షత్రంలో ఉన్నాడు — అందుకే ఈ గ్రహణం "${hud.affected[0]}లో" జరుగుతుంది (జన్మ నక్షత్రం, ఎరుపు). నక్షత్రాలను 9 చొప్పున లెక్కిస్తే ${hud.affected[0]} స్థానమే 10వదిగా ${hud.affected[1]}కు, 19వదిగా ${hud.affected[2]}కు వస్తుంది — ఇవి అనుజన్మ, త్రిజన్మ (బంగారు రంగు). ఈ మూడు నక్షత్రాలలో జన్మించినవారికి గ్రహణ శాంతి చెప్పబడింది.`,
                        `Right now the Moon is standing in ${hud.affected[0]} — so this eclipse "occurs in" ${hud.affected[0]} (its janma star, red). Nakshatras repeat in cycles of 9: counting from ${hud.affected[0]}, the 10th is ${hud.affected[1]} and the 19th is ${hud.affected[2]} — the same seat in the next two cycles (anujanma & trijanma, gold). People born under these three stars are traditionally advised grahana-shanti remedies.`,
                      )}
                    </p>
                  </div>
                )}
              </div>
            ) : hud.season ? (
              <p className="inline-block rounded bg-emerald-500/20 px-2 py-0.5 text-emerald-300">
                {t("గ్రహణ ఋతువు — నోడ్స్ సూర్యుని వైపు", "Eclipse season — nodes point at the Sun")}
              </p>
            ) : null}
          </div>
        )}

        <p className="absolute bottom-2 right-3 text-[10px] text-white/35 pointer-events-none">
          {t("కోణాలు నిజమైనవి · దూరాలు స్కేల్ కాదు · astronomy-engine", "Real angles · distances not to scale · astronomy-engine")}
        </p>
      </div>

      <div className="border-t border-white/10 bg-black/40 backdrop-blur px-4 py-3 space-y-2.5 z-10">
        {/* timeline with real eclipse markers */}
        <div className="relative">
          <input
            type="range"
            min={rangeStart}
            max={rangeEnd}
            step={3600_000}
            value={timeMs}
            onChange={(e) => {
              timeRef.current = Number(e.target.value);
              setTimeMs(timeRef.current);
            }}
            className="w-full accent-amber-400"
            data-testid="slider-time"
          />
          <div className="pointer-events-none absolute inset-x-0 top-0 h-2">
            {marks.map((m) => {
              const p = ((m.t - rangeStart) / (rangeEnd - rangeStart)) * 100;
              if (p < 0 || p > 100) return null;
              return (
                <span
                  key={m.t}
                  title={m.label}
                  className={`absolute top-[-2px] h-2.5 w-[3px] rounded ${m.type === "solar" ? "bg-amber-400" : "bg-red-400"}`}
                  style={{ left: `${p}%` }}
                />
              );
            })}
          </div>
          <span className="sr-only">{pct.toFixed(0)}%</span>
        </div>

        <div className="flex flex-wrap items-center gap-x-5 gap-y-2">
          <div className="flex items-center gap-1.5">
            <Button size="icon" variant="ghost" className="h-8 w-8 text-inherit" onClick={() => setSpeed((s) => Math.max(0.25, s / 2))} data-testid="button-slower">
              <Rewind className="h-4 w-4" />
            </Button>
            <Button size="icon" variant="ghost" className="h-8 w-8 text-inherit" onClick={() => setPlaying((p) => !p)} data-testid="button-play">
              {playing ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
            </Button>
            <Button size="icon" variant="ghost" className="h-8 w-8 text-inherit" onClick={() => setSpeed((s) => Math.min(16, s * 2))} data-testid="button-faster">
              <FastForward className="h-4 w-4" />
            </Button>
            <span className="text-xs text-white/60 tabular-nums w-16">{speed}× {t("రోజు/సె", "day/s")}</span>
          </div>

          <div className="flex items-center gap-2 min-w-[220px] flex-1 max-w-xs">
            <span className="text-xs text-white/60 whitespace-nowrap">
              {t("చంద్రుని వంపు", "Moon's tilt")}: {(tilt * MOON_TILT_DEG).toFixed(1)}°
            </span>
            <Slider
              value={[tilt]}
              onValueChange={(v) => setTilt(v[0])}
              min={0}
              max={1}
              step={0.01}
              className="flex-1"
              data-testid="slider-tilt"
            />
          </div>

          <Button size="sm" variant="outline" className="border-white/20 bg-transparent text-inherit hover:bg-white/10" onClick={jumpToNextEclipse} data-testid="button-next-eclipse">
            {t("తదుపరి గ్రహణానికి", "Jump to next eclipse")}
          </Button>
        </div>

        <p className="text-xs text-white/45 leading-relaxed max-w-3xl">
          {t(
            "చంద్రుని కక్ష్య 5.1° వంగి ఉంది. నోడ్ రేఖ (ఆకుపచ్చ) సూర్యుని వైపు చూపినప్పుడే — సంవత్సరానికి రెండుసార్లు — గ్రహణాలు వస్తాయి. వంపును 0°కి జరిపి చూడండి: ప్రతి అమావాస్య, పూర్ణిమకూ గ్రహణమే! గ్రహణ సమయంలో చంద్రుడు ఉన్న నక్షత్రమే (ఎరుపు) ఎక్కువగా ప్రభావితం — దాని నుంచి 10వ, 19వ నక్షత్రాలు (బంగారు రంగు) కూడా.",
            "The Moon's orbit is tilted 5.1°. Eclipses happen only when the green line of nodes points at the Sun — about twice a year. Drag the tilt to 0° and watch an eclipse fire at every new and full moon. The star the Moon occupies at that moment (red) is the eclipse's janma nakshatra — most affected — along with the 10th and 19th stars counted from it (gold).",
          )}
        </p>
      </div>
    </div>
  );
}

