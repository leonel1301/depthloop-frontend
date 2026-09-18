---
name: DepthLoop
description: Dense corporate ops desk for confirming a company's data map.
colors:
  corporate-blue: "#111111"
  corporate-blue-hover: "#000000"
  corporate-blue-soft: "#f0f0ee"
  accent-on: "#ffffff"
  slate-ink: "#111111"
  slate-secondary: "#3a3a38"
  slate-muted: "#6b6b66"
  paper-canvas: "#ffffff"
  paper-elevated: "#ffffff"
  paper-muted: "#ecece8"
  paper-hover: "#f7f7f5"
  line: "#e2e2dc"
  line-strong: "#cfcfc8"
  amber-caution: "#6f5b32"
  rose-danger: "#e11d48"
  teal-success: "#0f766e"
typography:
  display:
    fontFamily: "Geist, ui-sans-serif, -apple-system, BlinkMacSystemFont, \"Segoe UI\", sans-serif"
    fontSize: "26px"
    fontWeight: 700
    lineHeight: 1.2
    letterSpacing: "-0.4px"
  headline:
    fontFamily: "Geist, ui-sans-serif, -apple-system, BlinkMacSystemFont, \"Segoe UI\", sans-serif"
    fontSize: "22px"
    fontWeight: 600
    lineHeight: 1.2
    letterSpacing: "-0.3px"
  title:
    fontFamily: "Geist, ui-sans-serif, -apple-system, BlinkMacSystemFont, \"Segoe UI\", sans-serif"
    fontSize: "16px"
    fontWeight: 650
    lineHeight: 1.2
    letterSpacing: "-0.2px"
  body:
    fontFamily: "Geist, ui-sans-serif, -apple-system, BlinkMacSystemFont, \"Segoe UI\", sans-serif"
    fontSize: "13px"
    fontWeight: 400
    lineHeight: 1.45
    letterSpacing: "normal"
  label:
    fontFamily: "Geist, ui-sans-serif, -apple-system, BlinkMacSystemFont, \"Segoe UI\", sans-serif"
    fontSize: "11px"
    fontWeight: 650
    lineHeight: 1.3
    letterSpacing: "normal"
rounded:
  sm: "6px"
  md: "7px"
  lg: "8px"
  xl: "10px"
  pill: "999px"
spacing:
  xs: "4px"
  sm: "6px"
  md: "8px"
  lg: "12px"
  xl: "16px"
components:
  button-primary:
    backgroundColor: "{colors.corporate-blue}"
    textColor: "{colors.accent-on}"
    rounded: "{rounded.md}"
    padding: "0 16px"
    height: "34px"
  button-primary-hover:
    backgroundColor: "{colors.corporate-blue-hover}"
    textColor: "{colors.accent-on}"
    rounded: "{rounded.md}"
    padding: "0 16px"
    height: "34px"
  button-secondary:
    backgroundColor: "{colors.paper-elevated}"
    textColor: "{colors.slate-secondary}"
    rounded: "{rounded.md}"
    padding: "0 14px"
    height: "34px"
  button-ghost:
    backgroundColor: "{colors.paper-elevated}"
    textColor: "{colors.slate-secondary}"
    rounded: "{rounded.md}"
    padding: "0 12px"
    height: "32px"
  button-icon-tool:
    backgroundColor: "{colors.paper-elevated}"
    textColor: "{colors.slate-muted}"
    rounded: "{rounded.md}"
    padding: "0"
    size: "32px"
    height: "32px"
    width: "32px"
  chip-source:
    backgroundColor: "{colors.paper-muted}"
    textColor: "{colors.slate-secondary}"
    rounded: "{rounded.pill}"
    padding: "0 10px"
    height: "28px"
  chip-stat:
    backgroundColor: "{colors.paper-muted}"
    textColor: "{colors.slate-muted}"
    rounded: "{rounded.pill}"
    padding: "0 8px"
    height: "26px"
  chip-stat-warning:
    backgroundColor: "rgba(180, 83, 9, 0.1)"
    textColor: "{colors.amber-caution}"
    rounded: "{rounded.pill}"
    padding: "0 8px"
    height: "26px"
  card-panel:
    backgroundColor: "{colors.paper-elevated}"
    textColor: "{colors.slate-ink}"
    rounded: "{rounded.lg}"
    padding: "0"
  input-field:
    backgroundColor: "{colors.paper-canvas}"
    textColor: "{colors.slate-ink}"
    rounded: "{rounded.md}"
    padding: "0 10px"
    height: "36px"
  nav-stepper:
    backgroundColor: "{colors.paper-muted}"
    textColor: "{colors.slate-muted}"
    rounded: "{rounded.pill}"
    padding: "4px 10px 4px 6px"
