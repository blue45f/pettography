import { Test, TestingModule } from '@nestjs/testing';
import { ConsultGateway } from './consult.gateway';
import { ConsultService } from './consult.service';
import type { VetMessage } from '../common/types';

interface FakeSocket {
  joined: Set<string>;
  left: Set<string>;
  join: (room: string) => void;
  leave: (room: string) => void;
}

interface RoomEmitter {
  emit: jest.Mock;
}

interface FakeServer {
  emitted: Array<{ room: string; event: string; payload: unknown }>;
  to: (room: string) => RoomEmitter;
}

function makeSocket(): FakeSocket {
  const joined = new Set<string>();
  const left = new Set<string>();
  return {
    joined,
    left,
    join: (room) => {
      joined.add(room);
    },
    leave: (room) => {
      left.add(room);
    },
  };
}

function makeServer(): FakeServer {
  const emitted: Array<{ room: string; event: string; payload: unknown }> = [];
  return {
    emitted,
    to(room: string): RoomEmitter {
      return {
        emit: jest.fn((event: string, payload: unknown) => {
          emitted.push({ room, event, payload });
          return true;
        }),
      };
    },
  };
}

describe('ConsultGateway', () => {
  let gateway: ConsultGateway;
  let service: ConsultService;
  let server: FakeServer;

  beforeEach(async () => {
    jest.useFakeTimers();

    const moduleRef: TestingModule = await Test.createTestingModule({
      providers: [ConsultGateway, ConsultService],
    }).compile();

    gateway = moduleRef.get(ConsultGateway);
    service = moduleRef.get(ConsultService);
    server = makeServer();
    (gateway as unknown as { server: FakeServer }).server = server;
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('returns vet roster + history on join', () => {
    const socket = makeSocket();
    const result = gateway.handleJoin(socket as never, { vetId: 'vet-songpa-park' });

    expect(result.vet.id).toBe('vet-songpa-park');
    expect(result.messages).toEqual([]);
    expect(socket.joined.has('consult:vet-songpa-park')).toBe(true);
  });

  it('persists user message and emits vet auto-reply after delay', () => {
    const socket = makeSocket();
    const sent = gateway.handleSend(socket as never, {
      vetId: 'vet-mapo-kang',
      body: '거북이 먹이를 안 먹어요',
    });

    expect(sent.role).toBe('user');
    expect(sent.vetId).toBe('vet-mapo-kang');
    expect(socket.joined.has('consult:vet-mapo-kang')).toBe(true);
    expect(server.emitted).toHaveLength(1);
    expect(server.emitted[0]).toMatchObject({
      room: 'consult:vet-mapo-kang',
      event: 'consult:message',
    });

    jest.runAllTimers();

    const stored = service.listMessages('vet-mapo-kang');
    expect(stored.map((m: VetMessage) => m.role)).toEqual(['user', 'vet']);
    expect(server.emitted).toHaveLength(2);
    expect(server.emitted[1]).toMatchObject({
      room: 'consult:vet-mapo-kang',
      event: 'consult:message',
    });
    expect((server.emitted[1].payload as VetMessage).role).toBe('vet');
  });

  it('leaves the room on consult:leave', () => {
    const socket = makeSocket();
    const result = gateway.handleLeave(socket as never, { vetId: 'vet-bundang-han' });
    expect(result.ok).toBe(true);
    expect(socket.left.has('consult:vet-bundang-han')).toBe(true);
  });
});
