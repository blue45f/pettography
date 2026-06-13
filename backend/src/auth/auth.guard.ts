import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common'
import { Reflector } from '@nestjs/core'
import type { AccountRole, PublicAccount } from '../common/types'
import { AuthService } from './auth.service'
import { IS_PUBLIC_KEY, ROLES_KEY } from './auth.decorators'

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(
    private readonly authService: AuthService,
    private readonly reflector: Reflector
  ) {}

  canActivate(context: ExecutionContext): boolean {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ])
    const requiredRoles =
      this.reflector.getAllAndOverride<AccountRole[]>(ROLES_KEY, [
        context.getHandler(),
        context.getClass(),
      ]) ?? []

    const request = context.switchToHttp().getRequest<{
      headers: { authorization?: string }
      account?: PublicAccount
    }>()
    const token = extractBearer(request.headers.authorization)
    if (!token) {
      if (isPublic) return true
      throw new UnauthorizedException('Bearer token is required.')
    }

    const account = this.authService.authenticateToken(token)
    if (!account) {
      if (isPublic) return true
      throw new UnauthorizedException('Session is invalid or expired.')
    }
    request.account = account

    if (requiredRoles.length > 0 && !requiredRoles.includes(account.role)) {
      throw new ForbiddenException('Insufficient account role.')
    }
    return true
  }
}

function extractBearer(header: string | undefined): string | null {
  if (!header) return null
  const [scheme, token] = header.split(' ')
  return scheme?.toLowerCase() === 'bearer' && token ? token.trim() : null
}