---

# Design System: DepthLoop

## Overview

**Creative North Star: "The Confirmed Ledger"**

DepthLoop's shipped Map is a dense corporate operations desk: sticky product chrome and a left navigation rail for Estructura and Revisión. The atmosphere is quiet, light, and exacting. Surfaces sit on warm paper with hairline borders. Ink black is the only action color. A single bronze is reserved for confidence numerals. Dark is graphite, not navy.

The system is Geist at 13px, not a marketing site. Density is the point: a 56px sticky header, 64px panel heads, 26px stat chips, compact pills. Light on cool paper is the canonical theme. Dark is a paired night desk on the same geometry and type ramp, not a second identity.

The wordmark is DepthLoop at 16px / 750 beside the 30×30 `/depthloop-icon-v2.png` mark, clipped to 8px. New surfaces inherit this ledger, not a looser marketing layout.

**Key Characteristics:**
- Cool slate paper with a single corporate-blue accent
- Geist at 13px with a tight 26 / 22 / 16 / 13 / 11 ramp
- Hairline borders and a 1px rest shadow; large shadows only on overlays
- 7px controls, 8px panels, fully rounded pills
- Dual light/dark themes sharing one geometry

## Colors

Cool slate neutrals carry the desk. One corporate blue does all action. Amber, rose, and teal are status only.

### Primary
- **Corporate Blue** (`{colors.corporate-blue}`): Primary buttons, current stepper index, selected rows and concept items, text links, focus rings, and the progress bar. Hover deepens to Corporate Blue Hover (`{colors.corporate-blue-hover}`). Selection and done-step fills use Corporate Blue Wash (`{colors.corporate-blue-soft}`). Label on the solid fill is Accent On White (`{colors.accent-on}`).

### Neutral
- **Slate Ink** (`{colors.slate-ink}`): Primary text and wordmark.
- **Slate Secondary** (`{colors.slate-secondary}`): Table cells, secondary button labels, supporting body.
- **Slate Muted** (`{colors.slate-muted}`): Meta copy, table headers, idle icon tools, chip labels.
- **Cool Paper Canvas** (`{colors.paper-canvas}`): Page background and inset field fills.
- **Elevated White** (`{colors.paper-elevated}`): Panels, header glass, buttons at rest.
- **Muted Paper** (`{colors.paper-muted}`): Table header row, chip fills, stepper track, concept list gutter.
- **Hover Paper** (`{colors.paper-hover}`): Row and concept-item hover.
- **Hairline Slate** (`{colors.line}`): Default borders and dividers.
- **Strong Hairline** (`{colors.line-strong}`): Control borders, stepper connectors.

### Status (not accents)
- **Amber Caution** (`{colors.amber-caution}`): Pending counts, medium confidence, warning chips. Sits on a 10% amber wash.
- **Rose Danger** (`{colors.rose-danger}`): Low confidence, reject, form errors. Sits on an 8% rose wash.
- **Teal Success** (`{colors.teal-success}`): High confidence and confirmed labels. Never used as the product accent.

Dark mode remaps the same roles onto a navy desk (`#0b1220` canvas, `#121a2b` elevated, `#e8eef8` ink) with a lighter blue (`#3b82f6`), brighter amber (`#fbbf24`), rose (`#fb7185`), and teal (`#2dd4bf`). Do not invent a third palette.

**The One Accent Rule.** Corporate blue is the only action color. Teal, amber, and rose are status, never chrome.

**The Wash Rule.** Selection, confidence, pending, and danger sit on translucent washes, not solid blocks.

## Typography

