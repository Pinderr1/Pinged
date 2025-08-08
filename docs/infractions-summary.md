# Infraction Summary Job

The `summariseInfractions` Cloud Function runs once every 24 hours. It scans `gameSessions` for any recorded infractions, writes an aggregated summary per player to the `infractionSummaries` collection, and then clears the session's `infractions` array.

## Deployment

Deploy all backend resources with the standard script:

```bash
npm run deploy
```

To deploy only this function:

```bash
firebase deploy --only functions:summariseInfractions
```
