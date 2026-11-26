# NFC Verify

Tap a tagged item with any phone and see whether it is genuine. NFC Verify checks the cryptographic signature that an NXP NTAG 424 DNA tag produces on every tap, logs the scan and detects copied or reused links.

**Live demo:** https://nfc-verify.onrender.com (the free server sleeps when idle, so the first load can take up to a minute)

Course project for LUT CT70A9800 Full Stack Development · Hyechan Shin

## About

Each physical item is fitted with an NTAG 424 DNA NFC tag encoded with SDM (Secure Dynamic Messaging), so tapping it with any phone opens a URL containing the tag's UID, scan counter, and a cryptographic CMAC (Cipher-based Message Authentication Code). The backend validates the CMAC against a registered key, logs the scan (timestamp, counter, IP), and detects tampering or cloning attempts (a repeated or rolled-back counter). A public page shows the verification result (genuine/invalid) plus decoded tag details in both raw hex and human-readable form; an admin dashboard lets an owner register tags and review scan history.

**Definition of success:** a user can tap a real, encoded NTAG 424 tag with an unmodified phone browser and see an accurate genuine/invalid result within a couple of seconds, with the scan recorded and visible in the admin dashboard's history for that tag. **Status: met** (tested on iPhone and Android).

## Features

- **Public verify page** (`/verify`): GENUINE or INVALID, with UID, counter and CMAC in raw hex and readable form, plus recent scan history. No app or account needed.
- **CMAC check:** AES-128-CMAC (RFC 4493) and the SDM session-key derivation from NXP AN12196, implemented in [`server/sdm.ts`](server/sdm.ts) with Node's `crypto`.
- **Replay and clone detection:** a tap only counts as genuine if its counter is higher than the last genuine tap.
- **Reopened links:** opening the last genuine link again (browser history, old tab, refresh) shows a grey "Already checked, tap again" card instead of a false alarm, and is not logged.
- **Scan log:** every new tap is stored with time, counter, result, reason and a hashed IP.
- **Encrypted keys:** tag keys are stored encrypted (AES-256-GCM); the admin sees only a key check value and a warning if a tag still uses the factory-default key.
- **Admin area (password login):** dashboard, tag list, tag detail with scan history, register and delete tags.
- **Register from a tap:** an unknown tag shows its tap details and a "Register this tag" button. The server only saves it if the key matches that tap's signature.

## Tech stack

| Part | Technology |
| --- | --- |
| Frontend | React 19, React Router 8, Vite 8, TypeScript |
| Backend | Node.js 24, Express 5, TypeScript, Mongoose 9 |
| Database | MongoDB Atlas |
| Hosting | Render (one web service for API and frontend) |

## Architecture

![Architecture](docs/architecture.png)

```
client/            React app (View)
  src/pages/       Verify, Login, Dashboard, Tags, TagDetail, RegisterTag
  src/api.ts       API calls and error handling
server/            Express API
  models/          Mongoose schemas: Tag, Scan (Model)
  routes/          verify, tags, dashboard handlers (Controller)
  sdm.ts           AES-CMAC + SDM MAC calculation
  secure.ts        key encryption, IP hashing, key check value
  migrate.ts       encrypts old keys / hashes old IPs at startup
  auth.ts          admin login, session cookie, requireAdmin
  env.ts           startup check for required environment variables
  .env.example     template for server/.env (copy it, fill it in)
  *.test.ts        unit tests
docs/              diagrams
```

In production Express serves the built React app from `client/dist` and the API under `/api`. In development Vite runs on port 5173 and forwards `/api` to Express on port 4000.

### How a tap is verified

The tag opens `https://nfc-verify.onrender.com/verify?uid=<UID>&ctr=<counter>&cmac=<MAC>`. The server:

1. derives a session key: `AES-CMAC(key, 3CC3 0001 0080 || UID || counter LSB-first)`
2. computes `AES-CMAC(session key, empty)` and keeps the odd-indexed bytes
3. compares that with the `cmac` in the URL (constant time)
4. if counter and MAC are exactly those of the last genuine tap, answers "already checked" without logging (the same link was reopened)
5. checks the counter is higher than the last genuine tap, otherwise flags `replay`
6. logs the scan and returns the result

![Verification flow](docs/verify-flow.png)

## API