**Display Font:** Geist (with ui-sans-serif, system UI, Segoe UI)
**Body Font:** Geist (same stack)
**Label/Mono Font:** Geist for UI labels; `ui-monospace, SFMono-Regular, Menlo, monospace` at 11px for source field names only

**Character:** A single neo-grotesque at desk size. Tight tracking on titles. No second family, no display serif.

### Hierarchy
- **Display** (700, 26px, −0.4px): The selected concept name in the explorer detail pane only.
- **Headline** (600, 22px, −0.3px): Overlay drawer titles. Dialog titles sit a step down at 20px.
- **Title** (650, 16px, −0.2px): Page titles and the DepthLoop wordmark (wordmark weight 750).
- **Body** (400, 13px, 1.45): App default. Panel titles share 13px at 650. Concept story copy may open to 14px.
- **Label** (650, 11px): Table headers, panel subcopy, form labels, chips, confidence pills. Controls and source pills use 12px / 600–650 between body and label.

### Named Rules
**The Thirteen Rule.** Body copy, chrome, and forms are 13px Geist. 16px is page title and wordmark; 26px is the selected concept name only.

## Layout

The shell is full-viewport cool paper. Chrome is a sticky 56px header on a three-column grid (brand | stepper | actions) with 16px inset. Below it, a page toolbar (10px / 16px) then a two-column workspace: structure on the left, review on the right, 10px gutter, 12px page inset, `minmax(390px, 0.95fr)` for the review column. Panels share a 64px heading row. Collapsed panels become 44px rails.

Rhythm is 4 / 6 / 8 / 12 / 16. At 1100px the workspace and concept explorer stack; idle stepper labels hide but the current step keeps its name; chrome wraps (brand + actions, then stepper); panel heads stay at least 64px and wrap. At 720px chrome inset tightens to 10px, source pills leave the header, and icon tools grow to 40px.

**The Two-Panel Desk Rule.** The working canvas is a two-column grid (structure | review) with 10px gutters, a sticky 56px header, and 64px panel heads. Below 1100px the columns stack.

## Elevation & Depth

Depth is tonal and hairline first. Resting panels use Elevated White on Cool Paper Canvas, a 1px Hairline Slate border, and a whisper rest shadow. The header is frosted (`rgba(255,255,255,0.92)` plus 12px blur). Selection is a blue wash, not a lift. Large shadows are reserved for overlays.

### Shadow Vocabulary
- **Rest** (`box-shadow: 0 1px 2px rgba(15, 23, 42, 0.05)`): Panels, explorer, segmented selected tab. Dark rest is `0 1px 2px rgba(0, 0, 0, 0.28)`.
- **Dialog** (`box-shadow: 0 16px 40px rgba(15, 23, 42, 0.18)`): Centered dialog cards.
- **Drawer** (`box-shadow: -18px 0 48px rgba(15, 23, 42, 0.22)`): Source drawer sliding from the right.
- **Focus ring** (`box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.18)`): Focused fields and selected engine cards. Dark ring is `rgba(59, 130, 246, 0.28)`.

### Named Rules
**The Hairline Rest Rule.** Resting surfaces use a 1px line plus the 1px rest shadow. Large shadows are overlay-only.

## Shapes

Controls are softly squared at 7px. Nested chips and table fields tuck to 6px. Workspace panels, the brand mark, and concept rows are 8px. Dialogs, field cards, and relation cards open to 10px. Pills, pending chips, the stepper track, and confidence badges are fully rounded (999px). Step indices and the avatar are circles.

Borders are 1px Hairline Slate, strengthening to Strong Hairline on interactive controls. Selected engine cards and focused fields add the 3px blue ring. No hard offset / neobrutal shadows on rest surfaces.

**The Seven-and-Pill Rule.** Controls are 7px. Workspace panels are 8px. Status, sources, and the stepper live at 999px.

## Components

Quiet, compact, and table-native. Hover is a border or wash shift, not a leap.

