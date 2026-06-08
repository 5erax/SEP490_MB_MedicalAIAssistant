# Design System Mapping - MediMate AI Web to React Native

Tai lieu nay phan tich UI hien co cua frontend web va de xuat cach tai tao tren React Native de mobile giu nhan dien MediMate AI.

## 1. Mau sac dang su dung

### Core tokens tu Web

| Token Web | Hex/RGBA | Vai tro | React Native token de xuat |
|---|---|---|---|
| `--bg` / `--color-bg` | `#f7f8f3` | Nen app/landing kem nhat | `colors.bg` |
| `--paper` / `--color-surface` | `#ffffff` | Card, panel, form surface | `colors.paper` |
| `--paper-soft` | `#fbfcf7` | Surface phu, input bg, empty state | `colors.paperSoft` |
| `--ink` / `--color-ink` | `#111412` | Text chinh, border dark, dark button | `colors.ink` |
| `--muted` | `rgba(17,20,18,0.68)` | Body secondary text | `colors.muted` |
| `--subtle` | `rgba(17,20,18,0.42)` | Placeholder, meta text | `colors.subtle` |
| `--line` | `#dde4d5` | Border nhe | `colors.line` |
| `--line-strong` | `#b9c5ad` | Border input/table stronger | `colors.lineStrong` |
| `--lime` / `--color-primary` | `#c4e995` | Primary brand accent, CTA, active tab | `colors.lime` |
| `--lime-dark` | `#6a9540` | Eyebrow, accent text | `colors.limeDark` |
| `--mint` / `--color-info-bg` | `#e6f4ee` | Badge bg, active soft bg | `colors.mint` |
| `--teal` / `--color-info` | `#087f8c` | Link, secondary accent, focus | `colors.teal` |
| `--blue` | `#1d4ed8` | Rare link/status accent | `colors.blue` |
| `--amber` | `#d97706` / `#b45309` | Warning/disclaimer | `colors.amber` |
| `--coral` | `#ef6f61` | Alert/chart accent | `colors.coral` |
| `--danger` | `#b42318` | Error text | `colors.danger` |
| `--danger-bg` | `#fff4f2` | Error background | `colors.dangerBg` |
| `--success` | `#15803d` | Success text | `colors.success` |
| `--success-bg` | `#dcfce7` | Success background | `colors.successBg` |
| `--warning-bg` | `#fef3c7` | Warning background | `colors.warningBg` |

### Operator/Admin variants

| Web value | Vai tro | Mobile recommendation |
|---|---|---|
| `#f4f7ef`, `#f6f8f3`, `#edf4e9` | Workspace/admin backgrounds | Use as screen background variants: `colors.workspaceBg`, `colors.operatorBg`. |
| `#101411` | Operator ink | Alias to `colors.inkStrong`. |
| `#0c5f5e`, `#173130` | Admin dark teal gradients/session card | Use for admin-only screens if built. |
| `#cff178`, `#dff8ed`, `#e6f8d9` | Admin active nav/KPI soft colors | Use sparingly for admin mobile-lite. |

### React Native theme object

```ts
export const colors = {
  bg: '#f7f8f3',
  paper: '#ffffff',
  paperSoft: '#fbfcf7',
  ink: '#111412',
  muted: 'rgba(17,20,18,0.68)',
  subtle: 'rgba(17,20,18,0.42)',
  line: '#dde4d5',
  lineStrong: '#b9c5ad',
  lime: '#c4e995',
  limeDark: '#6a9540',
  mint: '#e6f4ee',
  teal: '#087f8c',
  amber: '#d97706',
  coral: '#ef6f61',
  danger: '#b42318',
  dangerBg: '#fff4f2',
  success: '#15803d',
  successBg: '#dcfce7',
  warning: '#b45309',
  warningBg: '#fef3c7',
};
```

## 2. Typography dang su dung

| Web style | Gia tri | Mobile mapping |
|---|---|---|
| Body font | `Be Vietnam Pro`, fallback system sans | Use `expo-font` load Be Vietnam Pro weights 400, 500, 600, 700, 800, 900. |
| Display font in active CSS | Mostly `Be Vietnam Pro` via `--display` | Use same font family for headings to match current app. |
| Older token display | `Lora` in `tokens.js`, but overridden in CSS by Be Vietnam Pro | Do not use Lora unless web reintroduces it visually. |
| H1 landing | clamp 44-76px web | Mobile `fontSize: 34-40`, `lineHeight: 38-44`, `fontWeight: '800'`. |
| Section title | 34-58px web | Mobile `28-34`, lineHeight `32-38`. |
| Card title | 20-30px | Mobile `18-24`, lineHeight `24-30`. |
| Body | 14-18px, line-height 1.6-1.75 | Mobile `14-16`, lineHeight `22-26`. |
| Eyebrow | 11-12px, uppercase, letter spacing 0.08-0.12em, weight 800/900 | Mobile `11`, `letterSpacing: 1.1`, `textTransform: 'uppercase'`, weight 800. |
| Button text | 13-16px, weight 800/900/950 | Mobile `14-15`, weight 800/900. |

