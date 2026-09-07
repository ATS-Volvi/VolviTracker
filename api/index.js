// Vercel Serverless Function Entry Point for /api/*
import { apiHandler } from '../server/api.js';

export default async function handler(req, res) {
  return apiHandler(req, res);
}
