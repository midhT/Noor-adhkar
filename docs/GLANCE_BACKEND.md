# Naseem public content backend

The application is a read-only client. It fetches public JSON from `midhT/Naseem-public` without a GitHub token. The private application repository `midhT/Noor-adhkar` is not the public feed host.

## Public files
- `release.json` — current public release version and APK download URL.
- `content/glance.json` — daily reflections, lessons and quizzes.
- `content/duas.json` — reviewed Dua Library entries.

Both content feeds include `schemaVersion` and `contentVersion`. The client validates the schema, stores the latest valid content locally, and falls back to bundled/cached content when offline or when the feed is invalid. The app never contains a GitHub write token.

The release workflow builds the signed APK, publishes the APK to the public repository's Releases, then updates the public release metadata and content JSON files. The workflow requires the `NASEEM_PUBLIC_REPO_TOKEN` secret in the private source repository. Never place that token, signing keys, passwords or personal user data in the public repository or APK.

Religious content must be checked against reliable sources before setting `published: true`.
