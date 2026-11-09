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