### Buttons
- **Shape:** Gently squared (7px). Height 34px for primary/secondary; 32px for ghost; 32×32 icon tools (26×26 inside panel heads).
- **Primary:** Corporate Blue fill, Accent On White label, 12px / 650. Hover uses Corporate Blue Hover. Disabled at 0.7 opacity.
- **Secondary:** Elevated White, Strong Hairline border, Slate Secondary label. Hover fills Muted Paper.
- **Ghost:** Same border language, 32px tall. Hover tints the border Corporate Blue.
- **Icon tool:** 32×32, 7px, Elevated White, Hairline border, muted glyph. Hover ink + Strong Hairline.
- **Row action:** 26px, 6px radius, 11px type. Confirm uses blue wash; hover on others tints the border blue.
- **Hover / Focus:** Color and border only. Focus-visible uses the 3px Corporate Blue ring.

### Chips
- **Source pills:** 28px tall, fully rounded, Muted Paper, Hairline border, 12px / 600 Slate Secondary.
- **Stat chips:** 26px tall, 11px / 650. Warning/pending use Amber Caution on a 10% wash.
- **Confidence pills:** Fully rounded, 11px / 700. High = teal wash, medium = amber wash, low = rose wash.
- **Meta chips:** Fully rounded, Muted Paper, optional 6px gap for a small mark.

### Cards / Containers
- **Corner Style:** 8px workspace panels; 10px field/relation cards and dialogs.
- **Background:** Elevated White panels; Cool Paper Canvas for inset lists and field cards.
- **Shadow Strategy:** Rest shadow on panels; overlay shadows on drawer/dialog only.
- **Border:** 1px Hairline Slate.
- **Internal Padding:** Panel heads 0 14px, min-height 64px (wrap on stacked layouts); concept detail 20px / 22px; field cards 12px / 14px.
- **Concept item:** 8px row, transparent until hover (Hover Paper) or active (blue wash + mixed blue border). 28px icon well at 7px in Corporate Blue on Muted Paper.

### Inputs / Fields
- **Style:** Cool Paper Canvas fill, Strong Hairline, 7px, 36px tall (28px inside tables), 13px type. Form labels 11px / 600 Slate Muted.
- **Focus:** Border Corporate Blue plus 3px accent ring.
- **Engine cards:** 9px, 10px padding, min-height 86px. Selected: Corporate Blue border, blue wash, 3px ring.
- **Segmented / filter tabs:** Muted Paper track; selected segment Elevated White (segmented adds rest shadow).

### Navigation
- **Header:** Sticky, frosted Elevated White, Hairline bottom. Brand mark 30×30 at 8px; wordmark 16px / 750, −0.45px.
- **Stepper:** Fully rounded Muted Paper track. 20px circle indices; current is Corporate Blue fill; done is blue wash. Labels 12px / 600. Below 1100px idle labels hide; the current step keeps its name.
- **Avatar:** 28px circle, blue wash, 10px / 700 Corporate Blue.

### Review table (signature)
Sticky Muted Paper headers at 11px / 650. Cells 12px, 7px / 10px padding, Slate Secondary. Hover Hover Paper; active group blue wash; resolved rows at 0.7 opacity. A 3px Corporate Blue progress bar sits under the toolbar. Compact filter tabs (7px track, 5px selected). Save bar is a two-up primary/secondary pair.

## Do's and Don'ts

### Do:
- **Do** use Corporate Blue for primary actions, the current step, selected rows, and the 3px focus ring.
- **Do** keep light tokens as the canonical values and restyle through the existing dark variables.
- **Do** set body at 13px Geist; page titles and the wordmark at 16px; concept names at 26px.
- **Do** use 7px radius on buttons, icon tools, and fields; 8px on workspace panels; 999px on pills and the stepper.
- **Do** mark selection with Corporate Blue Wash, not a heavy fill or a rest-surface drop shadow.
- **Do** keep the wordmark DepthLoop at 16px / 750 beside `/depthloop-icon-v2.png` at 30×30, 8px.

### Don't:
- **Don't** use green (or any second hue) as the action accent. Corporate blue is the only accent; teal is confirmation status.
- **Don't** introduce a second typeface or a display serif. Geist is the single UI voice.
- **Don't** rest-elevate panels with large drop shadows; only drawers and dialogs lift.
- **Don't** square off source pills, confidence badges, or the stepper track.
- **Don't** treat placeholder next-step cards as the layout system for new screens.
- **Don't** put an uppercase eyebrow or kicker above a heading. The heading carries its own weight.
