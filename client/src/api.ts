import type { FeedingRecord, CreateRecordInput, PaginatedResponse, DailyStats } from './types';

const API_BASE = '/api';

export const api = {
  async getRecords(page: number = 1, pageSize: number = 10): Promise<PaginatedResponse<FeedingRecord>> {
    const res = await fetch(`${API_BASE}/records?page=${page}&pageSize=${pageSize}`);
    return res.json();
  },

  async getRecordsByDate(date: string): Promise<FeedingRecord[]> {
    const res = await fetch(`${API_BASE}/records?date=${date}`);
    const data = await res.json();
    return data.data;
  },

  async getStats(page: number = 1, pageSize: number = 7): Promise<PaginatedResponse<DailyStats>> {
    const res = await fetch(`${API_BASE}/stats?page=${page}&pageSize=${pageSize}`);
    return res.json();
  },

  async createRecord(input: CreateRecordInput): Promise<FeedingRecord> {
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

  async updateRecord(id: number, input: Partial<CreateRecordInput>): Promise<FeedingRecord> {
    const res = await fetch(`${API_BASE}/records/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(input),
    });
    return res.json();
  },
};
