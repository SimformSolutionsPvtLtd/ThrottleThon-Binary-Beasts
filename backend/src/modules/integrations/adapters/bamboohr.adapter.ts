import { Injectable } from '@nestjs/common';
import axios from 'axios';
import { HRISAdapter, PersonSummary } from '../integration.adapter';

@Injectable()
export class BambooHRAdapter implements HRISAdapter {
  readonly key = 'bamboohr';

  isConfigured(): boolean {
    return Boolean(process.env.BAMBOOHR_API_KEY && process.env.BAMBOOHR_SUBDOMAIN);
  }

  async listPeople(): Promise<PersonSummary[]> {
    if (!this.isConfigured()) return [];
    const url = `https://api.bamboohr.com/api/gateway.php/${process.env.BAMBOOHR_SUBDOMAIN}/v1/employees/directory`;
    const { data } = await axios.get(url, {
      headers: { Accept: 'application/json' },
      auth: { username: process.env.BAMBOOHR_API_KEY ?? '', password: 'x' },
    });
    return ((data as { employees: Array<{ id: string; displayName: string; department: string; workEmail: string }> }).employees ?? []).map((e) => ({
      id: e.id,
      name: e.displayName,
      department: e.department,
      email: e.workEmail,
    }));
  }
}
