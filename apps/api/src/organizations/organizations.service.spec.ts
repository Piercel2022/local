import {
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Organization } from './organization.entity.js';
import { OrganizationsService } from './organizations.service.js';

describe('OrganizationsService', () => {
  let service: OrganizationsService;
  let repository: {
    create: ReturnType<typeof vi.fn>;
    save: ReturnType<typeof vi.fn>;
    find: ReturnType<typeof vi.fn>;
    findOneBy: ReturnType<typeof vi.fn>;
    remove: ReturnType<typeof vi.fn>;
  };

  beforeEach(async () => {
    repository = {
      create: vi.fn(),
      save: vi.fn(),
      find: vi.fn(),
      findOneBy: vi.fn(),
      remove: vi.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        OrganizationsService,
        {
          provide: getRepositoryToken(Organization),
          useValue: repository,
        },
      ],
    }).compile();

    service = module.get<OrganizationsService>(OrganizationsService);
  });

  it('creates an organization', async () => {
    const dto = { name: 'LocalPilot Demo', slug: 'localpilot-demo' };
    const organization = { id: 'org-id', ...dto };

    repository.create.mockReturnValue(organization);
    repository.save.mockResolvedValue(organization);

    await expect(service.create(dto)).resolves.toEqual(organization);
    expect(repository.create).toHaveBeenCalledWith(dto);
  });

  it('rejects a duplicate slug', async () => {
    const duplicateError = Object.assign(new Error('duplicate'), {
      driverError: { code: '23505' },
    });
    repository.create.mockReturnValue({});
    repository.save.mockRejectedValue(duplicateError);

    await expect(
      service.create({ name: 'Duplicate', slug: 'existing-slug' }),
    ).rejects.toBeInstanceOf(ConflictException);
  });

  it('lists organizations by creation date descending', async () => {
    repository.find.mockResolvedValue([]);

    await expect(service.findAll()).resolves.toEqual([]);
    expect(repository.find).toHaveBeenCalledWith({
      order: { createdAt: 'DESC' },
    });
  });

  it('returns an organization by id', async () => {
    const organization = { id: 'org-id', name: 'Demo', slug: 'demo' };
    repository.findOneBy.mockResolvedValue(organization);

    await expect(service.findOne('org-id')).resolves.toEqual(organization);
  });

  it('throws when the organization does not exist', async () => {
    repository.findOneBy.mockResolvedValue(null);

    await expect(service.findOne('missing-id')).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });

  it('updates an organization', async () => {
    const organization = {
      id: 'org-id',
      name: 'Old name',
      slug: 'old-name',
    };
    repository.findOneBy.mockResolvedValue(organization);
    repository.save.mockImplementation(async (entity) => entity);

    await expect(
      service.update('org-id', { name: 'New name' }),
    ).resolves.toMatchObject({ name: 'New name' });
  });

  it('rejects an empty update', async () => {
    await expect(service.update('org-id', {})).rejects.toBeInstanceOf(
      Error,
    );
  });

  it('deletes an organization', async () => {
    const organization = { id: 'org-id', name: 'Demo', slug: 'demo' };
    repository.findOneBy.mockResolvedValue(organization);
    repository.remove.mockResolvedValue(organization);

    await expect(service.remove('org-id')).resolves.toEqual({
      id: 'org-id',
      deleted: true,
    });
    expect(repository.remove).toHaveBeenCalledWith(organization);
  });
});
