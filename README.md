# Library Management System

## Data layer setup

```bash
cp .env.example .env
# Set DATABASE_URL in .env to your hosted PostgreSQL connection URL.
npm install
npm run db:generate
npm run db:migrate
npm run db:seed
npm run start:dev
```

`db:migrate` applies the checked-in migrations to the configured PostgreSQL
database. The seed can be rerun safely: genres, books, and sample users are
upserted using their unique names, ISBNs, and emails. The seed creates four
genres and sixteen books.

Set `JWT_SECRET` to a random secret of at least 32 characters. To seed a
login-capable librarian, set `SEED_LIBRARIAN_PASSWORD` (at least 8 characters)
before running the seed. Public registration always creates a `PATRON`; never
accept a client-supplied role. The Postman collection is in
[`docs/postman_collection.json`](./docs/postman_collection.json).

## API

- `GET /genres`, `GET /genres/:id`, `POST /genres`, `PATCH /genres/:id`,
  `DELETE /genres/:id`
- `GET /books?genreId=&search=&page=1&limit=20`, `GET /books/:id`,
  `POST /books`, `PATCH /books/:id`, `DELETE /books/:id`
- `POST /auth/register`, `POST /auth/login`, `GET /users/profile`

Book writes require a bearer JWT for a `LIBRARIAN`. Genre writes are currently
unrestricted. Responses from book listing include pagination metadata and each
book's genre.

## Schema Decisions

**Why `Book` references `Genre`**

- A genre is shared and independently useful, so keeping its name in one row avoids inconsistent copies across books.
- The required `genreId` foreign key prevents books from referring to missing genres, and the restrictive delete behavior prevents deleting a genre still in use.
- Both `Genre.books` and `Book.genre` support querying in either direction; an index on `genreId` supports genre-filtered book lookups.

**Other decisions**

- `Role` is a PostgreSQL enum (`PATRON`, `LIBRARIAN`) and defaults to `PATRON`.
- `Book.isbn` and `User.email` are unique identifiers to prevent duplicate catalog entries and accounts.
- `Review` is the optional stretch relation. Each user may review a given book once, and reviews are removed when their book or user is deleted.
- Review ratings are stored as integers; enforce the application's allowed rating range when validating review input.

## Prisma vs. a document database

Modelling in Prisma made me define relationships and foreign keys up front. In a
document database I might have embedded the genre in each book, but a relational
schema encourages keeping shared genre data in one place. Prisma also uses the
schema to generate both database migrations and a typed client.
