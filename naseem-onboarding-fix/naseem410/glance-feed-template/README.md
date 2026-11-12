# Naseem Glance feed template

This folder is intended to become the contents of a separate **public** repository named `naseem-glance` (or another name you choose). It is a read-only content feed for the Naseem Android app.

## Publish with GitHub Pages

1. Create a new public GitHub repository, for example `midhT/naseem-glance`.
2. Copy the contents of this folder into that repository's root.
3. In the new repository, open **Settings → Pages** and select **GitHub Actions** as the deployment source.
4. Push to `main`. The included workflow publishes the repository as a static site.
5. The JSON feed will be available at `https://OWNER.github.io/REPOSITORY/content/glance.json`.
6. Put that exact URL in `www/glance-config.js` in the Naseem source repository and build a new APK once.

After that, editing `content/glance.json` and pushing to `main` updates Glance without releasing a new Naseem APK.

## Content format

- `version`: feed schema version (currently 1).
- `updated_at`: ISO-8601 UTC timestamp.
- `items`: published cards. Naseem displays the first valid, published, non-expired item.
- `expires_at`: optional ISO-8601 timestamp. Expired items are ignored.
- `reference`: optional source/reference shown below the message.
- Keep messages short and verify Quran/Hadith references before publication.

## Security

This repository contains public display content only. Never place GitHub tokens, passwords, private user data or admin credentials in it. Naseem downloads the JSON without authentication. A future admin app must publish through a secure authenticated flow; never embed a write token in the Naseem APK.
