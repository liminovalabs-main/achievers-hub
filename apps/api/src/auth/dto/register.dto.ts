import { ApiProperty } from "@nestjs/swagger";
import { Role } from "@achievers-hub/database";
import { IsEmail, IsEnum, IsString, Length, MaxLength, MinLength } from "class-validator";

export class RegisterDto {
  @ApiProperty({ example: "parent@example.com" })
  @IsEmail()
  email: string;

  @ApiProperty({ minLength: 12 })
  @IsString()
  @MinLength(12)
  @MaxLength(128)
  password: string;

  @ApiProperty({ example: "Alex Morgan" })
  @IsString()
  @Length(2, 80)
  displayName: string;

  @ApiProperty({ enum: [Role.STUDENT, Role.PARENT, Role.TUTOR] })
  @IsEnum(Role)
  role: Role;
}
