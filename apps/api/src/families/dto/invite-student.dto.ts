import { ApiProperty } from "@nestjs/swagger";
import { IsEmail, IsString, Length } from "class-validator";

export class InviteStudentDto {
  @ApiProperty({ example: "student@example.com" })
  @IsEmail()
  email: string;

  @ApiProperty({ example: "Sam Morgan" })
  @IsString()
  @Length(2, 80)
  displayName: string;
}
