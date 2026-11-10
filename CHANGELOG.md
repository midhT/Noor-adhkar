# V4.0.3 (in progress) — P0 fixes and genuine Adhkar completion

- **Accent colours** now apply in the light theme too (`body.light` was shadowing the accent variables). Covered by tests for all presets and a custom colour, in both themes.
- **Zakat** has its own main-navigation tab (calculator unchanged; Explore card still opens it).
- **Home Qibla** compass starts its sensor at launch so the arrow points at the real Qibla.
- **Adhkar routines are no longer a manual toggle.** Tapping Morning/Evening opens a session with per-item counters. A session completes automatically when every item reaches its prescribed count; completion is saved per day and per session, and re-opening a finished session awards nothing. Undo-last-count works until completion.
- **Streak** is derived from genuine completions only. Policy: a day counts when BOTH morning and evening are complete. A missed day ends the streak; a streak stays alive through today until today ends. Dates are local calendar days; the app rolls over on return to the foreground.
- **Starter adhkar list** (6 items) is marked "to be verified". Text, counts and references must be checked by the owner before release.
- Data compatibility: existing storage keys are unchanged; new `adhkar` records live inside `noor-adhkar-v1` and are included in backup/restore and reset. Earlier button-press history in `completed` is kept and still counts toward streaks (it cannot be distinguished from genuine completions).
- **Compass polish:** the big angle is now the live heading (it changes as you turn); the Qibla bearing is shown beside it. A Kaaba marker sits on the dial, a fixed notch marks where the phone points, and when you face the Qibla (within about 4°, released at 8° to avoid flicker) the dial glows and says "You are facing the Qibla." Optional vibration on arrival follows the existing vibration setting. Readings are smoothed and the dial never spins the long way round at north. Home compass shows the same live angle and "Turn right/left N°" / "Facing the Qibla ✓".
- **Nav press-and-drag:** press and hold anywhere on the bottom bar and slide; a highlight follows the finger over the tabs (tabs are equal width while dragging so nothing moves under the finger) and the screen opens when you lift. Taps behave as before.
- **In-place updates:** `scripts/apply-signing.mjs` + `signing/naseem.keystore` make every build use one fixed signing key so a new APK installs over the old one without uninstalling. Run it after `npx cap add android` and before Gradle. The versionCode must keep increasing (derived from package.json version). One-time caveat: the first build with this key cannot install over an APK signed by the old random CI debug key; export a backup, uninstall once, install, restore.
- Not yet done in this release: swipe-drag on the nav bar, Android back-button handling, Home dashboard extras, P2 items. Nothing here has been run on a physical Android device yet.

# V4 development foundation — Naseem (نسيم)

- Public app display name changed to Naseem; Noor remains the project/repository identity.
- Preserved Android application ID `com.noor.adhkar`, internal storage keys, native plugin identifiers and Java package names for compatibility.
- Added new emerald Arabic Naseem icon and splash artwork.
- Updated app metadata, user-facing brand labels, widget labels and APK artifact naming.
- Added the approved V4 product blueprint and implementation status document.
- This is the initial V4 foundation; advanced features in the blueprint remain phased development work.

# Changelog

## 3.3.0 — Milestone 2.1 (menus, Dhikr tab, motion, speed)
- **Dhikr tab:** Adhkar and Tasbeeh are merged into one tab with a Counter | Adhkar switch. Nav is now Home · Dhikr · Salah · Settings. Counts, history, widget sync and the Home "quick count" tile are unchanged.
- **Themed menus:** every dropdown (dhikr, city, method, Asr, Jamaat type, 12-hour pickers) opens a Noor bottom sheet instead of Android's plain list: large rows, Arabic beside the name, tick on the current choice, drag down or tap outside to close.
- **Swipe navigation:** swipe left/right between tabs (and between Counter and Adhkar). Ignored on the count button, inputs, horizontal scrollers and the screen edges (system back gesture).
- **Motion:** directional tab slide, staggered card entrance, press feedback, count "pop", animated switch and sheet — transform/opacity only.
- **Speed:** removed the navigation bar blur; infinite decorative animations stop in Smooth mode. Settings › Appearance › Motion: Auto (Smooth on weak phones/Save-Data), Full, Smooth. Reduced-motion is respected.
- **About:** Instagram @mir.filmy.
- No skeleton loaders: all data is local and renders instantly, so a placeholder would only add delay.

