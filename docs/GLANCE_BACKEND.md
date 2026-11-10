# Glance backend design

Naseem contains a read-only Glance client. Its feed URL is configured in `www/glance-config.js`. The app never contains a GitHub write token.

A separate public repository can host the JSON feed with GitHub Pages. A future admin app will publish content to that repository through a secure authenticated workflow. Do not put a personal access token in either the public feed or the Naseem APK.

The app's fallback order is:

1. Latest valid published feed item.
2. Last successfully cached item if the network is unavailable or the feed is empty/invalid.
3. Built-in Quranic reminder (Qur'an 2:152) if no cache exists.

The feed format is demonstrated in `glance-feed-template/content/glance.json`.
