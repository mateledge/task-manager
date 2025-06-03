
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

  const handleAddTask = async () => {
    if (!title) return;

    if (category === 'メモ') {
      const newMemo: Memo = { id: Date.now(), title };
      const updated = [...memos, newMemo];
      setMemos(updated);
      localStorage.setItem('backupMemos', JSON.stringify(updated));
      setTitle('');
      return;
    }

    if (!deadline) return;

    const isSpecial = ['業務', 'メモ'].includes(category);

    const newTask: Task = {
      id: Date.now(),
      title,
      category,
      deadline,
      startTime: category === '業務' || isAllDay ? undefined : startTime,
      duration: category === '業務' || isAllDay ? undefined : duration,
      isAllDay: isSpecial ? undefined : isAllDay,
      days: isSpecial ? undefined : isAllDay ? days : undefined,
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
  return (
    <main className="p-4">
      <h2 className="text-xl font-bold">管理タスク</h2>
      {visibleTasks.map((task) => (
        <div
          key={task.id}
          className={`p-3 rounded border mb-4 shadow-md transition hover:scale-[1.01] ${
            task.completed ? 'bg-gray-400' : 'bg-white'
          }`}
        >
          <div className="text-black font-bold">{task.title}</div>
          <div className="text-sm text-gray-600">予定日: {task.deadline}</div>
          <div className="mt-4 flex justify-between text-sm">
            <div className="flex gap-4">
              <button
                className="text-blue-600 underline"
                onClick={() => handleToggleComplete(task.id)}
              >
                {task.completed ? '戻す' : '完了'}
              </button>
              {!task.completed && (
                <button
                  className="text-green-600 underline"
                  onClick={() => {
                    setTitle(task.title);
                    setDeadline(task.deadline);
                    setCategory('業務');
                    setShowForm(true);
                    setTasks((prev) => prev.filter((t) => t.id !== task.id));
                    toast.success('タスクを修正モードで開きました');
                  }}
                >
                  修正
                </button>
              )}
            </div>
            {task.completed && (
              <button
                className="text-red-600 underline"
                onClick={() => handleDeleteTask(task.id)}
              >
                完全削除
              </button>
            )}
          </div>
        </div>
      ))}
    </main>
  );
}
