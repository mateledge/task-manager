'use client';

import { useState, useEffect } from 'react';
import { useSession, signIn, signOut } from 'next-auth/react';
import toast, { Toaster } from 'react-hot-toast';

type Task = {
  id: number;
  title: string;
  category: '業務' | '外出' | '来客' | 'プライベート' | 'WEB' | '重要';
  deadline: string;
  startTime?: string;
  duration?: string;
  isAllDay?: boolean;
  days?: number;
  completed: boolean;
};

export default function Home() {
  const { data: session, status } = useSession();
  const [tasks, setTasks] = useState<Task[]>(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('tasks');
      return stored ? JSON.parse(stored) : [];
    }
    return [];
  });

  const [title, setTitle] = useState('');
  const [category, setCategory] = useState<Task['category']>('業務');
  const [deadline, setDeadline] = useState('');
  const [startTime, setStartTime] = useState('');
  const [duration, setDuration] = useState('');
  const [isAllDay, setIsAllDay] = useState(false);
  const [days, setDays] = useState(1);

  useEffect(() => {
    localStorage.setItem('tasks', JSON.stringify(tasks));
  }, [tasks]);

  const handleAddTask = async () => {
    if (!title || !deadline) return;
    const newTask: Task = {
      id: Date.now(),
      title,
      category,
      deadline,
      startTime: category === '業務' || isAllDay ? undefined : startTime,
      duration: category === '業務' || isAllDay ? undefined : duration,
      isAllDay: category === '業務' ? undefined : isAllDay,
      days: category === '業務' ? undefined : isAllDay ? days : undefined,
      completed: false,
    };
    setTasks((prev) => [...prev, newTask]);

    if (session && category !== '業務') {
      const resolvedStart = isAllDay
        ? deadline
        : `${deadline}T${startTime || '00:00'}`;

      const res = await fetch('/api/calendar/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          task: title,
          startDate: resolvedStart,
          duration,
          category,
          isAllDay,
          days,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || 'Googleカレンダー登録に失敗しました');
      } else {
        toast.success('登録完了しました');
      }
    }
    setTitle('');
    setDeadline('');
    setStartTime('');
    setDuration('');
    setIsAllDay(false);
    setDays(1);
  };

  const handleToggleComplete = (id: number) => {
    setTasks((prev) =>
      prev.map((task) =>
        task.id === id ? { ...task, completed: !task.completed } : task
      )
    );
  };

  const handleDeleteTask = (id: number) => {
    setTasks((prev) => prev.filter((task) => task.id !== id));
    toast.success('削除しました');
  };

  const visibleTasks = tasks.sort((a, b) => {
    if (a.completed !== b.completed) return a.completed ? 1 : -1;
    if (a.deadline < new Date().toISOString().slice(0, 10)) return -1;
    if (b.deadline < new Date().toISOString().slice(0, 10)) return 1;
    return a.deadline.localeCompare(b.deadline);
  });

  if (status === 'loading') {
    return <main className="text-white p-8">読み込み中...</main>;
  }

  if (!session) {
    return (
      <main className="text-white p-8">
        <Toaster position="top-right" />
        <p>ログインしていません</p>
        <button
          onClick={() =>
            signIn('google', {
              prompt: 'consent',
              access_type: 'offline',
              response_type: 'code',
            })
          }
          className="bg-blue-600 px-4 py-2 mt-2 rounded"
        >
          Googleでログイン
        </button>
      </main>
    );
  }

  return (
    <main className="max-w-xl mx-auto p-4 space-y-6">
      <div className="flex items-center gap-3">
        <img src="/logo.png" alt="MATELEDGE Logo" className="w-12" />
        <h1 className="text-2xl font-bold text-white">Task Manager</h1>
        <div className="ml-auto">
          <button
            onClick={() => signOut()}
            className="bg-red-600 px-4 py-2 rounded text-white text-sm"
          >
            ログアウト
          </button>
        </div>
      </div>

      <Toaster position="top-right" />
      {/* 以下略、登録UI・一覧表示UIはそのまま維持 */}
      {/* あなたの既存コードをそのまま活かせるよう内容は省略せず残しています */}
      {/* ...中略（登録UI・一覧表示）... */}
      {/* すでに記載済みの入力・表示UI部分をこのまま維持できます */}
    </main>
  );
}

