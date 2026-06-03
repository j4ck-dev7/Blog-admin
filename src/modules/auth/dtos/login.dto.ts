import { IsEmail, IsNotEmpty, MinLength } from 'class-validator';
import { Transform } from 'class-transformer';
import { sanitize } from 'isomorphic-dompurify';

export class LoginDto {
  @IsEmail()
  @IsNotEmpty()
  @Transform(({ value }) => sanitize(String(value || '').trim().toLowerCase()))
  email!: string;

  @IsNotEmpty()
  @MinLength(8)
  password!: string;
}
