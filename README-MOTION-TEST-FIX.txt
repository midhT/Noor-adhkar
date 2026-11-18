Naseem build 40115 - browser motion test correction

This patch updates tests/test_motion.py only.

Reason:
The app has five bottom navigation tabs: Home, Dhikr, Salah, Quran, You.
Explore/More and Zakat are destinations inside You, not bottom-navigation tabs.
The old test incorrectly swiped through those nested screens as if they were
separate tabs. That desynchronized the test and eventually attempted to click
the Dhikr counter while it was hidden.

The patch now:
- tests the five actual swipe destinations in both directions;
- verifies the You tab is the final tab and does not wrap;
- tests More Features and Zakat as nested You destinations for responsive overflow;
- returns to the visible Dhikr counter before testing count-button gestures.

No production app code, version, package ID, signing configuration, keystore,
or GitHub signing secret is changed.

Apply from the repository root by extracting this ZIP over the repository.
