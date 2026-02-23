"use client";

import { useEffect, useRef, type RefObject } from "react";

const CHARS = "{}[]·:.-+*<>/|";
const FONT_SIZE = 16;
const LINE_HEIGHT = FONT_SIZE * 1.7;
const CHAR_WIDTH = FONT_SIZE * 0.62;
const MOUSE_RADIUS = 300;
const DRIFT_INTERVAL = 400;
const FADE_STEP = 0.0015;

const BRIGHT_ALPHA_LIGHT = 0.45;
const BRIGHT_ALPHA_DARK = 0.3;

const NUM_LEAVES = 14;

type Leaf = {
  baseX: number;
  baseY: number;
  length: number;
  halfWidth: number;
  baseAngle: number;
  driftPhase: number;
  swayPhase: number;
  driftAmpX: number;
  driftAmpY: number;
};

function generateLeaves(): Leaf[] {
  const leaves: Leaf[] = [];
  for (let i = 0; i < NUM_LEAVES; i++) {
    const seed = Math.sin(i * 73.17 + 3.91) * 43758.5453;
    const r = seed - Math.floor(seed);
    const seed2 = Math.sin(i * 127.3 + 7.13) * 23421.631;
    const r2 = seed2 - Math.floor(seed2);
    leaves.push({
      baseX: 0.05 + r * 0.9,
      baseY: 0.05 + r2 * 0.9,
      length: 0.03 + r * 0.03,
      halfWidth: 0.006 + r2 * 0.008,
      baseAngle: r * Math.PI * 2,
      driftPhase: r * 10,
      swayPhase: r2 * 10,
      driftAmpX: 0.06 + r2 * 0.08,
      driftAmpY: 0.04 + r * 0.06,
    });
  }
  return leaves;
}

function leafSDF(nx: number, ny: number, leaf: Leaf, t: number): number {
  const cx = leaf.baseX + Math.sin(t * 0.3 + leaf.driftPhase) * leaf.driftAmpX;
  const cy =
    leaf.baseY + Math.sin(t * 0.22 + leaf.driftPhase + 1.5) * leaf.driftAmpY;
  const angle = leaf.baseAngle + Math.sin(t * 0.4 + leaf.swayPhase) * 0.5;
  const cosA = Math.cos(angle);
  const sinA = Math.sin(angle);
  const dx = nx - cx;
  const dy = ny - cy;
  const lx = dx * cosA + dy * sinA;
  const ly = -dx * sinA + dy * cosA;
  const normX = lx / leaf.length + 0.5;
  if (normX < 0 || normX > 1) return -1;
  const envelope = Math.sin(normX * Math.PI) * leaf.halfWidth;
  if (envelope <= 0) return -1;
  const normDist = Math.abs(ly) / envelope;
  if (normDist > 1) return -1;
  return 1 - normDist;
}

function randomChar() {
  return CHARS[Math.floor(Math.random() * CHARS.length)];
}

export type HighlightData = {
  text: string;
  intensity: number; // 0–1, how visible the highlight is
};

