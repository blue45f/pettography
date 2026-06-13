import { ForbiddenException, UnauthorizedException } from '@nestjs/common';
import { resetStateStoresForTest } from '../common/json-store';
import { AuthService } from './auth.service';

describe('AuthService', () => {
  let service: AuthService;

  beforeEach(() => {
    resetStateStoresForTest();
    service = new AuthService();
    service.onModuleInit();
  });

  it('registers, logs in, and authenticates active accounts', () => {
    const session = service.register({
      email: 'member@example.com',
      name: 'Member',
      password: 'password-1234',
    });

    expect(session.token).toBeTruthy();
    expect(session.account.email).toBe('member@example.com');
    expect(session.account.role).toBe('member');

    const login = service.login({
      email: 'member@example.com',
      password: 'password-1234',
    });
    expect(service.authenticateToken(login.token)?.id).toBe(session.account.id);
  });

  it('withdraws accounts, revokes sessions, anonymizes identity, and frees email', () => {
    const session = service.register({
      email: 'leave@example.com',
      name: 'Leave Me',
      password: 'password-1234',
    });

    const withdrawn = service.withdraw(session.account.id, { password: 'password-1234' });
    expect(withdrawn.status).toBe('withdrawn');
    expect(withdrawn.email).toContain('@withdrawn.pettography.local');
    expect(service.authenticateToken(session.token)).toBeNull();
    expect(() => service.login({ email: 'leave@example.com', password: 'password-1234' })).toThrow(
      UnauthorizedException,
    );

    const next = service.register({
      email: 'leave@example.com',
      name: 'New Owner',
      password: 'password-5678',
    });
    expect(next.account.email).toBe('leave@example.com');
  });

  it('prevents removing or demoting the last active admin', () => {
    const adminLogin = service.login({
      email: 'admin@pettography.local',
      password: 'admin-1234',
    });

    expect(() =>
      service.updateAccount(adminLogin.account.id, adminLogin.account.id, { role: 'member' }),
    ).toThrow(ForbiddenException);
    expect(() => service.removeAccount(adminLogin.account.id, adminLogin.account.id)).toThrow(
      ForbiddenException,
    );
  });
});