React Native typography:

```ts
export const typography = {
  h1: { fontFamily: 'BeVietnamPro_800ExtraBold', fontSize: 36, lineHeight: 40, letterSpacing: 0 },
  h2: { fontFamily: 'BeVietnamPro_800ExtraBold', fontSize: 28, lineHeight: 34, letterSpacing: 0 },
  h3: { fontFamily: 'BeVietnamPro_700Bold', fontSize: 22, lineHeight: 28 },
  body: { fontFamily: 'BeVietnamPro_400Regular', fontSize: 15, lineHeight: 24 },
  bodyStrong: { fontFamily: 'BeVietnamPro_700Bold', fontSize: 15, lineHeight: 24 },
  caption: { fontFamily: 'BeVietnamPro_700Bold', fontSize: 12, lineHeight: 17 },
  eyebrow: { fontFamily: 'BeVietnamPro_800ExtraBold', fontSize: 11, lineHeight: 15, letterSpacing: 1.1 },
};
```

## 3. Button styles

### Web patterns

| Button | Web CSS | Mobile equivalent |
|---|---|---|
| Primary | lime bg, ink border 1.5px, radius 8-12, hard shadow `3-4px 3-4px 0 ink`, bold text | `Pressable` with `backgroundColor: lime`, `borderWidth: 1.5`, `borderColor: ink`, `borderRadius: 10-12`, shadow/elevation, minHeight 46-50. |
| Dark | ink bg, white text, ink border | Same with `backgroundColor: ink`, no hard shadow unless primary action in dark context. |
| Ghost/Secondary | white or translucent white bg, ink/line border | Same with `backgroundColor: paper`, `borderColor: line` or ink for stronger. |
| Danger | danger bg, white text | Same for destructive actions. |
| Icon button | 36-44 square/circle, border, white bg, icon centered | `Pressable` 40x40, radius 12 or 999, use icon component. |
| Pill/chip | radius 999, small padding, mint/lime/white bg | `Pressable`/`View` with `borderRadius: 999`, horizontal padding 10-14. |

### Required RN components

- `Button` variants: `primary`, `secondary`, `dark`, `danger`, `ghost`.
- `IconButton`.
- `Chip`.
- `SegmentedControl`.
- `FloatingActionButton` for landing/help chat if kept.

Interaction:

- Web hover translate should become RN pressed state: reduce opacity to 0.86 or translateY 1.
- Use `expo-haptics` for primary action, bottom tab, destructive confirm.

## 4. Card styles

### Web patterns

| Card type | Web visual | Mobile recreation |
|---|---|---|
| Brand hard card | `border: 1.5px solid ink`, radius 8-18, white bg, hard shadow `4px 4px 0 ink` | Use `borderWidth: 1.5`, `borderColor: ink`, `borderRadius: 12-18`, `backgroundColor: paper`, Android `elevation`, iOS shadow; optional offset shadow imitation. |
| Soft workspace card | thin translucent border, radius 18-22, white/rgba bg, soft shadow | Use `borderColor: rgba(16,20,17,0.1)`, radius 18-22, paper bg, soft shadow. |
| Dark promo card | ink bg, white text, lime badges/buttons | Use for premium/paywall cards. |
| Empty/loading card | dashed/soft border, paperSoft bg, centered icon/text | Use `EmptyState` and `LoadingState`. |
| Admin KPI card | rounded 16-20, icon orb, metric text | Use only admin-lite. |

Default mobile card:

```ts
card: {
  backgroundColor: colors.paper,
  borderWidth: 1.5,
  borderColor: colors.ink,
  borderRadius: 16,
  padding: 18,
}
```

Workspace card:

```ts
workspaceCard: {
  backgroundColor: 'rgba(255,255,255,0.86)',
  borderWidth: 1,
  borderColor: 'rgba(16,20,17,0.12)',
  borderRadius: 20,
  padding: 16,
}
```

## 5. Form styles

