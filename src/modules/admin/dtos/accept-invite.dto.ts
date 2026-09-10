import { IsString, IsNotEmpty, MinLength } from 'class-validator';
import { Transform } from 'class-transformer';
import { sanitize } from 'isomorphic-dompurify';

export class AcceptInviteDto {
  @IsString()
  @IsNotEmpty()
  @MinLength(1)
  @Transform(({ value }) => sanitize(String(value || '').trim()))
  token!: string;

  @IsString()
  @IsNotEmpty()
  @MinLength(3)
  @Transform(({ value }) => sanitize(String(value || '').trim()))
  name!: string;

  @IsString()
  @IsNotEmpty()
  @MinLength(8)
  password!: string;
}
