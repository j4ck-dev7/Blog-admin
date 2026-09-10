import { IsEmail, IsNotEmpty } from 'class-validator';
import { Transform } from 'class-transformer';
import { sanitize } from 'isomorphic-dompurify';

export class SendInviteDto {
  @IsEmail()
  @IsNotEmpty()
  @Transform(({ value }) => sanitize(String(value || '').trim().toLowerCase()))
  email!: string;
}
