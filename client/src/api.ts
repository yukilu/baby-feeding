import type { Record, CreateRecordInput, PaginatedResponse, DailyStats } from './types';

const API_BASE = '/api';

export const api = {
  async getRecords(page: number = 1, pageSize: number = 10): Promise<PaginatedResponse<Record>> {
    const res = await fetch(`${API_BASE}/records?page=${page}&pageSize=${pageSize}`);
    return res.json();
  },

  async getStats(page: number = 1, pageSize: number = 7): Promise<PaginatedResponse<DailyStats>> {
    const res = await fetch(`${API_BASE}/stats?page=${page}&pageSize=${pageSize}`);
    return res.json();
  },

  async createRecord(input: CreateRecordInput): Promise<Record> {
    const res = await fetch(`${API_BASE}/records`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(input),
    });
    return res.json();
  },

  async deleteRecord(id: number): Promise<void> {
    await fetch(`${API_BASE}/records/${id}`, {
      method: 'DELETE',
    });
  },

  async updateRecord(id: number, input: Partial<CreateRecordInput>): Promise<Record> {
    const res = await fetch(`${API_BASE}/records/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(input),
    });
    return res.json();
  },
};
