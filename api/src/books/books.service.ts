import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateBookDto } from './dto/create-book.dto';
import { ListBooksQueryDto } from './dto/list-books-query.dto';
import { UpdateBookDto } from './dto/update-book.dto';

@Injectable()
export class BooksService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(query: ListBooksQueryDto) {
    const { genreId, search, page = 1, limit = 20 } = query;
    const where: Prisma.BookWhereInput = {};

    if (genreId !== undefined) {
      where.genreId = genreId;
    }
    if (search?.trim()) {
      where.OR = [
        { title: { contains: search.trim(), mode: 'insensitive' } },
        { author: { contains: search.trim(), mode: 'insensitive' } },
      ];
    }

    const [data, total] = await this.prisma.$transaction([
      this.prisma.book.findMany({
        where,
        include: { genre: true },
        orderBy: { title: 'asc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.book.count({ where }),
    ]);

    return { data, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  async findOne(id: number) {
    const book = await this.prisma.book.findUnique({
      where: { id },
      include: { genre: true },
    });
    if (!book) {
      throw new NotFoundException(`Book ${id} was not found`);
    }
    return book;
  }

  async create(dto: CreateBookDto) {
    try {
      return await this.prisma.book.create({
        data: dto,
        include: { genre: true },
      });
    } catch (error) {
      this.throwForConstraintError(error);
    }
  }

  async update(id: number, dto: UpdateBookDto) {
    try {
      return await this.prisma.book.update({
        where: { id },
        data: dto,
        include: { genre: true },
      });
    } catch (error) {
      this.throwForConstraintError(error, id);
    }
  }

  async remove(id: number) {
    try {
      return await this.prisma.book.delete({ where: { id } });
    } catch (error) {
      this.throwForConstraintError(error, id);
    }
  }

  private throwForConstraintError(error: unknown, id?: number): never {
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === 'P2002') {
        throw new ConflictException('A book with this ISBN already exists');
      }
      if (error.code === 'P2003') {
        throw new NotFoundException('The selected genre does not exist');
      }
      if (error.code === 'P2025') {
        throw new NotFoundException(`Book ${id} was not found`);
      }
    }
    throw error;
  }
}
