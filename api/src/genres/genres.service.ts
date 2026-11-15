import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateGenreDto } from './dto/create-genre.dto';
import { UpdateGenreDto } from './dto/update-genre.dto';

@Injectable()
export class GenresService {
  constructor(private readonly prisma: PrismaService) {}

  findAll() {
    return this.prisma.genre.findMany({ orderBy: { name: 'asc' } });
  }

  async findOne(id: number) {
    const genre = await this.prisma.genre.findUnique({ where: { id } });
    if (!genre) {
      throw new NotFoundException(`Genre ${id} was not found`);
    }
    return genre;
  }

  async create(dto: CreateGenreDto) {
    try {
      return await this.prisma.genre.create({ data: dto });
    } catch (error) {
      this.throwForConstraintError(error);
    }
  }

  async update(id: number, dto: UpdateGenreDto) {
    try {
      return await this.prisma.genre.update({ where: { id }, data: dto });
    } catch (error) {
      this.throwForConstraintError(error, id);
    }
  }

  async remove(id: number) {
    try {
      return await this.prisma.genre.delete({ where: { id } });
    } catch (error) {
      this.throwForConstraintError(error, id);
    }
  }

  private throwForConstraintError(error: unknown, id?: number): never {
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === 'P2002') {
        throw new ConflictException('A genre with this name already exists');
      }
      if (error.code === 'P2003') {
        throw new ConflictException('Cannot delete a genre that still has books');
      }
      if (error.code === 'P2025') {
        throw new NotFoundException(`Genre ${id} was not found`);
      }
    }
    throw error;
  }
}