## 3.3.0 — Milestone 2 (prayer defaults, account, Adhan, icon)
- **Default prayer times for Kashmir.** Fresh installs open with Srinagar (34.08°N, 74.80°E, Asia/Kolkata), Karachi (University of Islamic Sciences) method, Hanafi Asr, calculated offline. No setup, no permission needed. Times are an astronomical calculation, not any mosque's timetable; use the per-prayer ±minutes to match yours.
- **Fully editable in Settings › Salah:** city list or "Use my location" (optional), calculation method, Asr (Hanafi/Standard), ±60 min per prayer, "My own times" mode, Jamaat per prayer (offset after Adhan or fixed 12-hour time), reset buttons.
- **Customisation moved out of Home** into Settings (Salah, Notifications). Home is display only.
- **Notifications:** per prayer Adhan / Tone / Silent, separate Jamaat reminders, heads-up, test buttons. Scheduled per day for the next 21 days, rebuilt on launch and on any change.
- **Adhan audio** (Omar Hisham Al Arabi) bundled; credited in About.
- **Account:** name and profile picture (stored on the device, resized to 256 px), shown in header and greeting.
- **Background audio** is the user's own choice (Settings › Audio & Haptics); no bundled file is required.
- **Adaptive icon**, redesigned, with a monochrome layer for Android 13 themed icons.
- **Backup** now also covers Salah settings, profile and reminders, with validation.
- **Prayer widget** reads per-day times, so it stays right as days change.
- Calculation engine is written in-repo (`www/salah.js`), checked against an independent NOAA-series reference (9,840 comparisons, worst 0.55 min). It replaces the earlier plan to use the `adhan` library so defaults could be tested without network access.

## 3.3.0 — Milestone 1 (stabilisation)
Baseline: V3.2 + the scroll fix. This milestone changes structure and data safety only; prayer calculation, Jamaat, Adhan audio, Adhkar collections, Tasbeeh presets, new streak rules, the quote widget and the update system are Milestones 2–4.

**Navigation**
- Exactly five tabs: Home, Adhkar, Tasbeeh, Salah, Settings. "More" is replaced by Settings.
- Focus Studio (screen, timer, tab, home tile) removed, as the handover instructs.
- The progress screen ("Your journey") is no longer a tab. It is reached from a Home tile and has a Home back link; the Home tab stays highlighted.
- The old "Library" tab is now labelled Adhkar (content unchanged until Milestone 3).

**Settings** (collapsible groups): Salah, Adhkar, Notifications, Appearance (dark/light), Audio & Haptics, Data & Backup, About Noor (version, creator Mir Midhat ul Ahad, Instagram shown as "Not set").

**12-hour time everywhere**
- Prayer-time editor uses hour / minute / AM-PM pickers instead of the device-dependent time input. Times are still stored as HH:mm internally, so existing saved schedules keep working.
- Dashboard, reminders card, notification text and the prayer widget all show AM/PM.

**Data & Backup**
- Export a single JSON backup (progress, presets, prayer times, reminders, preferences). On Android it goes through the share sheet, because an Android WebView cannot download blob files (the old export button could not have worked in the APK).
- Restore validates the file (app marker, format version, known keys only, structure, value ranges) and shows a summary and a confirmation before replacing anything. Bad files change nothing.
- A safety copy is taken before restore, reset or erase, with an Undo button.
- "Reset progress" (keeps settings and prayer times) and "Erase everything" (double confirmation).

**Audio**
- Background audio moved from the removed Focus screen into Settings › Audio & Haptics. The user chooses their own file.

**Scrolling** — scroll-fix CSS from the supplied zip adopted; touch-drag scrolling verified on every screen.

**Dependencies added:** `@capacitor/filesystem`, `@capacitor/share` (for backup export).

## Notes for approval (candidates for removal, not removed)
- Dead CSS for Focus/cosmos (`.focus-*`, `body.cosmos-on`) in `styles.css`.
- Unused keys left in `noor-v3-preferences` (`cosmos`, `focus*`, `audio*`, `hanafiDefault`).


## 4.0.1 — Accent personalisation
- Added persistent seven-choice accent colour settings (six presets plus custom).
- Added live accent application for dark and light themes.
- Included accent preferences in backup and restore.

## 4.0.2 — Naseem UI and tools preview
- Added Qibla finder and preliminary Zakat calculator screens.
- Added Explore hub with honest under-development labels for planned features.
- Replaced launcher artwork with the mosque-and-crescent Naseem emblem.
- Qibla and Zakat are first-pass functional tools; their sensor, permission and fiqh edge cases remain to be debugged and reviewed.
- Home's English countdown ring now shows the Qibla direction; the Arabic prayer-countdown ring is retained.
- Version metadata is 4.0.2, and the APK workflow now listens to `naseem-*` and `noor-*` branches as well as `main`.
