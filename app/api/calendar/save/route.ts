import { google } from 'googleapis';
import { OAuth2Client } from 'google-auth-library';
import { NextRequest, NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt';

const CATEGORY_COLOR_MAP = {
  '外出': '11',
  '来客': '5',
  'プライベート': '10',
  'WEB': '3',
  '重要': '9',
};

export async function POST(req: NextRequest) {
  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });

  if (!token || !token.access_token) {
    return NextResponse.json({ error: '未認証です' }, { status: 401 });
  }

  const body = await req.text();
  let parsed: {
    task: string;
    startDate: string;
    duration?: string;
    category: keyof typeof CATEGORY_COLOR_MAP;
    isAllDay?: boolean;
    days?: number;
  };

  try {
    parsed = JSON.parse(body);
  } catch {
    return NextResponse.json({ error: '無効なJSON形式' }, { status: 400 });
  }

  const { task, startDate, duration, category, isAllDay, days } = parsed;

  if (!task || !startDate || !category) {
    return NextResponse.json({ error: 'パラメータ不足' }, { status: 400 });
  }

  const start = isAllDay
    ? new Date(startDate + 'T00:00:00')
    : new Date(startDate);

  const end = isAllDay
    ? new Date(new Date(start).setDate(start.getDate() + (Number(days) || 1)))
    : new Date(start.getTime() + parseDuration(duration));

  const oAuth2Client = new OAuth2Client();
  oAuth2Client.setCredentials({ access_token: token.access_token as string });

  const calendar = google.calendar({ version: 'v3', auth: oAuth2Client });

  const event = {
    summary: task,
    colorId: CATEGORY_COLOR_MAP[category] || '1',
    start: isAllDay
      ? { date: formatDate(start) }
      : { dateTime: formatLocalDateTime(start), timeZone: 'Asia/Tokyo' },
    end: isAllDay
      ? { date: formatDate(end) }
      : { dateTime: formatLocalDateTime(end), timeZone: 'Asia/Tokyo' },
  };

  try {
    await calendar.events.insert({ calendarId: 'primary', requestBody: event });
    return NextResponse.json({ message: 'Googleカレンダーに登録しました' });
  } catch (e) {
    console.error('Google Calendar API エラー:', e);
    return NextResponse.json({ error: 'カレンダー登録失敗' }, { status: 500 });
  }
}

function parseDuration(str?: string): number {
  if (!str || typeof str !== 'string' || !str.includes(':')) return 60 * 60 * 1000;
  const [h, m] = str.split(':').map(Number);
  return (h * 60 + m) * 60 * 1000;
}

function formatDate(date: Date): string {
  return date.toISOString().split('T')[0];
}

function formatLocalDateTime(date: Date): string {
  const pad = (n: number) => n.toString().padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}:00`;
}
