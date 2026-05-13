# Tuition Track Backend

Hono API running on Bun with Prisma and SQLite for local development.

## Setup

```sh
bun install
bunx prisma generate
```

The development database is configured in `.env`:

```env
DATABASE_URL="file:./prisma/dev.db"
```

## Run

```sh
bun run dev
```

API: `http://localhost:3000`

## Seed Data

```sh
bun prisma/seed.ts
```

Default accounts:

- Admin: `admin@tuitiontrack.com` / `admin123`
- Teacher: `iyolita@tuitiontrack.com` / `teacher123`
- Student: `faiza@student.com` / `student123`
