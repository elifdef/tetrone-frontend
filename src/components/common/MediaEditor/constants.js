export const OBJECT_PROPS = ["isBackground", "editorType", "editorFilterType", "editorFilterAmount"];

export const COLORS = [
  "#ffffff", "#000000", "#ff3347", "#ff9900",
  "#5B9BD5", "#00cc66", "#9c27b0", "#00bcd4", "#ffeb3b",
];

export const FONT_FAMILIES = [
  "Tahoma", "Arial", "Arial Black", "Verdana",
  "Georgia", "Times New Roman", "Courier New", "Impact",
];

export const FILTERS = [
  { key: "none", translation: "filter_none", min: 0, max: 1, step: 0.01, defaultValue: 0 },
  { key: "grayscale", translation: "filter_grayscale", min: 0, max: 1, step: 0.01, defaultValue: 1 },
  { key: "invert", translation: "filter_invert", min: 0, max: 1, step: 0.01, defaultValue: 1 },
  { key: "brightness", translation: "filter_brightness", min: -1, max: 1, step: 0.01, defaultValue: 0.15 },
  { key: "contrast", translation: "filter_contrast", min: -1, max: 1, step: 0.01, defaultValue: 0.15 },
  { key: "saturation", translation: "filter_saturation", min: -1, max: 1, step: 0.01, defaultValue: 0.2 },
  { key: "blur", translation: "filter_blur", min: 0, max: 1, step: 0.01, defaultValue: 0.2 },
  { key: "noise", translation: "filter_noise", min: 0, max: 700, step: 1, defaultValue: 100 },
  { key: "sharpen", translation: "filter_sharpen", min: 0, max: 1, step: 0.01, defaultValue: 1 },
];

export const CROP_RATIOS = {
  free: null, square: 1, landscape: 16 / 9, classic: 4 / 3, portrait: 9 / 16,
};