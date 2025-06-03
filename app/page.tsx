'use client';

import { useState, useEffect } from 'react';
import { useSession, signIn, signOut } from 'next-auth/react';
import toast, { Toaster } from 'react-hot-toast';

type Task = {
  id: number;
  title: string;
  category: '業務' | 'メモ' | '外出' | '来客' | 'WEB' | 'NKE' | '重要' | 'PB';
  deadline: string;
  startTime?: string;
  duration?: string;
  isAllDay?: boolean;
  days?: number;
  completed: boolean;
};

type Memo = {
  id: number;
  title: string;
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

  const [memos, setMemos] = useState<Memo[]>(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('memos');
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
  const [showForm, setShowForm] = useState(false);
  useEffect(() => {
    localStorage.setItem('tasks', JSON.stringify(tasks));
  }, [tasks]);

  useEffect(() => {
    localStorage.setItem('memos', JSON.stringify(memos));
  }, [memos]);

  const handleAddTask = async () => {
    if (!title) return;

    if (category === 'メモ') {
      const newMemo: Memo = {
        id: Date.now(),
        title,
      };
      const updatedMemos = [...memos, newMemo];
      setMemos(updatedMemos);
      localStorage.setItem('backupMemos', JSON.stringify(updatedMemos));
      setTitle('');
      return;
    }

    if (!deadline) return;

    const isSpecialCategory = ['業務', 'メモ'].includes(category);

    const newTask: Task = {
      id: Date.now(),
      title,
      category,
      deadline,
      startTime: category === '業務' || isAllDay ? undefined : startTime,
      duration: category === '業務' || isAllDay ? undefined : duration,
      isAllDay: isSpecialCategory ? undefined : isAllDay,
      days: isSpecialCategory ? undefined : isAllDay ? days : undefined,
      completed: false,
    };

    const updatedTasks = [...tasks, newTask];
    setTasks(updatedTasks);
    localStorage.setItem('backupTasks', JSON.stringify(updatedTasks));

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
    setShowForm(false);
  };

  const handleDeleteTask = (id: number) => {
    setTasks((prev) => prev.filter((task) => task.id !== id));
    toast.success('完全削除しました');
  };

  const handleDeleteMemo = (id: number) => {
    setMemos((prev) => prev.filter((memo) => memo.id !== id));
    toast.success('完全削除しました');
  };

  const handleRestoreBackup = () => {
    const taskBackup = localStorage.getItem('backupTasks');
    const memoBackup = localStorage.getItem('backupMemos');

    if (taskBackup) {
      try {
        const parsed = JSON.parse(taskBackup);
        if (Array.isArray(parsed)) setTasks(parsed);
      } catch {
        toast.error('タスク復元に失敗しました');
      }
    }

    if (memoBackup) {
      try {
        const parsed = JSON.parse(memoBackup);
        if (Array.isArray(parsed)) setMemos(parsed);
      } catch {
        toast.error('メモ復元に失敗しました');
      }
    }

    toast.success('データ復元しました');
  };
  const handleToggleComplete = (id: number) => {
    setTasks((prev) =>
      prev.map((task) =>
        task.id === id ? { ...task, completed: !task.completed } : task
      )
    );
  };

  const visibleTasks = tasks
    .filter((task) => task.category === '業務')
    .sort((a, b) => {
      if (a.completed !== b.completed) return a.completed ? 1 : -1;
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
    <>
      {/* 固定ヘッダー */}
      <div className="fixed top-0 left-0 right-0 z-50 bg-gray-800 flex justify-between items-center px-4 py-3 shadow-md">
        <div className="flex items-center gap-3">
          <img src="/logo.png" alt="MATELEDGE Logo" className="w-12" />
          <h1 className="text-2xl font-bold text-white">Task Manager</h1>
        </div>
        <button
          onClick={() => signOut()}
          className="bg-red-600 px-4 py-2 rounded text-white text-sm"
        >
          ログアウト
        </button>
      </div>

      <main className="max-w-7xl mx-auto p-4 text-white space-y-4 mt-20">
        {/* 🔁 以下に Part 2 で送信済みの UI（フォーム・一覧）を挿入 */}
      </main>
    </>
  );
}
