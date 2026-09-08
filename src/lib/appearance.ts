export type ThemeId =
  | "company"
  | "company-navy"
  | "dark"
  | "orchid"
  | "lilac"
  | "forest";

export type FontId = "clean" | "classic" | "fancy";

export type Theme = {
  id: ThemeId;
  name: string;
  note: string;
  swatches: string[];
  typeColors: Record<string, string>;
};

export type FontOption = {
  id: FontId;
  name: string;
  note: string;
  previewFamily: string;
};

export const THEMES: Theme[] = [
  {
    id: "company",
    name: "Company",
    note: "Henry Schein blue and red",
    swatches: ["#0071BB", "#EC1C23", "#0d2b4a", "#f4f7fb"],
    typeColors: {
      scheduled: "#0071BB",
      sick: "#EC1C23",
      unscheduled: "#0d2b4a",
      bereavement: "#6b5b95",
    },
  },
  {
    id: "company-navy",
    name: "Company navy",
    note: "Darker office look",
    swatches: ["#003366", "#0071BB", "#EC1C23", "#eef3f8"],
    typeColors: {
      scheduled: "#005a9c",
      sick: "#d21f26",
      unscheduled: "#003366",
      bereavement: "#5c4f8a",
    },
  },
  {
    id: "dark",
    name: "Dark",
    note: "Night mode",
    swatches: ["#1c212b", "#6cb6ea", "#f07178", "#12151c"],
    typeColors: {
      scheduled: "#6cb6ea",
      sick: "#f07178",
      unscheduled: "#c5d0dc",
      bereavement: "#b39ddb",
    },
  },
  {
    id: "orchid",
    name: "Orchid",
    note: "Pink and purple",
    swatches: ["#b44d9b", "#7b4db3", "#e07a9b", "#f8f1f8"],
    typeColors: {
      scheduled: "#b44d9b",
      sick: "#d45c7a",
      unscheduled: "#6b3d9b",
      bereavement: "#8a6bbf",
    },
  },
  {
    id: "lilac",
    name: "Lilac",
    note: "Purple",
    swatches: ["#7b4db3", "#c4a3e0", "#4a2d7a", "#f6f2fb"],
    typeColors: {
      scheduled: "#7b4db3",
      sick: "#c45c8a",
      unscheduled: "#4a2d7a",
      bereavement: "#8a6bbf",
    },
  },
  {
    id: "forest",
    name: "Forest",
    note: "Original green",
    swatches: ["#2f6f5e", "#c47b2b", "#4a6fa5", "#f3eee4"],
    typeColors: {
      scheduled: "#2f6f5e",
      sick: "#c47b2b",
      unscheduled: "#4a6fa5",
      bereavement: "#7a5c8a",
    },
  },
];

export const FONTS: FontOption[] = [
  {
    id: "clean",
    name: "Clean",
    note: "Simple and clear",
    previewFamily: '"Source Sans 3", "Segoe UI", sans-serif',
  },
  {
    id: "classic",
    name: "Classic",
    note: "A little more formal",
    previewFamily: 'Lora, Georgia, serif',
  },
  {
    id: "fancy",
    name: "Fancy",
    note: "The original display font",
    previewFamily: "Fraunces, Georgia, serif",
  },
];

export function getTheme(id: string): Theme {
  const requested = id === "blush" ? "dark" : id;
  return THEMES.find((theme) => theme.id === requested) ?? THEMES[0];
}

export function getFont(id: string): FontOption {
  return FONTS.find((font) => font.id === id) ?? FONTS[0];
}

export function applyAppearance(themeId: string, fontId: string) {
  const root = document.documentElement;
  root.dataset.theme = getTheme(themeId).id;
  root.dataset.font = getFont(fontId).id;
}
