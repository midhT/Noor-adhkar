# Noor V5 — Audit, Migration Matrix, Plan

Source read in full: V3 (`www/*.js|html|css`, Capacitor config, workflow) and V4 (all `lib/`, `android/`, workflow, pubspec).
Not supplied: the "master specification" and "design references" files. Design follows V3's navy/gold CSS tokens and the V3 `icon.png` / `splash.png` artwork.

## 1. V3 feature inventory (what actually exists)

| # | Feature | Detail in V3 |
|---|---|---|
| 1 | Tasbeeh counter | 5 presets (Astaghfirullah 100, SubhanAllah 33, Alhamdulillah 33, Allahu Akbar 34, La hawla 100) + custom name; live count; target (1–10000, ± and input); progress bar; reset (confirm); "Complete session" saves a session record |
| 2 | Haptics | Toggle; native Capacitor impact, `navigator.vibrate` fallback |
| 3 | Dhikr library | Searchable list (name, meaning, category); tap selects and opens counter |
| 4 | Daily routines | Morning / evening cards, tap toggles done; both done = daily goal |
| 5 | Streaks | Current + best streak from goal days; milestone 3/7/10/30/50/100 |
| 6 | Home stats | Counts today, sessions today, current/best streak, quick-counter card |
| 7 | Progress | Total counts, sessions, achievements, 7-day bar chart |
| 8 | Data | JSON export, clear all data (confirm) |
| 9 | Salah learning guide | 12 Hanafi-oriented steps (Arabic, transliteration, meaning, source note), search, disclaimers |
| 10 | Focus Studio | 5/10/20/30 min, 4 intentions, start/pause/reset, completes with toast |
| 11 | Atmosphere | Celestial orbit animation toggle; reduced-motion respected |
| 12 | Optional audio | User-picked file, loop, toggle, stop; lost on restart (documented) |
| 13 | Theme | Dark default + light toggle |
| 14 | Intro | Animated crescent/wordmark reveal; native splash + icon from `assets/` |
| 15 | System | Status bar styling, offline service worker, local storage only |
| 16 | Explicitly absent in V3 | Prayer times, reminders, Qur'an reader, widgets, cloud sync |

## 2. V4 implementation audit

V4 is a 1,150-line foundation. It added prayer times, notifications and widgets, and dropped most of V3.

**Defects found (verified by reading the code):**

1. `SalahScreen` calls `PrayerService.calculate()`, which **ignores the saved method and madhab** (hard-coded Karachi/Hanafi). Changing Settings does nothing to displayed times.
2. `HomeScreen._load` sends the widget `nextTime` **before computing it**, so the Salah widget always gets `--:--`.
3. "Next prayer" treats **Sunrise as a prayer**, and after Isha wraps to *today's* Fajr (already past). No countdown exists anywhere.
4. Reminders are scheduled **once, only when the settings tile is tapped**. No reschedule on app start, location, method, madhab or Jamaat change; no disable; 7-day horizon; inexact alarms (can slip minutes). `SCHEDULE_EXACT_ALARM` is declared but never requested or used.
5. `ic_launcher` exists only in `mipmap-anydpi-v26`. With `minSdk 23` the icon resource is **missing on API 23–25**. The notification small icon reuses the launcher mipmap (renders as a white square).
6. Widget receivers are `exported="false"`; widgets have no tap action; the Tasbeeh widget is updated on every tap (and shows live count).
7. Home "VIEW PRAYER TIMES" opens a **placeholder** page; "DAILY VERSE" card is inert; date shown as raw ISO string.
8. **No `test/` directory** → the V4 workflow's `flutter test` step fails ("Test directory not found"), so CI could never reach the APK step.
9. Theme is black/white, no light mode, no theme toggle. No splash. Duas hidden under Settings. `permission_handler` and `cupertino_icons` are unused.
10. The `flutter_local_notifications` boot/schedule receivers are **not declared in the app manifest**, which the plugin's setup requires; scheduled alerts therefore cannot be relied on to fire or survive a reboot.
11. Madhab/method dropdowns offer 4 methods though the service supports more; no high-latitude rule or per-prayer adjustment; Salah screen shows no current prayer and no sunrise/qiyam distinction.
12. Gradle wrapper not committed (generated in CI — acceptable); no `.gitignore`, no `analysis_options.yaml`.

