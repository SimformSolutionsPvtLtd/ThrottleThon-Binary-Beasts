import { Injectable } from '@nestjs/common';
import axios from 'axios';
import { HRISAdapter, PersonSummary } from '../integration.adapter';

@Injectable()
export class WorkdayAdapter implements HRISAdapter {
  readonly key = 'workday';

  isConfigured(): boolean {
    return Boolean(process.env.WORKDAY_TENANT && process.env.WORKDAY_TOKEN);
  }

  async listPeople(): Promise<PersonSummary[]> {
    if (!this.isConfigured()) return [];
    const url = `https://wd2-impl-services1.workday.com/ccx/api/v1/${process.env.WORKDAY_TENANT}/workers`;
    const { data } = await axios.get(url, {
      headers: { Authorization: `Bearer ${process.env.WORKDAY_TOKEN}` },
    });
    return ((data as { workers: Array<{ id: string; descriptor: string; primaryEmail: string; department?: string }> }).workers ?? []).map((w) => ({
      id: w.id,
      name: w.descriptor,
      department: w.department,
      email: w.primaryEmail,
    }));
  }
}
