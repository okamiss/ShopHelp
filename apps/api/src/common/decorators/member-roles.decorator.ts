import { SetMetadata } from '@nestjs/common';
import { MemberRole } from '@prisma/client';

export const MEMBER_ROLES_KEY = 'memberRoles';
/** 限制商家内角色，如 @MemberRoles(MemberRole.OWNER) */
export const MemberRoles = (...roles: MemberRole[]) => SetMetadata(MEMBER_ROLES_KEY, roles);