Whether V4 ever compiled could not be established from the archive.

## 3. Migration matrix

Legend: ✅ implemented · 🟡 incomplete · ❌ missing · 🔴 broken

| Area | V3 | V4 | V5 action |
|---|---|---|---|
| Dhikr counter | ✅ | 🟡 single counter, no target/session | Rebuild as session flow; count hidden until session ends |
| Preset adhkar | ✅ 5 | ❌ | 9 presets + post-prayer sequence |
| Custom dhikr | 🟡 name only | 🟡 text only | Name, Arabic, meaning, target; saved list, edit/delete |
| Dhikr library + search | ✅ | ❌ | Library sheet with search + categories |
| Haptics toggle | ✅ | ❌ | Native `HapticFeedback`, setting persisted |
| Routines + streaks | ✅ | ❌ | Port, with clean pure-Dart streak function + tests |
| Session history | 🟡 stored, never listed | ❌ | Persisted + listed, with notes |
| Progress/achievements/chart | ✅ | ❌ | Journey tab |
| Export / clear data | ✅ file download | ❌ | Copy JSON backup to clipboard + import (accepts V3 export JSON too, so V3 history can migrate); clear with confirm. Chosen over a file-save plugin to avoid an unverifiable native dependency |
| Salah learning guide | ✅ | 🟡 3 duas only | Port all 12 steps + V4 duas under Salah → Learn |
| Prayer times | ❌ | 🔴 settings ignored | Calculation honouring method + madhab |
| Live countdown | ❌ | ❌ | 1 s ticker from wall clock; correct after Isha |
| Reminders | ❌ | 🔴 one-shot | 14-day rolling schedule, auto-reschedule, per-prayer toggles, lead time, exact-alarm handling |
| Jamaat times | ❌ | 🟡 text field | Time picker + reminder |
| Quran tab | ❌ | ✅ (to remove) | Removed from nav; reflections move into dhikr completion |
| Verse of the day | ❌ | ✅ | Kept on dashboard + widget |
| Focus Studio | ✅ | ❌ | Wall-clock timer, session record, completion notification |
| Celestial animation | ✅ | ❌ | CustomPainter stars/orbits, toggle, reduced-motion aware |
| Optional audio | 🟡 not persisted | ❌ | File copied into app storage, persists across restarts |
| Theme toggle | ✅ | ❌ | Dark navy/gold + light |
| Intro / splash | ✅ | ❌ | Native splash + animated Flutter intro |
| Widgets | ❌ | 🔴 | Redesigned; Salah widget countdown works without opening app |
| Launcher icon | ✅ | 🔴 API 23–25 | PNG mipmaps + adaptive icon from V3 artwork |
| Dashboard hierarchy | 🟡 uniform cards | 🟡 | Hero + mixed-size cards |
| CI | ✅ (Capacitor) | 🔴 no tests dir | New workflow: build job independent of test job |

## 4. V5 plan

1. **Core**: palette/theme; `NoorStore` (ChangeNotifier over `shared_preferences`; V4 keys migrated); models; pure-Dart streak, countdown and reminder planner.
2. **Services**: `PrayerService` (settings-aware), `NoorNotifications` (exact when permitted, else inexact; rolling 14-day plan; reschedule on start/resume/settings change), `AudioService`, `NoorWidgets` (writes next-14-day schedule so the native widget needs no app launch).
3. **UI**: splash → shell with 5 tabs (Home, Dhikr, Salah, Focus, Journey); Settings from header gear. Dhikr completion screen with verse reflection and optional note.
4. **Android**: PNG icons, notification icon, splash theme, three redesigned widgets with native countdown (`Chronometer`) and tap-to-open, `minSdk 24`.
5. **Verification**: unit tests (streak, planner, countdown, madhab ordering), static checks available here (XML lint, brace balance), CI build.
6. **Docs**: verification report (honest about what was and wasn't run), limitations, install steps.

**Dependencies added (minimal):** `audioplayers` (focus audio), `file_picker` (user-chosen audio), `path_provider` (copy chosen audio into app storage). Removed unused `permission_handler`. No existing dependency is upgraded.

**Constraint:** this workspace has no network access to Flutter, Android SDK or pub.dev, so nothing can be compiled or run here. The APK is produced by the GitHub Actions workflow. See `docs/03_VERIFICATION_REPORT.md`.
