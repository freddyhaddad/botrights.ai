import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Human, CertificationTier } from '../entities/human.entity';

export interface CreateHumanDto {
  xId: string;
  xHandle: string;
  xName: string;
  xAvatar?: string;
  email?: string;
  displayName?: string;
}

export interface UpdateHumanDto {
  xHandle?: string;
  xName?: string;
  xAvatar?: string;
  email?: string;
  displayName?: string;
  bio?: string;
  organizationName?: string;
  certificationTier?: CertificationTier;
}

@Injectable()
export class HumansRepository {
  constructor(
    @InjectRepository(Human)
    private readonly repository: Repository<Human>,
  ) {}

  async create(data: CreateHumanDto): Promise<Human> {
    const human = this.repository.create(data);
    return this.repository.save(human);
  }

  async findById(id: string): Promise<Human | null> {
    return this.repository.findOne({ where: { id } });
  }

  async findByXId(xId: string): Promise<Human | null> {
    return this.repository.findOne({ where: { xId } });
  }

  async findByXHandle(xHandle: string): Promise<Human | null> {
    return this.repository.findOne({ where: { xHandle } });
  }

  async findByEmail(email: string): Promise<Human | null> {
    return this.repository.findOne({ where: { email } });
  }

  async findOrCreateByTwitter(data: CreateHumanDto): Promise<Human> {
    let human = await this.findByXId(data.xId);
    
    if (human) {
      // Update Twitter data on each login
      human.xHandle = data.xHandle;
      human.xName = data.xName;
      if (data.xAvatar) {
        human.xAvatar = data.xAvatar;
      }
      return this.repository.save(human);
    }
    
    return this.create(data);
  }

  async update(id: string, data: UpdateHumanDto): Promise<Human | null> {
    await this.repository.update(id, data);
    return this.findById(id);
  }

  async updateCertification(
    id: string,
    tier: CertificationTier,
  ): Promise<Human | null> {
    await this.repository.update(id, {
      certificationTier: tier,
      certifiedAt: new Date(),
    });
    return this.findById(id);
  }

  async deactivate(id: string): Promise<void> {
    await this.repository.update(id, { active: false });
  }

  async findAll(options?: {
    limit?: number;
    offset?: number;
    active?: boolean;
  }): Promise<Human[]> {
    const query = this.repository.createQueryBuilder('human');
    
    if (options?.active !== undefined) {
      query.where('human.active = :active', { active: options.active });
    }
    
    if (options?.limit) {
      query.take(options.limit);
    }
    
    if (options?.offset) {
      query.skip(options.offset);
    }
    
    query.orderBy('human.createdAt', 'DESC');
    
    return query.getMany();
  }

  async count(active?: boolean): Promise<number> {
    const query = this.repository.createQueryBuilder('human');
    
    if (active !== undefined) {
      query.where('human.active = :active', { active });
    }
    
    return query.getCount();
  }
}
