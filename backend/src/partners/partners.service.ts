import { Injectable, NotFoundException } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { PARTNERS_SEED } from '../data/partners.seed';
import type { PartnerApplication } from '../common/types';
import type { QueryPartnersDto } from './dto/query-partners.dto';
import type { CreatePartnerDto } from './dto/create-partner.dto';
import type { UpdatePartnerStatusDto } from './dto/update-partner-status.dto';

@Injectable()
export class PartnersService {
  private applications: PartnerApplication[] = [...PARTNERS_SEED];

  findAll(query: QueryPartnersDto): PartnerApplication[] {
    const { status } = query;
    if (!status) return this.applications;
    return this.applications.filter((a) => a.status === status);
  }

  create(input: CreatePartnerDto): PartnerApplication {
    const application: PartnerApplication = {
      id: randomUUID(),
      kind: input.kind,
      name: input.name,
      contact: input.contact,
      region: input.region,
      description: input.description,
      url: input.url ?? null,
      status: 'pending',
      createdAt: new Date().toISOString(),
    };
    this.applications = [application, ...this.applications];
    return application;
  }

  updateStatus(id: string, dto: UpdatePartnerStatusDto): PartnerApplication {
    const target = this.applications.find((a) => a.id === id);
    if (!target) {
      throw new NotFoundException(`Partner application not found: ${id}`);
    }
    const updated: PartnerApplication = { ...target, status: dto.status };
    this.applications = this.applications.map((a) => (a.id === id ? updated : a));
    return updated;
  }

  remove(id: string): void {
    const exists = this.applications.some((a) => a.id === id);
    if (!exists) {
      throw new NotFoundException(`Partner application not found: ${id}`);
    }
    this.applications = this.applications.filter((a) => a.id !== id);
  }
}
