// pages/index.tsx
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

  return (
    <main className="max-w-4xl mx-auto p-4 text-white space-y-4">
      <Toaster position="top-right" />

      {/* ボタン系 */}
      <div className="flex justify-end gap-2">
        <button
          onClick={() => setShowForm(!showForm)}
          className="bg-blue-500 px-4 py-2 rounded text-white text-sm"
        >
          ＋
        </button>
        <button
          onClick={handleRestoreBackup}
          className="bg-yellow-500 px-4 py-2 rounded text-black text-sm"
        >
          データ復元
        </button>
      </div>

      {/* 入力フォーム */}
      {showForm && (
        <div className="space-y-3 border border-gray-400 p-4 rounded">
          <input
            className="w-full p-2 border rounded text-black"
            type="text"
            placeholder="タスク名"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />

          <div className="flex gap-2 items-center">
            <select
              className="w-1/3 p-2 border rounded text-black"
              value={category}
              onChange={(e) => setCategory(e.target.value as Task['category'])}
            >
              <option value="業務">業務</option>
              <option value="メモ">メモ</option>
              <option value="外出">外出</option>
              <option value="来客">来客</option>
              <option value="WEB">WEB</option>
              <option value="NKE">NKE</option>
              <option value="重要">重要</option>
              <option value="PB">PB</option>
            </select>

            {category !== 'メモ' && (
              <input
                type="date"
                className="w-2/3 p-2 border rounded text-black"
                value={deadline}
                onChange={(e) => setDeadline(e.target.value)}
              />
            )}
          </div>

          {category !== '業務' && category !== 'メモ' && (
            <>
              <input
                type="time"
                className="w-full p-2 border rounded text-black"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
              />
              <input
                className="w-full p-2 border rounded text-black"
                placeholder="所要時間（分）"
                value={duration}
                onChange={(e) => setDuration(e.target.value)}
              />
            </>
          )}

          <button
            className="w-full bg-blue-600 text-white py-2 rounded"
            onClick={handleAddTask}
          >
            登録
          </button>
        </div>
      )}

      {/* 一覧 */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:grid-flow-col-reverse">
        <div>
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
                  <button
                    className="text-red-600 underline"
                    onClick={() => handleDeleteTask(task.id)}
                  >
                    削除
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div>
          <h2 className="text-xl font-bold">メモ一覧</h2>
          {memos.map((memo) => (
            <div
              key={memo.id}
              className="bg-white text-black p-3 rounded border mb-2 shadow"
            >
              <div className="flex justify-between items-center">
                <div className="font-bold">{memo.title}</div>
                <button
                  className="text-red-600 underline text-sm"
                  onClick={() => handleDeleteMemo(memo.id)}
                >
                  削除
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}
