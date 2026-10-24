import { ApiProperty } from "@nestjs/swagger";
import { IsString, MaxLength, MinLength } from "class-validator";

export class ActivateAccountDto {
  @ApiProperty()
  @IsString()
  @MinLength(32)
  token: string;

  @ApiProperty({ minLength: 12 })
  @IsString()
  @MinLength(12)
  @MaxLength(128)
  password: string;
}
