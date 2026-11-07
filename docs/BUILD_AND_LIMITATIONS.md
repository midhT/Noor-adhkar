# Build and verification notes

This is a clean source baseline intended to be copied into the Noor repository.
It includes working local dhikr state, an Adhan-based prayer timetable using
Srinagar defaults, focus timer, journey summary, and CI build workflow.

Not yet included: GPS permission/location selection, scheduled prayer notifications,
Android home-screen widget providers, full migration from legacy V3 storage,
or a device-verified release. These should be implemented and verified in the next
increment rather than claimed as complete.

Before public release, validate religious text and prayer-time settings with a
qualified local authority. The prayer timetable defaults to Srinagar coordinates
and Karachi calculation method with Hanafi Asr; users must verify local settings.
