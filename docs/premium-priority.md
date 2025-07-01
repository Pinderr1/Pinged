# Premium User Priority

Swipe matching uses a priority system to surface premium and boosted users more frequently.
Each `users` document may include:

- `priorityScore` – numeric value that determines a user's default ranking.
- `boostUntil` – optional timestamp. When set to a future time the user is given a large bonus so they appear first in swipe results.

When retrieving profiles, the app sorts first by the computed priority and then by compatibility. Boosted users get an additional 1000 points during the boost period.
