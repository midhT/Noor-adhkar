# Glance feed contract

Host `glance.json` at a public HTTPS URL (for example, GitHub Pages or the raw URL of a public repository). In Naseem, open Explore → Glance → Content feed settings and paste that URL.

The app accepts the last item where `published` is `true`. Keep the feed public and never embed a GitHub token or private credential in the APK. The app caches the last valid item locally and otherwise displays a bundled fallback reminder. The separate admin app can be built later to publish this same JSON format.

The sample item is unpublished and intentionally generic; replace it with reviewed content before enabling it.
