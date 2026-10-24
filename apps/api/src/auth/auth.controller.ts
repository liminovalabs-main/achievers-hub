import { Body, Controller, Post } from "@nestjs/common";
import { ApiTags } from "@nestjs/swagger";
import { AuthService } from "./auth.service";
import { ActivateAccountDto } from "./dto/activate-account.dto";
import { LoginDto } from "./dto/login.dto";
import { RegisterDto } from "./dto/register.dto";

@ApiTags("auth")
@Controller("auth")
export class AuthController {
  constructor(private readonly auth: AuthService) {}

  @Post("register")
  register(@Body() input: RegisterDto) {
    return this.auth.register(input);
  }

  @Post("login")
  login(@Body() input: LoginDto) {
    return this.auth.login(input);
  }

  @Post("activate-student")
  activateStudent(@Body() input: ActivateAccountDto) {
    return this.auth.activateStudent(input);
  }
}
