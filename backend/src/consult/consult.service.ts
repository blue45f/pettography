import { Injectable, NotFoundException } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { VETS_SEED, VET_MESSAGES_SEED } from '../data/vets.seed';
import type { Vet, VetMessage, VetMessageRole } from '../common/types';

@Injectable()
export class ConsultService {
  private readonly vets: Vet[] = [...VETS_SEED];
  private readonly threads = new Map<string, VetMessage[]>(
    Object.entries(VET_MESSAGES_SEED).map(([k, v]) => [k, [...v]]),
  );

  listVets(): Vet[] {
    return this.vets;
  }

  findVet(vetId: string): Vet {
    const vet = this.vets.find((v) => v.id === vetId);
    if (!vet) throw new NotFoundException(`Vet not found: ${vetId}`);
    return vet;
  }

  listMessages(vetId: string): VetMessage[] {
    this.findVet(vetId);
    return this.threads.get(vetId) ?? [];
  }

  appendMessage(vetId: string, role: VetMessageRole, body: string): VetMessage {
    this.findVet(vetId);
    const message: VetMessage = {
      id: randomUUID(),
      vetId,
      role,
      body,
      createdAt: new Date().toISOString(),
    };
    const list = this.threads.get(vetId) ?? [];
    this.threads.set(vetId, [...list, message]);
    return message;
  }

  buildAutoReply(vetId: string): string {
    const vet = this.findVet(vetId);
    return `[${vet.name}] 메시지 잘 받았습니다. 사진 한 장과 사육 환경(온도·습도)을 알려주시면 1차 답변 드리겠습니다.`;
  }

  /**
   * Appends the vet auto-reply after the same delay the gateway uses. REST
   * pollers pick it up on their next tick. `unref()` keeps the timer from
   * holding the process (or Jest) open.
   */
  scheduleAutoReply(vetId: string, delayMs = 700): void {
    this.findVet(vetId);
    const timer = setTimeout(() => {
      this.appendMessage(vetId, 'vet', this.buildAutoReply(vetId));
    }, delayMs);
    timer.unref?.();
  }
}
