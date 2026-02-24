"use client";

import { useEffect, useRef, type RefObject } from "react";

const CHARS = "{}[]·:.-+*<>/|";
const FONT_SIZE = 16;
const LINE_HEIGHT = FONT_SIZE * 1.7;
const CHAR_WIDTH = FONT_SIZE * 0.62;
const MOUSE_RADIUS_MIN = 50;
const MOUSE_RADIUS_MAX = 250;
const MOUSE_RADIUS_LERP = 0.05;
const DRIFT_INTERVAL = 500;
const FADE_STEP = 0.009;
const IDLE_THRESHOLD = 800; // ms before spotlight fades
const MIN_SPEED = 100; // px/s threshold to trigger spotlight

const BRIGHT_ALPHA_LIGHT = 0.45;
const BRIGHT_ALPHA_DARK = 0.3;

function randomChar() {
  return CHARS[Math.floor(Math.random() * CHARS.length)];
}

export type HighlightData = {
  text: string;
  intensity: number; // 0–1, how visible the highlight is
  owner?: string;
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
      hlMaskText = ""; // invalidate so highlight recomputes at new grid size
      updateTextDimMap();
      lastDimScrollY = window.scrollY;
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
        const dim = textDimMap.length > i ? textDimMap[i] : 1;
        ctx.globalAlpha = brightness[i] * leafMask * dim;

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
    let cursorSpeed = 0; // px/s
    let mouseRadius = MOUSE_RADIUS_MIN;
    let activeCells = new Set<number>();

    function computeActiveCells(): Set<number> {
      if (!hovering) return new Set();
      const r = mouseRadius;
      const result = new Set<number>();
      const minCol = Math.max(0, Math.floor((mouseX - r) / CHAR_WIDTH));
      const maxCol = Math.min(cols - 1, Math.ceil((mouseX + r) / CHAR_WIDTH));
      const minRow = Math.max(0, Math.floor((mouseY - r) / LINE_HEIGHT));
      const maxRow = Math.min(rows - 1, Math.ceil((mouseY + r) / LINE_HEIGHT));
      for (let row = minRow; row <= maxRow; row++) {
        for (let col = minCol; col <= maxCol; col++) {
          const cx = col * CHAR_WIDTH + CHAR_WIDTH / 2;
          const cy = row * LINE_HEIGHT + LINE_HEIGHT / 2;
          const dx = cx - mouseX;
          const dy = cy - mouseY;
          if (Math.sqrt(dx * dx + dy * dy) < r) {
            const idx = row * cols + col;
            if (idx >= 0 && idx < chars.length) result.add(idx);
          }
        }
      }
      return result;
    }

    function brightenNearMouse() {
      const newActive = computeActiveCells();
      const r = mouseRadius;
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
        const intensity = 1 - dist / r;
        const brightAlpha = isDark() ? BRIGHT_ALPHA_DARK : BRIGHT_ALPHA_LIGHT;
        const spotlightVal = brightAlpha * intensity * intensity;
        brightness[idx] = Math.min(1, brightness[idx] + spotlightVal);
        if (intensity > 0.4 && Math.random() < 0.08) accentCells.add(idx);
      }
      activeCells = newActive;
    }

    let raf = 0;
    const DAPPLE_ALPHA_LIGHT = 0.2;
    const DAPPLE_ALPHA_DARK = 0.3;

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

      const sy = window.scrollY;
      if (sy !== lastDimScrollY) {
        updateTextDimMap();
        lastDimScrollY = sy;
      }

      // Treat an idle cursor as "not hovering" — fade spotlight
      if (hovering && !cursorIdle && now - lastMoveTime > IDLE_THRESHOLD) {
        cursorIdle = true;
        activeCells = new Set();
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
      // Once revealed, text stays at full brightness — exit is handled
      // exclusively by the fadingMask dissolve when text changes.
      if (fadingMask) {
        hlRevealProgress = 0;
      } else if (hlText && hlIntensity > 0.3) {
        hlRevealProgress = Math.min(1, hlRevealProgress + HL_REVEAL_SPEED);
      }

      const windX = t * 0.18;
      const windY = t * 0.07;
      const dark = isDark();
      const dappleAlpha = dark ? DAPPLE_ALPHA_DARK : DAPPLE_ALPHA_LIGHT;

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
            hlMask && hlRevealProgress > 0 ? (hlMask[idx] ?? 0) : 0;

          const threshold = hlRevealThreshold ? hlRevealThreshold[idx] : 0;
          // Expand progress past 1.0 so all cells fully resolve before progress caps
          const cellReveal = Math.max(
            0,
            Math.min(1, (hlRevealProgress * 1.3 - threshold) * 4),
          );

          const inTextRegion = maskVal > 20 && cellReveal > 0.01;

          if (inTextRegion) {
            const hlAlphaBase = dark ? 0.82 : 0.85;
            const hlAlpha = (maskVal / 255) * cellReveal * hlAlphaBase;
            if (hlAlpha > brightness[idx]) brightness[idx] = hlAlpha;
          } else {
            const nearText = maskVal > 0 && cellReveal > 0;
            const suppressFactor = nearText
              ? 1 - (maskVal / 255) * cellReveal
              : 1;
            const totalAlpha = edge * dappleAlpha * suppressFactor;
            if (totalAlpha > 0.01) {
              if (totalAlpha > brightness[idx]) brightness[idx] = totalAlpha;
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

    // Per-cell dimming mask — cells behind text render faintly so text wins
    const TEXT_DIM_FLOOR = 0.15;
    const TEXT_DIM_PAD = 150; // px feather around text rects
    let textDimMap = new Float32Array(0);
    let lastDimScrollY = -1;

    function getTextContainerRects(): DOMRect[] {
      const rects: DOMRect[] = [];
      for (const section of spotlightSections) {
        const children = section.querySelectorAll(
          ":scope > *:not([aria-hidden])",
        );
        let top = Infinity;
        let left = Infinity;
        let bottom = -Infinity;
        let right = -Infinity;
        let found = false;
        for (const el of children) {
          const r = el.getBoundingClientRect();
          if (r.width === 0 || r.height === 0) continue;
          found = true;
          top = Math.min(top, r.top);
          left = Math.min(left, r.left);
          bottom = Math.max(bottom, r.bottom);
          right = Math.max(right, r.right);
        }
        if (found) {
          rects.push(new DOMRect(left, top, right - left, bottom - top));
        }
      }
      return rects;
    }

    function updateTextDimMap() {
      const rects = getTextContainerRects();
      if (textDimMap.length !== cols * rows) {
        textDimMap = new Float32Array(cols * rows);
      }
      for (let row = 0; row < rows; row++) {
        for (let col = 0; col < cols; col++) {
          const px = col * CHAR_WIDTH + CHAR_WIDTH / 2;
          const py = row * LINE_HEIGHT + LINE_HEIGHT / 2;
          let minDist = Infinity;
          for (const r of rects) {
            const dx = Math.max(r.left - px, 0, px - r.right);
            const dy = Math.max(r.top - py, 0, py - r.bottom);
            const dist = Math.sqrt(dx * dx + dy * dy);
            if (dist < minDist) minDist = dist;
          }
          // Spatial noise breaks up the rectangular edge into an organic boundary
          const noise =
            Math.sin(px * 0.08 + py * 0.11) *
            Math.sin(px * 0.05 - py * 0.07) *
            30;
          const noisyDist = Math.max(0, minDist + noise);
          const idx = row * cols + col;
          if (noisyDist <= 0) {
            textDimMap[idx] = TEXT_DIM_FLOOR;
          } else if (noisyDist < TEXT_DIM_PAD) {
            const t = noisyDist / TEXT_DIM_PAD;
            // Smoothstep — S-curve that's gentle at both ends
            const eased = t * t * (3 - 2 * t);
            textDimMap[idx] = TEXT_DIM_FLOOR + (1 - TEXT_DIM_FLOOR) * eased;
          } else {
            textDimMap[idx] = 1;
          }
        }
      }
    }

    const onPointerMove = (e: PointerEvent) => {
      const now = performance.now();
      const dx = e.clientX - mouseX;
      const dy = e.clientY - mouseY;
      const dt = now - lastMoveTime;
      if (dt > 0 && mouseX > -9000) {
        const dist = Math.sqrt(dx * dx + dy * dy);
        cursorSpeed = (dist / dt) * 1000; // px/s
      }
      mouseX = e.clientX;
      mouseY = e.clientY;
      lastMoveTime = now;
      cursorIdle = false;

      // Lerp spotlight radius toward speed-based target
      const speedFactor = Math.min(1, cursorSpeed / 800);
      const targetRadius =
        MOUSE_RADIUS_MIN + (MOUSE_RADIUS_MAX - MOUSE_RADIUS_MIN) * speedFactor;
      mouseRadius += (targetRadius - mouseRadius) * MOUSE_RADIUS_LERP;

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
      if (hovering && !cursorIdle && cursorSpeed > MIN_SPEED)
        brightenNearMouse();
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