| Web form pattern | Details | React Native mapping |
|---|---|---|
| `clean-field` / `ui-field` | Grid gap 7, label muted 12-13 bold, input minHeight 42-48 | `Field` component with `Text` label and `TextInput`/picker. |
| Inputs | white bg, border line/lineStrong, radius 8-12, padding 12-14 | `TextInput` minHeight 46-50, borderWidth 1-1.5, radius 10-12. |
| Textareas | minHeight 96-190, lineHeight 1.55-1.65 | `TextInput multiline`, minHeight 110, textAlignVertical top. |
| Focus | teal border or ink border + lime/teal focus ring | RN focus state: borderColor teal/ink; optional outer wrapper shadow unavailable as ring, use light bg or borderWidth 2. |
| Error | danger text, dangerBg message, red border | Field error prop changes borderColor danger and shows error text. |
| Form layout | desktop 2-3 columns; mobile 1 column | Always 1 column by default; use grouped sections/cards. |
| Consent checkbox | bordered mint/lime soft bg | Use custom checkbox row with Pressable. |
| Select | native select web | Use ActionSheet/bottom sheet or `Picker` style; show current value in field row. |

Mobile form components:

- `TextField`
- `PasswordField`
- `SelectField`
- `DateField`
- `TextAreaField`
- `CheckboxField`
- `FormSection`
- `ApiMessage`

## 6. Spacing system

### Web spacing tokens

| Token | Px | Mobile usage |
|---|---:|---|
| `space-1` | 4 | icon gap, tiny offsets |
| `space-2` | 8 | chip gap, small vertical rhythm |
| `space-3` | 12 | form/card inner gap |
| `space-4` | 16 | standard screen padding inner |
| `space-5` | 20 | card padding compact |
| `space-6` | 24 | screen/card padding large |
| `space-8` | 32 | section gap |
| `space-10` | 40 | hero/major spacing |

Mobile recommendation:

```ts
export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  '2xl': 24,
  '3xl': 32,
  '4xl': 40,
};
```

Screen padding:

- Standard patient screen: 14-16.
- Auth screen: 20.
- Dense admin/staff screen: 12-16.
- Bottom tab safe area: add 84-96 bottom padding.

## 7. Border radius

| Web token/pattern | Px | Mobile mapping |
|---|---:|---|
| `--radius-sm` | 8 | Small buttons, inputs in compact tables. |
| `--radius` | 8 | Global legacy radius. |
| `--radius-md` | 12 | Default inputs/buttons/cards. |
| `--radius-lg` | 18 | Feature cards, notice, chatbox. |
| Workspace cards | 18-22 | Patient shell cards, modals. |
| Auth cards | 18-24 | Auth card and side panel. |
| Pills | 999 | Chips, badges, profile chip, segmented controls. |
| Map marker | custom rounded pin | Use custom marker view with rotated square/circle if map library supports. |

RN radius constants:

```ts
export const radius = {
  sm: 8,
  md: 12,
  lg: 18,
  xl: 22,
  pill: 999,
};
```

## 8. Icon usage

### Web

- Main icon library: `lucide-react`.
- Workspace nav icons: `LayoutDashboard`, `Activity`, `Bot`, `MapPin`, `UserRound`, `FileText`, `Pill`.
- Admin icons: `Users`, `Stethoscope`, `BrainCircuit`, `Cpu`, `ClipboardList`, `Building2`, etc.
- Some older/mock pages use emoji-like characters; mobile should replace with real icons.

### React Native recommendation

Use `lucide-react-native` if added, or current Expo package `@expo/vector-icons`.

Recommended mappings:

| Feature | Icon |
|---|---|
| Home/Specialty intake | `LayoutDashboard` or `ClipboardPlus` |
| Symptom | `Activity` |
| Chat | `Bot` / `MessageCircle` |
| Map | `MapPin` |
| Profile | `UserRound` |
| Records | `FileText` |
| Medication | `Pill`, `Camera` |
| Pricing/Premium | `Crown` |
| Notifications | `Bell` |
| Search | `Search` |
| Back | `ArrowLeft` |
| Send | `Send` |
| Emergency | `AlertTriangle` |

Rules:

- Icon buttons should be square/circle with tooltip not needed on mobile, but accessible label is required.
- Replace emoji camera/plus/check symbols with vector icons.
- Keep brand mark as plus sign in dark/lime rounded square.

## 9. Layout patterns

### Landing/Public

Web pattern:

- Fixed/blurred nav.
- Large hero with 2-column grid.
- Feature cards, pricing cards, FAQ grid.
- Floating chat button.