| Method | Path | Access | Purpose |
| --- | --- | --- | --- |
| GET | `/api/health` | public | health check |
| GET | `/api/verify?uid&ctr&cmac` | public | verify and log a tap |
| POST | `/api/auth/login` · `/logout` | public | admin session |
| GET | `/api/auth/me` | public | is the visitor logged in? |
| GET | `/api/dashboard` | admin | totals and recently scanned tags |
| GET / POST | `/api/tags` | admin | list / register tags |
| GET / DELETE | `/api/tags/:uid` | admin | tag with scans / delete tag |

## Setup, step by step

Follow these steps in order to run the whole system on your own computer.

### 1. Install the tools

- [Node.js 24](https://nodejs.org) (check with `node -v`; npm comes with it)
- [Git](https://git-scm.com)
- A free [MongoDB Atlas](https://www.mongodb.com/cloud/atlas) account

### 2. Get the code

```bash
git clone https://github.com/hyechanshin/nfc-verify.git
cd nfc-verify
```

### 3. Create the database (MongoDB Atlas)

1. In Atlas, create a free **M0** cluster.
2. **Security → Database & Network Access → Database Users → Add New Database User.** Choose a username and a password (use the autogenerate button and save it) with the built-in role *Read and write to any database*.
3. **Security → Database & Network Access → IP Access List → Add IP Address → Add Current IP Address.** Do not choose "Allow access from anywhere" (`0.0.0.0/0`); see [Security notes](#security-notes). Atlas can make an entry temporary, which is a good fit for a development laptop.
4. **Database → Connect → Drivers.** Copy the connection string, replace `<password>` with the user's password and add the database name before the `?`, for example `mongodb+srv://user:password@cluster0.abcde.mongodb.net/nfc-verify?retryWrites=true&w=majority`.

### 4. Set the environment variables

Copy the template, then open `server/.env` and fill it in (`.env` is git-ignored, so secrets are never committed):

```bash
cp server/.env.example server/.env        # Windows Command Prompt: copy server\.env.example server\.env
```

| Variable | Required | Description |
| --- | --- | --- |
| `MONGO_URI` | yes | MongoDB connection string from step 3 |
| `ADMIN_PASSWORD` | yes | password for the admin pages |
| `KEY_ENCRYPTION_SECRET` | yes | long random string that encrypts tag keys and hashes scan IPs. Keep a backup: without it the stored keys cannot be read |
| `SESSION_SECRET` | recommended | long random string that signs admin session cookies. If it is missing, a key derived from `ADMIN_PASSWORD` is used and a warning is logged |
| `PORT` | no | default `4000` (Render sets it itself) |

Generate each random secret with:

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

**A missing required variable stops the server at startup** with one message that lists every missing variable and how to set it, so a wrong deploy fails immediately and visibly:

```
Cannot start: 2 required environment variables are missing.

  ADMIN_PASSWORD         Password for the admin pages. Use a long one.
  KEY_ENCRYPTION_SECRET  Long random string that encrypts tag keys. Keep a backup.

Running locally: add them to server/.env (copy server/.env.example to start).
Running on Render or another host: add them in the service settings under Environment, then redeploy.
...
```

### 5. Install and start

Start the server and the client in **two terminals** (each folder has its own `package.json`, so run the commands inside the folder):

```bash
# terminal 1
cd server
npm install
npm run dev      # http://localhost:4000

# terminal 2
cd client
npm install
npm run dev      # http://localhost:5173
```

Terminal 1 should print `Connected to MongoDB` and `Server listening on http://localhost:4000`. Open **http://localhost:5173** (in development, port 4000 is only the API), open the admin login and sign in with your `ADMIN_PASSWORD`.

### 6. Run the tests

```bash
cd server
npm test
```

### 7. Try it with a tag

Prepare a tag as described in [Preparing a tag](#preparing-a-tag), tap it, and press **Register this tag (admin)**.

### Production build on your computer

What Render runs, from the repository root:

```bash
npm run build    # builds client/dist and server/dist
npm start        # app + API on http://localhost:4000
```

### Troubleshooting

| What you see | Cause and fix |
| --- | --- |
| `Cannot start: ... required environment variables ... missing` | A variable is not set. Add it to `server/.env` (locally) or under **Environment** in the Render service, then restart or redeploy. |
| `Could not connect to MongoDB` (often after about 30 seconds) | Atlas is refusing the connection. Check that your IP (locally) or Render's outbound IP ranges (deployed) are on the Atlas IP Access List, and that the user, password and cluster in `MONGO_URI` are right. |
| `bad auth` in the MongoDB message | Wrong database user or password in `MONGO_URI`. Special characters in the password must be URL-encoded. |
| Deploy on Render fails or never becomes live | Open **Logs**: the server prints one of the two messages above and exits. Fix it and redeploy. |
| `npm run` does nothing or says a script is missing | You are in the repository root. Run it inside `server/` or `client/`. |
| `http://localhost:4000` shows only "NFC verify server is running" | That is the API. In development open `http://localhost:5173`. |
| The live demo takes about a minute to load | The free Render server was asleep and is starting up. |

## Preparing a tag

Tags are configured once outside the app (browsers cannot write NTAG 424 settings), using GoToTags Desktop and an ACS ACR1552U reader:

- URL template: `https://nfc-verify.onrender.com/verify?uid=00000000000000&ctr=000000&cmac=0000000000000000`
- SDM with plain UID and read-counter mirroring and a MAC; offsets UID 42, counter 61, MAC 73, MAC input 73
- SDM file read key: key 0 (the factory default is all zeros; use a unique random key in real use)

Then tap the tag and press **Register this tag (admin)**.

## Deployment (Render)

The whole app runs as one Render web service (API and frontend together). Every push to `main` deploys automatically.

1. Push the code to GitHub and make sure `main` is up to date.
2. On [render.com](https://render.com): **New → Web Service** and connect the GitHub repository.
3. Settings: Root Directory empty, Build Command `npm run build`, Start Command `npm start`, instance type Free.
4. Under **Environment**, add `MONGO_URI`, `ADMIN_PASSWORD`, `SESSION_SECRET`, `KEY_ENCRYPTION_SECRET` and `NODE_VERSION` = `24`. Add them **before** the first deploy: without them the server stops at startup with the message shown above and the deploy fails (the reason is in the **Logs**).
5. Deploy. The logs should show `Connected to MongoDB` and `Server listening on ...`.
6. Restrict database access to the server (next section).
7. Open the service URL. After a period without visitors the first load can take up to a minute.

### Restrict database access to the server

Atlas should accept connections only from the server, not from the whole internet:

1. In Render, open the service → **Connect** (top right) → **Outbound** tab and copy the IP ranges.
2. In Atlas: **Security → Database & Network Access → IP Access List → Add IP Address** and add each range.
3. Delete the `0.0.0.0/0` ("Allow access from anywhere") entry. Keep your own IP only while you develop.
4. In Render use **Manual Deploy** (or restart) and check that the logs say `Connected to MongoDB`.

Render can change its outbound ranges and announces this in the dashboard. If the server suddenly cannot connect, copy the current list from the **Outbound** tab again.

## Git workflow

![Branching model](docs/git-branching.png)

- `main` is always deployable.
- One branch per feature or fix (`feature/<name>`, `fix/<name>`), merged with `git merge --no-ff`.
- Commit messages follow [Conventional Commits](https://www.conventionalcommits.org/) (`feat:`, `fix:`, `chore:`).

## Security notes

- HTTPS to Render, TLS to MongoDB Atlas, Atlas encrypts data at rest.
- **Database access:** the browser never talks to MongoDB. Only the Express server holds the connection string, and the React app reaches data only through the `/api` routes (admin routes need the login). Atlas Network Access accepts only the server's outbound IP ranges from Render (plus a developer's own IP while developing), not `0.0.0.0/0`. A leaked or guessed database password is therefore useless from any other network, and the database is not exposed to the public internet. Limits: Render's outbound ranges are shared by other Render services in the same region, and free Atlas clusters do not support private endpoints or VPC peering, so a fully private connection would need Render dedicated IPs or a paid Atlas cluster. For that reason the other layers matter too: tag keys are encrypted with a secret that is not stored in the database, so the database password alone does not reveal them.
- Secrets only in `.env` / Render environment variables.
- Admin session: httpOnly cookie signed with a separate `SESSION_SECRET`, constant-time comparisons, delayed response to wrong passwords.
- Rate limits per IP: 10 login attempts and 100 verify requests per 15 minutes.
- Security headers via `helmet` (content security policy, no framing, no MIME sniffing).
- Forged signatures (`bad_cmac`) are logged for the admin but hidden from the public history and never flag a tag, because anyone can send one for a known UID. A tag is flagged when a link with a valid signature but an old counter is used.
- Tag keys are encrypted at rest with AES-256-GCM (random IV, tag UID bound as associated data) using a key from `KEY_ENCRYPTION_SECRET`, and are never returned by the API. A leaked database alone does not reveal them.
- Scan IPs are stored as keyed HMAC-SHA256 hashes, so the admin can see repeat visitors without storing addresses (GDPR data minimisation). `npm audit` reports no known vulnerabilities.

**Planned** (from course feedback): move route handlers into `server/controllers/`.
