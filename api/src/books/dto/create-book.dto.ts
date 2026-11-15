import { Type } from 'class-transformer';
import { IsInt, IsNotEmpty, IsString, Matches, Max, MaxLength, Min } from 'class-validator';

export class CreateBookDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  title!: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  author!: string;

  @IsString()
  @Matches(/^(?:\d{10}|\d{13})$/, { message: 'isbn must contain 10 or 13 digits' })
  isbn!: string;

  @Type(() => Number)
  @IsInt()
  @Min(0)
  @Max(1000000)
  totalCopies!: number;

  @Type(() => Number)
  @IsInt()
  @Min(1)
  genreId!: number;
}