Mobile pattern:

- Native stack header or compact top brand bar.
- One-column scroll.
- First viewport: brand, medical disclaimer hint, primary CTA.
- Convert multi-column grids to vertical cards or horizontal chips.
- Floating chat should not block bottom tab; use help button only on public screens.

### Auth

Web pattern:

- Two-column layout: dark side panel + white form card.
- On small screens side panel hidden.

Mobile pattern:

- Use only form card.
- Preserve dark/lime brand mark at top.
- Put side-panel benefits as compact bullet list below header or omit.
- KeyboardAvoidingView + ScrollView.

### Patient Workspace

Web pattern:

- Desktop sidebar, topbar, content panel.
- Mobile bottom nav already exists in CSS.
- Cards softer inside shell.

Mobile pattern:

- Native bottom tabs: Home, Map, Chat, Records, Profile.
- Header title + optional action icons.
- Content cards vertical.
- Premium gate as modal/bottom sheet.

### Triage/Symptom

Web pattern:

- Centered intake card, quick prompts, stepper.
- Result cards and CTAs.

Mobile pattern:

- Home intake card + quick chips.
- Symptom analysis as stack flow.
- Result screen: emergency banner, department cards, doctor questions, CTA buttons.

### Chat

Web pattern:

- Full-height chat screen with header/disclaimer/message area/input.

Mobile pattern:

- Native chat screen with `KeyboardAvoidingView`.
- Disclaimer compact banner under header.
- Input fixed above keyboard.
- Suggestion chips in empty state.

### Map

Web pattern:

- Sidebar list + full map.
- On mobile CSS reverses column with map 55vh/list 45vh.

Mobile pattern:

- Map behind, facility list in bottom sheet.
- Filter/search in sheet header.
- Facility detail as bottom sheet or stack detail.
- Use native location permission and linking.

### Records/Medication

Web pattern:

- Desktop split panels and tables.

Mobile pattern:

- List screen -> detail screen.
- Replace tables with key-value rows.
- File/image picker native.
- Scan flow separate from result.

### Admin/Staff

Web pattern:

- Dense dashboard, side nav, tables, filter toolbars, modals.

Mobile pattern:

- Not suitable for MVP.
- If required, use mobile-lite: KPI cards, searchable vertical lists, filter bottom sheets, modal forms.
- Long AI prompts should remain web-first.

## RN Component Set to Build

| Component | Purpose | Web source pattern |
|---|---|---|
| `Screen` | SafeArea + background + padding | `.landing-page`, `.user-shell-content` |
| `HeaderBar` | Brand/title/actions | `.nav`, `.user-shell-topbar` |
| `Button` | Primary/secondary/dark/danger | `.btn`, `.ui-button` |
| `IconButton` | Square/circle icon actions | `.icon-btn`, `.admin-icon-button` |
| `Card` | Brand hard or soft workspace card | `.feature-card`, `.ui-card`, `.app-card` |
| `Field` | Label/input/error | `.clean-field`, `.ui-field` |
| `Chip` | Prompt/filter chips | `.trust-pill`, `.filter-row button` |
| `Badge` | Status labels | `.ui-badge`, `.soft-badge` |
| `ApiMessage` | Error/success/warning | `.api-message` |
| `EmptyState` | Empty/loading screens | `.ui-empty`, `.records-empty` |
| `BottomSheet` | Map/filter/details | Mobile adaptation of sidebars/modals |
| `BottomTabs` | Patient nav | `.user-shell-mobile-nav` |
| `SegmentedControl` | Tabs/settings/pricing toggle | billing toggle/profile tabs |

## Implementation Notes

- Use `StyleSheet.create` with centralized theme; avoid ad-hoc colors in screens.
- React Native cannot render CSS `backdrop-filter`; approximate with opaque/translucent surfaces and soft shadows.
- Web hard shadow is part of brand. Recreate with iOS `shadowOffset: { width: 4, height: 4 }`, `shadowColor: colors.ink`, `shadowOpacity: 1`, `shadowRadius: 0`; Android use `elevation` plus optional offset wrapper if exact hard shadow is important.
- Do not use viewport-based font scaling. Use fixed token sizes and respect OS accessibility where possible.
- Keep letter spacing non-negative. Eyebrow can use small positive spacing.
- Keep primary visual identity: cream bg + near-black ink + lime CTA + teal secondary + black borders.
- Replace web hover states with pressed states and haptic feedback.
- Preserve medical safety UI: warning/disclaimer banners use amber background and must appear on all AI/medication/records outputs.

