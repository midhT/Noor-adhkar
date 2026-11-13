# Glance content feed

The public content repository maintains the `glance.json` feed. Naseem reads the configured HTTPS feed automatically; the endpoint is intentionally not exposed as an editable setting in the app. To change the endpoint, update the `GLANCE_FEED_URL` constant in `www/v404.js` as part of a source release.

The app displays the most recently published item (`published: true`), keeps a local copy of the last valid item, and falls back to a bundled reminder when the feed is unavailable. Never embed a GitHub token or private repository credential in the APK. Review religious content and references before publishing.

The sample item is unpublished and intentionally generic; replace it with reviewed content before enabling it.
