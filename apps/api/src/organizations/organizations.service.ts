import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Organization } from './organization.entity.js';
import { CreateOrganizationDto } from './dto/create-organization.dto.js';
import { UpdateOrganizationDto } from './dto/update-organization.dto.js';

function isUniqueViolation(error: unknown): boolean {
  if (typeof error !== 'object' || error === null) {
    return false;
  }

  const candidate = error as {
    code?: string;
    driverError?: { code?: string };
  };

  return candidate.driverError?.code === '23505' ||
    candidate.code === '23505';
}

@Injectable()
export class OrganizationsService {
  constructor(
    @InjectRepository(Organization)
    private readonly repository: Repository<Organization>,
  ) {}

  async create(dto: CreateOrganizationDto): Promise<Organization> {
    try {
      return await this.repository.save(this.repository.create(dto));
    } catch (error) {
      if (isUniqueViolation(error)) {
        throw new ConflictException('An organization with this slug already exists');
      }
      throw error;
    }
  }

  findAll(): Promise<Organization[]> {
    return this.repository.find({ order: { createdAt: 'DESC' } });
  }

  async findOne(id: string): Promise<Organization> {
    const organization = await this.repository.findOneBy({ id });

    if (!organization) {
      throw new NotFoundException('Organization not found');
    }

    return organization;
  }

  async update(
    id: string,
    dto: UpdateOrganizationDto,
  ): Promise<Organization> {
    if (Object.keys(dto).length === 0) {
      throw new BadRequestException('At least one field must be provided');
    }

    const organization = await this.findOne(id);
    Object.assign(organization, dto);

    try {
      return await this.repository.save(organization);
    } catch (error) {
      if (isUniqueViolation(error)) {
        throw new ConflictException('An organization with this slug already exists');
      }
      throw error;
    }
  }

  async remove(id: string): Promise<{ id: string; deleted: true }> {
    const organization = await this.findOne(id);
    await this.repository.remove(organization);

    return { id, deleted: true };
  }
}
