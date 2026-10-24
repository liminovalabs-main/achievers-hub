import { Body, Controller, Delete, Get, Param, Patch, Post, UseGuards } from "@nestjs/common";
import { ApiBearerAuth, ApiTags } from "@nestjs/swagger";
import { Role } from "@achievers-hub/database";
import { AuthUser } from "../auth/auth-user.interface";
import { CurrentUser } from "../auth/current-user.decorator";
import { JwtAuthGuard } from "../auth/jwt-auth.guard";
import { Roles } from "../auth/roles.decorator";
import { RolesGuard } from "../auth/roles.guard";
import { AcceptTutorInvitationDto } from "./dto/accept-tutor-invitation.dto";
import { DecideTutorLinkDto } from "./dto/decide-tutor-link.dto";
import { InviteTutorDto } from "./dto/invite-tutor.dto";
import { RequestStudentAccessDto } from "./dto/request-student-access.dto";
import { RelationshipsService } from "./relationships.service";

@ApiTags("relationships")
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller("relationships")
export class RelationshipsController {
  constructor(private readonly relationships: RelationshipsService) {}

  @Get()
  @Roles(Role.PARENT, Role.STUDENT, Role.TUTOR)
  list(@CurrentUser() user: AuthUser) {
    return this.relationships.list(user);
  }

  @Post("tutor-invitations")
  @Roles(Role.PARENT)
  inviteTutor(@CurrentUser() user: AuthUser, @Body() input: InviteTutorDto) {
    return this.relationships.inviteTutor(user.id, input);
  }

  @Post("tutor-invitations/accept")
  @Roles(Role.TUTOR)
  acceptTutorInvitation(@CurrentUser() user: AuthUser, @Body() input: AcceptTutorInvitationDto) {
    return this.relationships.acceptTutorInvitation(user.id, user.email, input);
  }

  @Post("tutor-requests")
  @Roles(Role.TUTOR)
  requestStudentAccess(@CurrentUser() user: AuthUser, @Body() input: RequestStudentAccessDto) {
    return this.relationships.requestStudentAccess(user.id, input);
  }

  @Patch(":linkId/decision")
  @Roles(Role.PARENT)
  decide(
    @CurrentUser() user: AuthUser,
    @Param("linkId") linkId: string,
    @Body() input: DecideTutorLinkDto,
  ) {
    return this.relationships.decide(user.id, linkId, input);
  }

  @Delete(":linkId")
  @Roles(Role.PARENT)
  revoke(@CurrentUser() user: AuthUser, @Param("linkId") linkId: string) {
    return this.relationships.revoke(user.id, linkId);
  }
}
