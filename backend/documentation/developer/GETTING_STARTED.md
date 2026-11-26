# Getting started with the backend (Windows)

This guide takes you from nothing to a running backend and a passing test suite. Commands are typed into **PowerShell** (press **Start**, type `PowerShell`, open **Windows PowerShell**). Every command is run from the project folder unless stated.

## 1. Install uv (Python and package manager)

uv installs the right Python version (3.13) and the exact package versions in `uv.lock` (ADR-0010).

1. In PowerShell, run:
   ```powershell
   powershell -ExecutionPolicy ByPass -c "irm https://astral.sh/uv/install.ps1 | iex"
   ```
2. Close PowerShell and open it again, so it finds the new `uv` command.
3. Check: `uv --version` should print a version number.

## 2. Get a PostgreSQL database

You need one PostgreSQL database for development. Choose **one** option.

**Option A: Neon (online, free plan; the approved development database, ADR-0003)**
1. Sign in at https://neon.com and create a project (choose the region closest to Kenya that Neon offers).
2. Open the project's **Connection details** (or **Connect**) panel and copy the connection string. It looks like `postgres://user:password@host.neon.tech/dbname?sslmode=require`.
3. Keep it private: it contains a password. It goes only into `backend\.env` (step 4), never into any other file.

Neon's screens change from time to time; if a button name differs, look for "connection string".

**Option B: PostgreSQL on your computer**
1. Download the Windows installer from https://www.postgresql.org/download/windows/ (version 16 or newer) and install it. Remember the password you choose for the `postgres` user.
2. Open **SQL Shell (psql)** from the Start menu, press Enter to accept the defaults, then type the `postgres` password.
3. Create a development user and database (change the password if you like):
   ```sql
   CREATE ROLE sokofresh LOGIN PASSWORD 'sokofresh-local-dev' CREATEDB;
   CREATE DATABASE sokofresh_dev OWNER sokofresh;
   ```
   `CREATEDB` lets the test suite create its own temporary test database.

Note: the automated tests create a separate database named `test_<your database>`. With Neon, the Free plan allows this, but if it fails, use Option B for running tests.

## 3. Install the backend's packages

```powershell
cd C:\Users\danie\OneDrive\Documents\sokofresh-ecommerce\backend
uv sync
```

`uv sync` creates a `.venv` folder (git-ignored) with Python 3.13 and every package at the locked version.

**OneDrive tip:** the project folder is inside OneDrive, and OneDrive would try to upload the thousands of files in `.venv`. To keep it out of OneDrive, set this once (PowerShell), then close and reopen PowerShell and run `uv sync` again:
```powershell
setx UV_PROJECT_ENVIRONMENT "C:\Users\danie\.venvs\sokofresh-backend"
```
uv then keeps the environment in `C:\Users\danie\.venvs\` instead. All `uv run ...` commands keep working unchanged.

## 4. Create your `.env` file

```powershell
copy .env.example .env
notepad .env
```

In Notepad, set `DATABASE_URL` to your connection string from step 2, then save (**File → Save**) and close. `.env` is git-ignored: it will never be committed.

## 5. Create the database tables

```powershell
uv run python manage.py migrate
uv run python manage.py createcachetable
```

`migrate` creates every table, including the custom user table and the four role groups. `createcachetable` creates the table that stores rate-limit counters.

## 6. Run the server

```powershell
uv run python manage.py runserver
```

Open http://127.0.0.1:8000/api/v1/health in your browser. You should see `{"status": "ok", "database": "ok"}`.

The interactive API documentation is at http://127.0.0.1:8000/api/v1/docs/ (development only).

Stop the server with **Ctrl+C**.

## 7. Create a staff account for Django admin

```powershell
uv run python manage.py createsuperuser
```

Enter a Kenyan mobile number (for example `0712345678`) and a password of at least 12 characters. Then open http://127.0.0.1:8000/admin/ and sign in with the phone number and password. (Production uses a secret admin path, set by `DJANGO_ADMIN_URL`.)

## 8. Sign in with a phone code (development)

In development no SMS is sent. The code is printed in the PowerShell window running the server, with the phone number masked, e.g. `[SMS to +2547*****678] Your SokoFresh code is 123456. ...`. The sign-in API is under `/_allauth/browser/v1/` (see `../api/API.md`).

## 9. Run the tests, linter and checks

```powershell
uv run pytest                 # all tests
uv run ruff check .           # lint
uv run ruff format .          # format the code
uv run python manage.py makemigrations --check --dry-run   # missing migrations?
```

The same checks run on GitHub for every push (`.github/workflows/backend-ci.yml`).

## 10. After changing the API: regenerate the contract

```powershell
uv run python manage.py spectacular --file ..\shared\contracts\openapi.yaml --validate
```

Commit the updated `shared/contracts/openapi.yaml` together with the code change. A test fails if you forget.

## Troubleshooting

| Message | Fix |
|---|---|
| `Set the DATABASE_URL environment variable` | `backend\.env` is missing or has no `DATABASE_URL` (step 4) |
| `connection refused` / `could not connect to server` | PostgreSQL isn't running (Option B: open **Services**, start **postgresql-x64-…**), or the connection string is wrong |
| `permission denied to create database` (tests) | The database user needs `CREATEDB` (step 2, Option B) |
| `relation "sokofresh_cache" does not exist` | Run `uv run python manage.py createcachetable` |
| `uv` is not recognised | Close and reopen PowerShell after installing uv |
