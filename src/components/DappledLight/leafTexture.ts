import * as THREE from "three";

/**
 * Procedural leaf alpha texture drawn with Canvas2D.
 * Creates an ovate leaf silhouette with midrib and secondary veins.
 * Used as alphaMap so leaf shadows show realistic leaf shapes.
 */
export function createLeafTexture(size = 256): THREE.CanvasTexture {
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d")!;

  const cx = size / 2;
  const cy = size / 2;
  const leafWidth = size * 0.42;
  const leafHeight = size * 0.9;

  // Draw leaf silhouette — ovate with pointed tip and rounded base
  ctx.fillStyle = "white";
  ctx.beginPath();

  const tipY = cy - leafHeight / 2;
  const baseY = cy + leafHeight / 2;
  const midY = cy - leafHeight * 0.05; // widest point slightly above center

  // Right side curve
  ctx.moveTo(cx, tipY);
  ctx.bezierCurveTo(
    cx + leafWidth * 0.15,
    tipY + leafHeight * 0.1,
    cx + leafWidth,
    midY - leafHeight * 0.15,
    cx + leafWidth * 0.95,
    midY,
  );
  ctx.bezierCurveTo(
    cx + leafWidth * 0.9,
    midY + leafHeight * 0.2,
    cx + leafWidth * 0.4,
    baseY - leafHeight * 0.08,
    cx,
    baseY,
  );

  // Left side curve (mirror)
  ctx.bezierCurveTo(
    cx - leafWidth * 0.4,
    baseY - leafHeight * 0.08,
    cx - leafWidth * 0.9,
    midY + leafHeight * 0.2,
    cx - leafWidth * 0.95,
    midY,
  );
  ctx.bezierCurveTo(
    cx - leafWidth,
    midY - leafHeight * 0.15,
    cx - leafWidth * 0.15,
    tipY + leafHeight * 0.1,
    cx,
    tipY,
  );
  ctx.closePath();
  ctx.fill();

  // Draw veins as slightly transparent (creates detail in shadow)
  ctx.globalCompositeOperation = "destination-out";
  ctx.strokeStyle = "rgba(255, 255, 255, 0.3)";
  ctx.lineWidth = size * 0.008;
  ctx.lineCap = "round";

  // Midrib (central vein)
  ctx.globalCompositeOperation = "source-over";
  ctx.strokeStyle = "rgba(255, 255, 255, 0.9)";
  ctx.lineWidth = size * 0.012;
  ctx.beginPath();
  ctx.moveTo(cx, tipY + leafHeight * 0.05);
  ctx.lineTo(cx, baseY - leafHeight * 0.05);
  ctx.stroke();

  // Secondary veins branching from midrib
  ctx.lineWidth = size * 0.006;
  ctx.strokeStyle = "rgba(255, 255, 255, 0.6)";
  const veinPairs = 6;
  for (let i = 0; i < veinPairs; i++) {
    const t = 0.15 + (i / veinPairs) * 0.7;
    const y = tipY + t * leafHeight;
    const spreadX = leafWidth * (0.5 + 0.4 * Math.sin(t * Math.PI));
    const curveY = y + leafHeight * 0.06;

    // Right vein
    ctx.beginPath();
    ctx.moveTo(cx, y);
    ctx.quadraticCurveTo(cx + spreadX * 0.6, y - leafHeight * 0.02, cx + spreadX * 0.8, curveY);
    ctx.stroke();

    // Left vein
    ctx.beginPath();
    ctx.moveTo(cx, y);
    ctx.quadraticCurveTo(cx - spreadX * 0.6, y - leafHeight * 0.02, cx - spreadX * 0.8, curveY);
    ctx.stroke();
  }

  // Slight edge serration — small bumps cut from the edge
  ctx.globalCompositeOperation = "destination-out";
  ctx.fillStyle = "white";
  const serrations = 24;
  for (let i = 0; i < serrations; i++) {
    const angle = (i / serrations) * Math.PI * 2;
    const r = Math.max(leafWidth, leafHeight / 2) * 1.02;
    const x = cx + Math.cos(angle) * r;
    const y = cy + Math.sin(angle) * r * (leafHeight / leafWidth / 2);
    const bumpSize = size * 0.015 + Math.random() * size * 0.01;
    ctx.beginPath();
    ctx.arc(x, y, bumpSize, 0, Math.PI * 2);
    ctx.fill();
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.needsUpdate = true;
  return texture;
}
