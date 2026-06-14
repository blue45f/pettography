import { createParamDecorator, ExecutionContext, SetMetadata } from '@nestjs/common'
import type { AccountRole, PublicAccount } from '../common/types'

export const IS_PUBLIC_KEY = 'pettography:isPublic'
export const ROLES_KEY = 'pettography:roles'

export const Public = () => SetMetadata(IS_PUBLIC_KEY, true)
export const Roles = (...roles: AccountRole[]) => SetMetadata(ROLES_KEY, roles)

export const CurrentAccount = createParamDecorator(
  (_: unknown, context: ExecutionContext): PublicAccount | undefined => {
    const request = context.switchToHttp().getRequest<{ account?: PublicAccount }>()
    return request.account
  }
)
