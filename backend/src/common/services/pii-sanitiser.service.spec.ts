import { Test, TestingModule } from '@nestjs/testing';
import { PiiSanitiserService } from './pii-sanitiser.service';
import { PrismaService } from '../../infrastructure/prisma/prisma.service';

const TENANT_ID = 'test-tenant-1';

const PSEUDONYM_MAPS = [
  { realName: 'Alice Johnson', pseudonym: 'Falcon-7', email: 'alice.johnson@company.com' },
  { realName: 'Bob Smith', pseudonym: 'Raven-3', email: 'bob.smith@company.com' },
];

const mockPrisma = {
  pseudonymMap: {
    findMany: jest.fn().mockResolvedValue(PSEUDONYM_MAPS),
  },
};

describe('PiiSanitiserService', () => {
  let service: PiiSanitiserService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PiiSanitiserService,
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();

    service = module.get<PiiSanitiserService>(PiiSanitiserService);
    jest.clearAllMocks();
    mockPrisma.pseudonymMap.findMany.mockResolvedValue(PSEUDONYM_MAPS);
  });

  it('replaces a real name with its pseudonym', async () => {
    const payload = { author: 'Alice Johnson', comment: 'reviewed by Bob Smith' };
    const { sanitisedPayload, report } = await service.sanitise(payload, TENANT_ID);
    const result = sanitisedPayload as typeof payload;
    expect(result.author).toBe('Falcon-7');
    expect(result.comment).toBe('reviewed by Raven-3');
    expect(report.piiFound).toBeGreaterThanOrEqual(2);
    expect(report.piiReplaced).toBeGreaterThanOrEqual(2);
    expect(report.clean).toBe(false);
  });

  it('strips emails from pseudonymMap', async () => {
    const payload = { contact: 'reach alice.johnson@company.com for details' };
    const { sanitisedPayload, report } = await service.sanitise(payload, TENANT_ID);
    const result = sanitisedPayload as typeof payload;
    expect(result.contact).not.toContain('alice.johnson@company.com');
    expect(report.piiFound).toBeGreaterThan(0);
    expect(report.clean).toBe(false);
  });

  it('strips arbitrary email addresses not in pseudonymMap', async () => {
    const payload = { note: 'contact support@external.io for help' };
    const { sanitisedPayload, report } = await service.sanitise(payload, TENANT_ID);
    const result = sanitisedPayload as typeof payload;
    expect(result.note).toContain('[REDACTED_EMAIL]');
    expect(result.note).not.toContain('support@external.io');
    expect(report.piiFound).toBeGreaterThan(0);
  });

  it('returns clean=true for objects with no PII', async () => {
    const payload = { status: 'active', score: 42, tags: ['backend', 'api'] };
    const { sanitisedPayload, report } = await service.sanitise(payload, TENANT_ID);
    expect(report.clean).toBe(true);
    expect(report.piiFound).toBe(0);
    expect(report.piiReplaced).toBe(0);
    expect(sanitisedPayload).toEqual(payload);
  });

  it('handles nested objects', async () => {
    const payload = {
      ticket: {
        assignee: 'Alice Johnson',
        metadata: { reviewer: 'Bob Smith', priority: 'high' },
      },
    };
    const { sanitisedPayload } = await service.sanitise(payload, TENANT_ID);
    const result = sanitisedPayload as typeof payload;
    expect(result.ticket.assignee).toBe('Falcon-7');
    expect(result.ticket.metadata.reviewer).toBe('Raven-3');
  });

  it('handles arrays of strings', async () => {
    const payload = { reviewers: ['Alice Johnson', 'unknown-dev', 'Bob Smith'] };
    const { sanitisedPayload } = await service.sanitise(payload, TENANT_ID);
    const result = sanitisedPayload as typeof payload;
    expect(result.reviewers[0]).toBe('Falcon-7');
    expect(result.reviewers[1]).toBe('unknown-dev');
    expect(result.reviewers[2]).toBe('Raven-3');
  });

  it('increments fieldsChecked correctly', async () => {
    const payload = { a: 'hello', b: 'world', c: 42 };
    const { report } = await service.sanitise(payload, TENANT_ID);
    expect(report.fieldsChecked).toBe(2); // only strings are checked
  });
});
