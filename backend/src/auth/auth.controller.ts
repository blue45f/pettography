import {
  Body,
  Controller,
  Delete,
  Get,
  Headers,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common'
import type { AuditLog, PublicAccount } from '../common/types'
import { AuthGuard } from './auth.guard'
import { CurrentAccount, Public, Roles } from './auth.decorators'
import { AuthService } from './auth.service'
import { AdminUpdateAccountDto } from './dto/admin-account.dto'
import { LoginDto, RegisterDto, UpdateProfileDto, WithdrawAccountDto } from './dto/auth.dto'

@Controller('auth')
@UseGuards(AuthGuard)
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Public()
  @Post('register')
  register(@Body() body: RegisterDto) {
    return this.authService.register(body)
  }

  @Public()
  @Post('login')
  @HttpCode(HttpStatus.OK)
  login(@Body() body: LoginDto) {
    return this.authService.login(body)
  }

  @Post('logout')
  @HttpCode(HttpStatus.OK)
  logout(@Headers('authorization') authorization?: string): { ok: true } {
    const token = authorization?.replace(/^bearer\s+/i, '').trim()
    if (token) this.authService.logout(token)
    return { ok: true }
  }

  @Get('me')
  me(@CurrentAccount() account: PublicAccount): PublicAccount {
    return account
  }

  @Patch('me')
  updateMe(
    @CurrentAccount() account: PublicAccount,
    @Body() body: UpdateProfileDto
  ): PublicAccount {
    return this.authService.updateProfile(account.id, body)
  }

  @Delete('me')
  @HttpCode(HttpStatus.OK)
  withdrawMe(
    @CurrentAccount() account: PublicAccount,
    @Body() body: WithdrawAccountDto
  ): PublicAccount {
    return this.authService.withdraw(account.id, body)
  }

  @Get('admin/accounts')
  @Roles('admin')
  listAccounts(): PublicAccount[] {
    return this.authService.listAccounts()
  }

  @Patch('admin/accounts/:id')
  @Roles('admin')
  updateAccount(
    @CurrentAccount() actor: PublicAccount,
    @Param('id') id: string,
    @Body() body: AdminUpdateAccountDto
  ): PublicAccount {
    return this.authService.updateAccount(actor.id, id, body)
  }

  @Delete('admin/accounts/:id')
  @Roles('admin')
  @HttpCode(HttpStatus.NO_CONTENT)
  removeAccount(@CurrentAccount() actor: PublicAccount, @Param('id') id: string): void {
    this.authService.removeAccount(actor.id, id)
  }

  @Get('admin/audit-logs')
  @Roles('admin')
  auditLogs(): AuditLog[] {
    return this.authService.getAuditLogs()
  }
}
