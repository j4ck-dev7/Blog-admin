import { IsString, IsNotEmpty, MinLength } from 'class-validator';
import { Transform } from 'class-transformer';
import { sanitize } from 'isomorphic-dompurify';

export class SetupMfaDto {
  @IsString()
  @IsNotEmpty()
  @MinLength(1)
  @Transform(({ value }) => sanitize(String(value || '').trim()))
  token!: string;
}
