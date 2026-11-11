# Public content and source policy

- Hadith Library: HadeethEnc public API, fetched online in Arabic, English and Urdu. It is a curated encyclopedia, not a complete Bukhari/Muslim corpus. Do not bulk scrape or bundle its database.
- Quran Reader and additional Quranic duas: AlQuran Cloud public API, fetched online. Provider terms (updated 14 June 2026) state that the key-less API is free, Quran text may be reproduced/displayed with faithful Uthmani orthography, and translations must be attributed by translator. Current English edition: Marmaduke Pickthall. API use is subject to soft per-second fair-use limits.
- Arabic text source attribution: AlQuran Cloud states that its Arabic text is sourced from GlobalQuran.com, Tanzil.net and Quran Academy. See https://alquran.cloud/terms-and-conditions and https://alquran.cloud/contributors.
- Tanzil Project: verified Quran text source, CC BY 3.0 with strict verbatim-only conditions. If directly bundling Tanzil files in a future offline edition, preserve the original notice and text exactly and link to https://tanzil.net.
- Prayer times: AlAdhan API may be used for calculation support, but calculation method and local mosque timings must remain user-configurable.

No API result is labelled scholar-approved by Naseem. Public content must retain provider attribution, source references and licensing notes.

Before monetising Naseem or bundling a Quran corpus offline, review the current AlQuran Cloud terms and the rights for every translation/audio edition. The current implementation is live API display only.

## Glance and Dua feed maintenance

# Naseem public content and releases

This folder is the seed for the separate public repository `midhT/Naseem-public`. Copy its contents to the root of that repository. Keep the repository public so the app can read the JSON files without credentials.

## Files
- `release.json`: latest version metadata. After each GitHub Release, update `version`, `releaseUrl`, `downloadUrl`, `notesSummary`, and `publishedAt`.
- `content/duas.json`: remotely maintainable Dua Library source. The app keeps built-in content as an offline fallback.
- `content/glance.json`: daily reflections, lessons and quiz items. Set `published` to `true` only after content review. Quiz entries may include `quiz.options`, `quiz.answer` (zero-based index), and `quiz.explanation`.

Do not store private user data, signing keys, tokens, or credentials here. Do not publish religious content without verifying Arabic text and references against trusted sources.
