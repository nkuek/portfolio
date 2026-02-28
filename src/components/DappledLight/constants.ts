/* ── Tree generation ── */
export const LSYSTEM_RADIUS_START = 0.6;
export const LSYSTEM_RADIUS_DECAY = 0.75;
export const LSYSTEM_SEED = 42;

/* ── Leaf ── */
export const LEAF_SIZE = 2.5;
export const LEAF_SUBDIVISIONS = 8;
export const LEAVES_PER_TIP = 3;

/* ── Shadow — PCSS via drei SoftShadows ── */
export const SHADOW_MAP_SIZE = 8192;
export const SHADOW_MAP_SIZE_MOBILE = 4096;
export const PCSS_SAMPLES = 15;
export const PCSS_SAMPLES_MOBILE = 15;
export const PCSS_SIZE = 50;
export const PCSS_SIZE_MOBILE = 35;
export const PCSS_FOCUS = 0;

/* ── Light — angled for natural shadow direction ── */
export const LIGHT_POSITION = [-15, 28, 23] as const;
export const LIGHT_POSITION_DARK = [-15, 25, 23] as const;
export const LIGHT_INTENSITY = 5;
export const LIGHT_INTENSITY_DARK = 60;
export const LIGHT_SHADOW_CAMERA = {
  left: -22,
  right: 22,
  top: 22,
  bottom: -22,
  near: 1,
  far: 60,
};
export const SHADOW_BIAS = -0.001;
export const AMBIENT_INTENSITY = 0.6;

/* ── Camera ── */
export const CAMERA_POSITION = [0, 40, 0] as const;
export const CAMERA_FOV = 26;
export const CAMERA_NEAR = 1;
export const CAMERA_FAR = 80;

/* ── Ground ── */
export const GROUND_SIZE = 60;
export const GROUND_POSITION_Y = 0;

/* ── Tree — origin off-screen right, branches extend left across viewport ── */
export const TREE_POSITION = [32, 5.5, 6] as const;
export const TREE_SCALE = 1;

/* ── Light colors (directional) ── */
export const DIR_LIGHT_COLOR_LIGHT = "#FFE5C7";
export const DIR_LIGHT_COLOR_DARK = "#f0a060";
export const AMBIENT_COLOR_LIGHT = "#9DACB1";
export const AMBIENT_COLOR_DARK = "#4a2840";

/* ── Ground colors ── */
export const GROUND_COLOR_LIGHT = "#ffffff";
export const GROUND_COLOR_DARK = "#3a2828";

/* ── Clearing — thin the canopy where text lives (elliptical) ── */
export const CLEARING_RADIUS_X = 12;
export const CLEARING_RADIUS_Z = 7;
export const CLEARING_STRENGTH = 0.08;

/* ── Leaf silhouettes ── */
export const LEAF_COLOR_LIGHT = "#8faf8f";
export const LEAF_COLOR_DARK = "#3d5240";
export const LEAF_STRETCH_X_DARK = 1.12;
export const LEAF_STRETCH_Z_DARK = 1.04;

/* ── Wind animation ── */
export const WIND_SPEED = 40;
export const WIND_AMPLITUDE = 1;

/* ── FPS throttle ── */
export const TARGET_FPS = 24;
export const FRAME_INTERVAL = 1000 / TARGET_FPS;

/* ── Color transition ── */
export const COLOR_LERP_SPEED_TO_DARK = 0.15;
export const COLOR_LERP_SPEED_TO_LIGHT = 0.1;
