import { Global, Injectable } from '@nestjs/common';
import { PrismaService } from '../../infrastructure/prisma/prisma.service';

const EMAIL_REGEX = /[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}/g;
const SALARY_REGEX = /\b(?:salary|compensation|pay|ctc|lpa|lakh)[^a-z0-9]*[\d,]+(?:\.\d+)?\b/gi;

export interface SanitiseReport {
  fieldsChecked: number;
  piiFound: number;
  piiReplaced: number;
  clean: boolean;
}

export interface SanitiseResult {
  sanitisedPayload: unknown;
  report: SanitiseReport;
}

@Global()
@Injectable()
export class PiiSanitiserService {
  constructor(private readonly prisma: PrismaService) {}

  async sanitise(payload: unknown, tenantId: string): Promise<SanitiseResult> {
    const pseudonymMaps = await this.prisma.pseudonymMap.findMany({
      where: { tenantId },
      select: { realName: true, pseudonym: true, email: true },
    });

    const report: SanitiseReport = { fieldsChecked: 0, piiFound: 0, piiReplaced: 0, clean: true };
    const sanitisedPayload = this.processValue(payload, pseudonymMaps, report);
    report.clean = report.piiFound === 0;

    return { sanitisedPayload, report };
  }

  private processValue(
    value: unknown,
    maps: { realName: string; pseudonym: string; email: string }[],
    report: SanitiseReport,
  ): unknown {
    if (value === null || value === undefined) return value;

    if (typeof value === 'string') {
      report.fieldsChecked++;
      return this.sanitiseString(value, maps, report);
    }

    if (Array.isArray(value)) {
      return value.map((item) => this.processValue(item, maps, report));
    }

    if (typeof value === 'object') {
      const result: Record<string, unknown> = {};
      for (const [k, v] of Object.entries(value as Record<string, unknown>)) {
        result[k] = this.processValue(v, maps, report);
      }
      return result;
    }

    return value;
  }

  private sanitiseString(
    str: string,
    maps: { realName: string; pseudonym: string; email: string }[],
    report: SanitiseReport,
  ): string {
    let result = str;

    // Replace real names with pseudonyms
    for (const { realName, pseudonym } of maps) {
      if (result.toLowerCase().includes(realName.toLowerCase())) {
        report.piiFound++;
        result = result.replace(new RegExp(realName, 'gi'), pseudonym);
        report.piiReplaced++;
      }
    }

    // Replace emails from pseudonymMap
    for (const { email, pseudonym } of maps) {
      if (result.toLowerCase().includes(email.toLowerCase())) {
        report.piiFound++;
        result = result.replace(new RegExp(email.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi'), `[email:${pseudonym}]`);
        report.piiReplaced++;
      }
    }

    // Replace any remaining email patterns
    const emailMatches = result.match(EMAIL_REGEX);
    if (emailMatches) {
      report.piiFound += emailMatches.length;
      result = result.replace(EMAIL_REGEX, '[REDACTED_EMAIL]');
      report.piiReplaced += emailMatches.length;
    }

    // Replace salary patterns
    const salaryMatches = result.match(SALARY_REGEX);
    if (salaryMatches) {
      report.piiFound += salaryMatches.length;
      result = result.replace(SALARY_REGEX, '[REDACTED_SALARY]');
      report.piiReplaced += salaryMatches.length;
    }

    return result;
  }
}
