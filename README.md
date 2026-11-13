# Library Management System

## Setup (data layer)

```bash
cd api
cp .env.example .env            # then put your hosted PostgreSQL URL in .env
npm install
npx prisma migrate dev --name init   # creates tables in your hosted database
npx prisma db seed                   # inserts 4 genres and 16 books
```

Add this to `api/package.json` so `prisma db seed` works:

```json
"prisma": { "seed": "ts-node prisma/seed.ts" }
```

## Project structure

```
api/
  .env.example            # DATABASE_URL placeholder (copy to .env)
  prisma/schema.prisma    # Role enum, User, Genre, Book, Review
  prisma/seed.ts          # 4 genres, 16 books, 2 users
  src/prisma/             # PrismaService + global PrismaModule
  src/books/              # GET /books, /books?genreId=, /books/:id
```

Once the API is running (`npm run start:dev`), open `http://localhost:3000/books` to see books with their genre.

## Schema Decisions

**Why `Book` references `Genre` instead of embedding it**

- **One source of truth.** A genre is a shared entity. If `"Science Fiction"` were copied into every book, renaming it or fixing a typo would mean updating every book, and any missed copy would leave the catalogue inconsistent. With a `genreId` foreign key, the name lives in one `Genre` row.
- **Referential integrity.** PostgreSQL enforces the foreign key, so a book can never point to a genre that doesn't exist, and a genre can't be deleted while books still use it.
- **Queries go both ways.** Genre → books ("everything in Fantasy") and book → genre are both simple relation queries, and `Genre` can be listed for filter dropdowns without scanning every book.
- **Genres can grow.** A description or cover image can be added to `Genre` later without touching `Book`.
- **Embedding would suit a different case.** Embedding fits data that is owned by one parent and never queried on its own. Genres are shared, independently listed and independently edited, so a relation fits better.

**Other decisions**

- `Role` is an enum (`PATRON`, `LIBRARIAN`) so invalid roles are rejected by the database; it defaults to `PATRON` (least privilege).
- `Book.isbn` and `User.email` are `@unique` to prevent duplicates.
- `@@index([genreId])` speeds up "books by genre" queries.
- `Review` (stretch) has a `@@unique([bookId, userId])` so a user can review a book only once, and cascades on delete.

## Prisma vs. a document database

Modelling in Prisma made me decide relationships up front. In a document database I might have nested the genre inside each book and moved on, but Prisma's `@relation` pushed me to ask who owns the data and how it will be queried. The schema file is also the single source of truth: migrations and the typed client both come from it, rather than the shape being implied by whatever documents were written.
  
