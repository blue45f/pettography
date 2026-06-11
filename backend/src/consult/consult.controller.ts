import { Body, Controller, Get, HttpCode, HttpStatus, Param, Post } from '@nestjs/common';
import { ConsultService } from './consult.service';
import { PostMessageDto } from './dto/post-message.dto';
import type { Vet, VetMessage } from '../common/types';

@Controller('consult')
export class ConsultController {
  constructor(private readonly consultService: ConsultService) {}

  @Get('vets')
  listVets(): Vet[] {
    return this.consultService.listVets();
  }

  @Get('vets/:id')
  getVet(@Param('id') id: string): Vet {
    return this.consultService.findVet(id);
  }

  @Get('vets/:id/messages')
  listMessages(@Param('id') id: string): VetMessage[] {
    return this.consultService.listMessages(id);
  }

  /**
   * REST companion to the socket.io gateway so clients without
   * socket.io-client (the web app polls) can hold a consult thread. The vet
   * auto-reply is scheduled exactly like the gateway flow and gets picked up
   * by the next poll.
   */
  @Post('vets/:id/messages')
  @HttpCode(HttpStatus.CREATED)
  createMessage(@Param('id') id: string, @Body() dto: PostMessageDto): VetMessage {
    const message = this.consultService.appendMessage(id, 'user', dto.body);
    this.consultService.scheduleAutoReply(id);
    return message;
  }
}
