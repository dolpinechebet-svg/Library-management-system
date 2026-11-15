import { PrismaClient, Role } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

const genres = ['Fiction', 'Science Fiction', 'Non-Fiction', 'Fantasy'];

const books: {
  title: string;
  author: string;
  isbn: string;
  totalCopies: number;
  genre: string;
}[] = [
  // Fiction
  { title: 'To Kill a Mockingbird', author: 'Harper Lee', isbn: '9780061120084', totalCopies: 3, genre: 'Fiction' },
  { title: 'The Great Gatsby', author: 'F. Scott Fitzgerald', isbn: '9780743273565', totalCopies: 3, genre: 'Fiction' },
  { title: 'Things Fall Apart', author: 'Chinua Achebe', isbn: '9780385474542', totalCopies: 3, genre: 'Fiction' },
  { title: 'Weep Not, Child', author: 'Ngũgĩ wa Thiong\'o', isbn: '9780435908300', totalCopies: 3, genre: 'Fiction' },
  // Science Fiction
  { title: 'Dune', author: 'Frank Herbert', isbn: '9780441013593', totalCopies: 3, genre: 'Science Fiction' },
  { title: 'Neuromancer', author: 'William Gibson', isbn: '9780441569595', totalCopies: 3, genre: 'Science Fiction' },
  { title: 'The Left Hand of Darkness', author: 'Ursula K. Le Guin', isbn: '9780441478125', totalCopies: 3, genre: 'Science Fiction' },
  { title: 'Foundation', author: 'Isaac Asimov', isbn: '9780553293357', totalCopies: 3, genre: 'Science Fiction' },
  // Non-Fiction
  { title: 'Sapiens', author: 'Yuval Noah Harari', isbn: '9780062316110', totalCopies: 3, genre: 'Non-Fiction' },
  { title: 'Educated', author: 'Tara Westover', isbn: '9780399590504', totalCopies: 3, genre: 'Non-Fiction' },
  { title: 'Dreams from My Father', author: 'Barack Obama', isbn: '9781400082773', totalCopies: 3, genre: 'Non-Fiction' },
  { title: 'A Brief History of Time', author: 'Stephen Hawking', isbn: '9780553380163', totalCopies: 3, genre: 'Non-Fiction' },
  // Fantasy
  { title: 'The Hobbit', author: 'J.R.R. Tolkien', isbn: '9780547928227', totalCopies: 3, genre: 'Fantasy' },
  { title: 'A Wizard of Earthsea', author: 'Ursula K. Le Guin', isbn: '9780547773742', totalCopies: 3, genre: 'Fantasy' },
  { title: 'The Name of the Wind', author: 'Patrick Rothfuss', isbn: '9780756404741', totalCopies: 3, genre: 'Fantasy' },
  { title: 'Mistborn: The Final Empire', author: 'Brandon Sanderson', isbn: '9780765311788', totalCopies: 3, genre: 'Fantasy' },
];

async function main() {
  const librarianPassword = process.env.SEED_LIBRARIAN_PASSWORD;
  if (librarianPassword && librarianPassword.length < 8) {
    throw new Error('SEED_LIBRARIAN_PASSWORD must contain at least 8 characters');
  }

  // Genres (upsert keeps the seed re-runnable)
  const genreIds: Record<string, number> = {};
  for (const name of genres) {
    const g = await prisma.genre.upsert({
      where: { name },
      update: {},
      create: { name },
    });
    genreIds[name] = g.id;
  }

  // Books
  for (const { genre, ...book } of books) {
    await prisma.book.upsert({
      where: { isbn: book.isbn },
      update: {},
      create: { ...book, genreId: genreIds[genre] },
    });
  }

  // Users
  await prisma.user.upsert({
    where: { email: 'librarian@example.com' },
    update: {},
    create: {
      email: 'librarian@example.com',
      name: 'Lena Librarian',
      role: Role.LIBRARIAN,
      passwordHash: librarianPassword
        ? await bcrypt.hash(librarianPassword, 12)
        : null,
    },
  });
  await prisma.user.upsert({
    where: { email: 'patron@example.com' },
    update: {},
    create: { email: 'patron@example.com', name: 'Pat Patron', role: Role.PATRON },
  });

  console.log(`Seeded ${genres.length} genres and ${books.length} books.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
