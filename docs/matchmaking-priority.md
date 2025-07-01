# Matchmaking Priority

Premium users are ranked above free users in swipe results. Each user may define a `priorityScore` value in Firestore which adds to their weight. Premium accounts automatically receive an additional 50 points.

A user can also have a `boostUntil` timestamp. When present and set to a future time, an extra 100 points are temporarily added on top of their base priority. Boosted users therefore appear first in the queue until the boost expires.

The `sortUsers` helper in `utils/userRanking.js` combines priority with the computed compatibility percentage to produce the final ordering.

