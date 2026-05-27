import { UsePipes, ValidationPipe } from '@nestjs/common';
import {
  ConnectedSocket,
  MessageBody,
  OnGatewayConnection,
  OnGatewayDisconnect,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import type { Server, Socket } from 'socket.io';
import { ConsultService } from './consult.service';
import { JoinRoomDto } from './dto/join-room.dto';
import { SendMessageDto } from './dto/send-message.dto';
import type { Vet, VetMessage } from '../common/types';

const AUTO_REPLY_DELAY_MS = 700;

@WebSocketGateway({
  namespace: '/consult',
  cors: {
    origin: ['http://localhost:5173'],
    credentials: true,
  },
})
@UsePipes(new ValidationPipe({ whitelist: true, transform: true }))
export class ConsultGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server!: Server;

  constructor(private readonly consultService: ConsultService) {}

  handleConnection(client: Socket): void {
    client.emit('consult:vets', this.consultService.listVets());
  }

  handleDisconnect(): void {
    // no-op: rooms clean up automatically
  }

  @SubscribeMessage('consult:join')
  handleJoin(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: JoinRoomDto,
  ): { vet: Vet; messages: VetMessage[] } {
    const vet = this.consultService.findVet(payload.vetId);
    void client.join(this.roomOf(vet.id));
    return { vet, messages: this.consultService.listMessages(vet.id) };
  }

  @SubscribeMessage('consult:leave')
  handleLeave(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: JoinRoomDto,
  ): { ok: true } {
    void client.leave(this.roomOf(payload.vetId));
    return { ok: true };
  }

  @SubscribeMessage('consult:send')
  handleSend(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: SendMessageDto,
  ): VetMessage {
    const userMessage = this.consultService.appendMessage(payload.vetId, 'user', payload.body);
    const room = this.roomOf(payload.vetId);
    void client.join(room);
    this.server.to(room).emit('consult:message', userMessage);

    setTimeout(() => {
      const reply = this.consultService.appendMessage(
        payload.vetId,
        'vet',
        this.consultService.buildAutoReply(payload.vetId),
      );
      this.server.to(room).emit('consult:message', reply);
    }, AUTO_REPLY_DELAY_MS);

    return userMessage;
  }

  private roomOf(vetId: string): string {
    return `consult:${vetId}`;
  }
}
