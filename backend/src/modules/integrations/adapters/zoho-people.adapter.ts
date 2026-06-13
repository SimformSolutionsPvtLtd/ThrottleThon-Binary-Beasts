import { Injectable } from '@nestjs/common';
import axios from 'axios';
import { HRISAdapter, PersonSummary } from '../integration.adapter';

@Injectable()
export class ZohoPeopleAdapter implements HRISAdapter {
  readonly key = 'zoho-people';

  isConfigured(): boolean {
    return Boolean(process.env.ZOHO_PEOPLE_TOKEN);
  }

  async listPeople(): Promise<PersonSummary[]> {
    if (!this.isConfigured()) return [];
    const { data } = await axios.get('https://people.zoho.com/people/api/forms/employee/getRecords', {
      headers: { Authorization: `Zoho-oauthtoken ${process.env.ZOHO_PEOPLE_TOKEN}` },
    });
    const rows = (data as { response?: { result?: Record<string, unknown>[] } }).response?.result ?? [];
    return rows.map((row, i) => {
      const r = row as Record<string, { Department?: string; EmailID?: string; FirstName?: string; LastName?: string }>;
      const first = Object.values(r)[0] ?? {};
      return {
        id: String(i),
        name: `${first.FirstName ?? ''} ${first.LastName ?? ''}`.trim(),
        department: first.Department,
        email: first.EmailID,
      };
    });
  }
}
