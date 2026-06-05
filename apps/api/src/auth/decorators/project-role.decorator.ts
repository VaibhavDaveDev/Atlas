import { SetMetadata } from "@nestjs/common";
import { ProjectRole } from "@atlas/database";

export const PROJECT_ROLE_KEY = "projectRole";

export const RequireProjectRole = (...roles: ProjectRole[]) =>
  SetMetadata(PROJECT_ROLE_KEY, roles);