export default function AsciiAmbient({
  highlightRef,
}: {
  highlightRef?: RefObject<HighlightData>;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current!;
    if (!canvas) return;
    const ctx = canvas.getContext("2d")!;
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    let width = window.innerWidth;
    let height = window.innerHeight;
    let cols = 0;
    let rows = 0;
    let chars: string[] = [];
    let brightness: number[] = [];

    const isDark = () =>
      document.documentElement.getAttribute("data-color-scheme") === "dark" ||
      (!document.documentElement.getAttribute("data-color-scheme") &&
        window.matchMedia("(prefers-color-scheme: dark)").matches);

    function initGrid() {
      cols = Math.floor(width / CHAR_WIDTH);
      rows = Math.floor(height / LINE_HEIGHT);
      chars = new Array(cols * rows);
      brightness = new Array(cols * rows).fill(0);
      for (let i = 0; i < chars.length; i++) {
        chars[i] = randomChar();
      }
    }

    const accentCells = new Set<number>();
    const leaves = generateLeaves();
    let leafDepthMap = new Float32Array(0);

    function setupCanvas() {
      width = window.innerWidth;
      height = window.innerHeight;
      canvas.width = width * dpr;
      canvas.height = height * dpr;
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      initGrid();
      leafDepthMap = new Float32Array(cols * rows).fill(-1);
    }

    function updateLeaves(t: number) {
      for (let row = 0; row < rows; row++) {
        for (let col = 0; col < cols; col++) {
          const idx = row * cols + col;
          const nx = col / cols;
          const ny = row / rows;
          let maxDepth = -1;
          for (const leaf of leaves) {
            const d = leafSDF(nx, ny, leaf, t);
            if (d > maxDepth) maxDepth = d;
          }
          leafDepthMap[idx] = maxDepth;
        }
      }
    }

    function renderFrame() {
      const dark = isDark();
      const baseColor = dark ? "rgb(200, 200, 200)" : "rgb(60, 60, 60)";
      const accentColor = "rgb(45, 125, 154)";
      const accentColor2 = "rgb(196, 99, 106)";

      ctx.clearRect(0, 0, width, height);
      ctx.font = `${FONT_SIZE}px monospace`;
      ctx.textBaseline = "top";

      for (let i = 0; i < cols * rows; i++) {
        if (brightness[i] <= 0) continue;

        const depth = leafDepthMap[i];
        if (depth > 0.15) continue;

        let leafMask = 1;
        if (depth >= 0 && depth <= 0.15) {
          leafMask = 1 - depth / 0.15;
        }

        const col = i % cols;
        const row = Math.floor(i / cols);
        ctx.globalAlpha = brightness[i] * leafMask;

        // Accent colors from spotlight — but never inside highlight text region
        const inHighlight = hlMask && hlMask[i] > 20;
        if (accentCells.has(i) && !inHighlight) {
          ctx.fillStyle = i % 3 === 0 ? accentColor2 : accentColor;
        } else {
          ctx.fillStyle = baseColor;
        }

        ctx.fillText(chars[i], col * CHAR_WIDTH, row * LINE_HEIGHT);
      }

      ctx.globalAlpha = 1;
    }

    // Offscreen canvas for rendering highlight text as a pixel mask
    const hlCanvas = document.createElement("canvas");
    const hlCtx = hlCanvas.getContext("2d")!;
    let hlMask: Uint8Array | null = null;
    let hlRevealThreshold: Float32Array | null = null; // per-cell random reveal order
    let hlMaskText = "";

    function updateHighlightMask() {
      const hl = highlightRef?.current;
      if (!hl || !hl.text) {
        hlMask = null;
        hlMaskText = "";
        return;
      }

      // Only re-render if text changed
      if (hl.text === hlMaskText && hlMask) return;
      hlMaskText = hl.text;

      hlCanvas.width = cols;
      hlCanvas.height = rows;
      hlCtx.clearRect(0, 0, cols, rows);
      hlCtx.fillStyle = "white";
      hlCtx.textBaseline = "middle";
      hlCtx.textAlign = "center";

      // Brutalist: fixed massive font + fixed kerning, text overflows freely
      const text = hl.text.toUpperCase();
      const fontSize = rows * 0.75;
      const kerning = fontSize * 0.85; // fixed spacing between letter centers
      hlCtx.font = `900 ${fontSize}px monospace`;

      // Center the text horizontally — pin to left edge if it overflows
      const totalWidth = (text.length - 1) * kerning;
      const halfChar = fontSize * 0.35;
      const startX = Math.max(halfChar, (cols - totalWidth) / 2);
      const centerY = rows / 2;

      for (let i = 0; i < text.length; i++) {
        const x = startX + i * kerning;
        hlCtx.fillText(text[i], x, centerY);
      }

      // Read pixels as mask + generate per-cell random reveal order
      const imgData = hlCtx.getImageData(0, 0, cols, rows);
      const total = cols * rows;
      hlMask = new Uint8Array(total);
      hlRevealThreshold = new Float32Array(total);
      for (let i = 0; i < total; i++) {
        hlMask[i] = imgData.data[i * 4 + 3]; // alpha channel
        // Deterministic hash per cell position
        const h = Math.sin(i * 127.1 + 311.7) * 43758.5453;
        hlRevealThreshold[i] = h - Math.floor(h); // 0–1
      }
    }

    // Mouse state
    let mouseX = -9999;
    let mouseY = -9999;
    let hovering = false;
    let cursorIdle = false;
    let lastMoveTime = 0;
    const IDLE_THRESHOLD = 1000; // ms before spotlight fades
    let activeCells = new Set<number>();

    function computeActiveCells(): Set<number> {
      if (!hovering) return new Set();
      const result = new Set<number>();
      const minCol = Math.max(
        0,
        Math.floor((mouseX - MOUSE_RADIUS) / CHAR_WIDTH),
      );
      const maxCol = Math.min(
        cols - 1,
        Math.ceil((mouseX + MOUSE_RADIUS) / CHAR_WIDTH),
      );
      const minRow = Math.max(
        0,
        Math.floor((mouseY - MOUSE_RADIUS) / LINE_HEIGHT),
      );
      const maxRow = Math.min(
        rows - 1,
        Math.ceil((mouseY + MOUSE_RADIUS) / LINE_HEIGHT),
      );
      for (let row = minRow; row <= maxRow; row++) {
        for (let col = minCol; col <= maxCol; col++) {
          const cx = col * CHAR_WIDTH + CHAR_WIDTH / 2;
          const cy = row * LINE_HEIGHT + LINE_HEIGHT / 2;
          const dx = cx - mouseX;
          const dy = cy - mouseY;
          if (Math.sqrt(dx * dx + dy * dy) < MOUSE_RADIUS) {
            const idx = row * cols + col;
            if (idx >= 0 && idx < chars.length) result.add(idx);
          }
        }
      }
      return result;
    }

    function brightenNearMouse() {
      const newActive = computeActiveCells();
      const hlActive =
        hlMask &&
        (highlightRef?.current?.intensity ?? 0) > 0.1 &&
        hlRevealProgress > 0;
      for (const idx of newActive) {
        if (hlActive && hlMask![idx] > 20) continue;

        const col = idx % cols;
        const row = Math.floor(idx / cols);
        const cx = col * CHAR_WIDTH + CHAR_WIDTH / 2;
        const cy = row * LINE_HEIGHT + LINE_HEIGHT / 2;
        const dx = cx - mouseX;
        const dy = cy - mouseY;
        const dist = Math.sqrt(dx * dx + dy * dy);
        const intensity = 1 - dist / MOUSE_RADIUS;
        const brightAlpha = isDark() ? BRIGHT_ALPHA_DARK : BRIGHT_ALPHA_LIGHT;
        brightness[idx] = Math.max(
          brightness[idx],
          brightAlpha * intensity * intensity,
        );
        if (intensity > 0.4 && Math.random() < 0.08) accentCells.add(idx);
      }
      activeCells = newActive;
    }

    let raf = 0;
    const DAPPLE_ALPHA_LIGHT = 0.2;
    const DAPPLE_ALPHA_DARK = 0.12;
    const DAPPLE_FADE_SPEED = 0.04;
    let dappleIntensity = 1;
    let hoverEndTime = 0;
    const DAPPLE_RETURN_DELAY = 800;

    // Highlight reveal animation — sweeps letters left to right
    let hlRevealProgress = 0;
    let hlPrevText = "";
    const HL_REVEAL_SPEED = 0.025;

    // Old text fade-out — cells disappear in pseudo-random order
    let fadingMask: Uint8Array | null = null;
    let fadingThresholds: Float32Array | null = null;
    let fadeOutProgress = 0; // 0 = fully visible, advances to 1 = fully gone
    const FADE_OUT_SWEEP_SPEED = 0.035;

    function tick() {
      const now = performance.now();
      const t = now * 0.001;

      updateLeaves(t);

      // Treat an idle cursor as "not hovering" — fade spotlight, restore dapple
      if (hovering && !cursorIdle && now - lastMoveTime > IDLE_THRESHOLD) {
        cursorIdle = true;
        activeCells = new Set();
      }

      const effectiveHover = hovering && !cursorIdle;

      if (effectiveHover) {
        dappleIntensity += (0 - dappleIntensity) * DAPPLE_FADE_SPEED;
        hoverEndTime = now;
      } else if (now - hoverEndTime > DAPPLE_RETURN_DELAY) {
        dappleIntensity += (1 - dappleIntensity) * DAPPLE_FADE_SPEED;
      }

      for (let i = 0; i < brightness.length; i++) {
        if (brightness[i] > 0 && !activeCells.has(i)) {
          brightness[i] = Math.max(0, brightness[i] - FADE_STEP);
          if (brightness[i] <= 0) accentCells.delete(i);
        }
      }

      // Check if text is about to change — save old mask BEFORE updating
      const hlText = highlightRef?.current?.text ?? "";
      const textChanging = hlText !== hlPrevText;
      if (textChanging && hlMask) {
        fadingMask = new Uint8Array(hlMask);
        fadingThresholds = hlRevealThreshold
          ? new Float32Array(hlRevealThreshold)
          : null;
        fadeOutProgress = 0;
      }

      // Now update the mask (this overwrites hlMask with new text)
      updateHighlightMask();
      const hlIntensity = highlightRef?.current?.intensity ?? 0;

      if (textChanging) {
        hlRevealProgress = 0;
        hlPrevText = hlText;
      }

      // Drain old text brightness — cells disappear in pseudo-random order
      if (fadingMask) {
        fadeOutProgress = Math.min(1, fadeOutProgress + FADE_OUT_SWEEP_SPEED);
        let anyLeft = false;

        for (let i = 0; i < brightness.length; i++) {
          if (fadingMask[i] > 20 && brightness[i] > 0) {
            const threshold = fadingThresholds ? fadingThresholds[i] : 0;
            const clearAmount = Math.max(
              0,
              Math.min(1, (fadeOutProgress * 1.3 - threshold) * 4),
            );

            if (clearAmount > 0) {
              brightness[i] = Math.max(0, brightness[i] * (1 - clearAmount));
            }

            if (brightness[i] > 0) anyLeft = true;
          }
        }

        if (!anyLeft || fadeOutProgress >= 1) {
          fadingMask = null;
          fadingThresholds = null;
        }
      }

      // Don't start new reveal until old text is gone AND camera is close
      if (fadingMask) {
        hlRevealProgress = 0;
      } else if (hlText && hlIntensity > 0.3) {
        hlRevealProgress = Math.min(1, hlRevealProgress + HL_REVEAL_SPEED);
      } else if (hlRevealProgress > 0 && hlIntensity < 0.1) {
        hlRevealProgress = Math.max(0, hlRevealProgress - HL_REVEAL_SPEED * 2);
      }

      if (dappleIntensity > 0.001 || (hlMask && hlIntensity > 0.01)) {
        const windX = t * 0.18;
        const windY = t * 0.07;
        const dappleAlpha = isDark() ? DAPPLE_ALPHA_DARK : DAPPLE_ALPHA_LIGHT;

        for (let row = 0; row < rows; row++) {
          for (let col = 0; col < cols; col++) {
            const idx = row * cols + col;
            const nx = col / cols;
            const ny = row / rows;

            // Base dapple noise
            const n1 =
              Math.sin((nx * 3.2 + windX) * 2.0) *
              Math.sin((ny * 2.8 + windY) * 2.0) *
              Math.sin((nx * 1.5 - ny * 2.1 + t * 0.12) * 1.8);
            const n2 =
              Math.sin((nx * 7.1 + windX * 1.3 + 5.2) * 1.5) *
              Math.sin((ny * 6.3 + windY * 1.1 + 3.1) * 1.5) *
              0.5;
            const cellHash = Math.sin(col * 127.1 + row * 311.7) * 43758.5453;
            const cellNoise = cellHash - Math.floor(cellHash);
            const shimmer =
              Math.sin(t * (1.2 + cellNoise * 2.0) + cellNoise * 6.28) * 0.15;
            const combined = n1 + n2 + shimmer;
            const edge = Math.max(0, Math.min(1, combined * 2.0 + 0.3));

            // Highlight mask with pseudo-random reveal
            const maskVal =
              hlMask && hlIntensity > 0.01 && hlRevealProgress > 0
                ? (hlMask[idx] ?? 0)
                : 0;

            const threshold = hlRevealThreshold ? hlRevealThreshold[idx] : 0;
            // Expand progress past 1.0 so all cells fully resolve before progress caps
            const cellReveal = Math.max(
              0,
              Math.min(1, (hlRevealProgress * 1.3 - threshold) * 4),
            );

            const inTextRegion = maskVal > 20 && cellReveal > 0.01;

            if (inTextRegion) {
              const hlAlphaBase = isDark() ? 0.82 : 0.85;
              const hlAlpha =
                (maskVal / 255) * hlIntensity * cellReveal * hlAlphaBase;
              if (hlAlpha > brightness[idx]) brightness[idx] = hlAlpha;
            } else {
              const nearText = maskVal > 0 && cellReveal > 0;
              const suppressFactor = nearText
                ? 1 - (maskVal / 255) * hlIntensity * cellReveal
                : 1;
              const totalAlpha =
                edge * dappleAlpha * dappleIntensity * suppressFactor;
              if (totalAlpha > 0.01) {
                if (totalAlpha > brightness[idx]) brightness[idx] = totalAlpha;
              }
            }
          }
        }
      }

      renderFrame();
      raf = requestAnimationFrame(tick);
    }

    const spotlightSections = document.querySelectorAll(
      'section[aria-label="Introduction"], section[aria-label="Get in touch"]',
    );

    const onPointerMove = (e: PointerEvent) => {
      const moved = e.clientX !== mouseX || e.clientY !== mouseY;
      mouseX = e.clientX;
      mouseY = e.clientY;

      if (moved) {
        lastMoveTime = performance.now();
        cursorIdle = false;
      }

      hovering = false;
      for (const section of spotlightSections) {
        const rect = section.getBoundingClientRect();
        if (
          mouseX >= rect.left &&
          mouseX <= rect.right &&
          mouseY >= rect.top &&
          mouseY <= rect.bottom
        ) {
          hovering = true;
          break;
        }
      }
      if (hovering && !cursorIdle) brightenNearMouse();
      else activeCells = new Set();
    };

    const onPointerLeave = () => {
      mouseX = -9999;
      mouseY = -9999;
      hovering = false;
      activeCells = new Set();
    };

    const prefersReducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;

    const driftTimer = prefersReducedMotion
      ? null
      : setInterval(() => {
          if (chars.length === 0) return;
          const idx = Math.floor(Math.random() * chars.length);
          chars[idx] = randomChar();
        }, DRIFT_INTERVAL);

    document.fonts.ready.then(() => {
      setupCanvas();
      if (prefersReducedMotion) {
        // Render one static frame — no animation loop
        updateLeaves(0);
        const windX = 0;
        const windY = 0;
        const dappleAlpha = isDark() ? DAPPLE_ALPHA_DARK : DAPPLE_ALPHA_LIGHT;
        for (let row = 0; row < rows; row++) {
          for (let col = 0; col < cols; col++) {
            const idx = row * cols + col;
            const nx = col / cols;
            const ny = row / rows;
            const n1 =
              Math.sin((nx * 3.2 + windX) * 2.0) *
              Math.sin((ny * 2.8 + windY) * 2.0) *
              Math.sin((nx * 1.5 - ny * 2.1) * 1.8);
            const edge = Math.max(0, Math.min(1, n1 * 2.0 + 0.3));
            brightness[idx] = Math.max(brightness[idx], edge * dappleAlpha);
          }
        }
        renderFrame();
      } else {
        raf = requestAnimationFrame(tick);
      }
    });

    window.addEventListener("resize", setupCanvas);

    const hasFinePointer = window.matchMedia("(pointer: fine)").matches;
    if (hasFinePointer) {
      window.addEventListener("pointermove", onPointerMove, { passive: true });
      document.addEventListener("pointerleave", onPointerLeave);
    }

    return () => {
      cancelAnimationFrame(raf);
      if (driftTimer) clearInterval(driftTimer);
      window.removeEventListener("resize", setupCanvas);
      if (hasFinePointer) {
        window.removeEventListener("pointermove", onPointerMove);
        document.removeEventListener("pointerleave", onPointerLeave);
      }
    };
    // highlightRef is a stable ref — no need to include in deps
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 h-full w-full"
      aria-hidden="true"
    />
  );
}
