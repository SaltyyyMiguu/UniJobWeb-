# Archived scripts

These are one-off/manual scripts (database seeding, mock-data image
generation) that were removed from the active production pipeline —
they're never required by `backend/server.js`, any controller, or any
`npm` script. Moved here rather than deleted, since they may still be
useful for local testing.

`require('./models')` / `require('dotenv')` / upload-directory paths
inside these files were updated to point back at `backend/` from this
new location. Two things to know if you actually run one:

1. **Dependencies come from `backend/node_modules`.** These scripts use
   `bcryptjs` and `dotenv`, which only exist in `backend/node_modules` —
   Node won't find them from a bare `node scripts/archive/seed-mock.js`
   invocation on its own. Run with `NODE_PATH` pointing there:
   ```
   # from the repo root
   NODE_PATH=backend/node_modules node scripts/archive/seed-mock.js
   # Windows (PowerShell):
   $env:NODE_PATH="backend\node_modules"; node scripts\archive\seed-mock.js
   ```
   Or simpler: temporarily copy the script back into `backend/`, run it
   from there, then delete the copy.

2. **`seed-mock.js` and `seed-complete.js` write to `uploads/...` using
   paths relative to the current working directory**, not `__dirname`.
   Run them with your shell's CWD set to `backend/` (e.g.
   `cd backend && node ../scripts/archive/seed-mock.js`) so those files
   land in `backend/uploads/` as originally intended, rather than
   creating a stray `uploads/` folder wherever you happened to run from.
