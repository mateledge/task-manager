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
  const { data: session } = useSession();
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

  if (!session) {
    return (
      <main className="text-white p-8">
        <Toaster position="top-right" />
        <p>ログインしていません</p>
        <button
          onClick={() => signIn('google', {
            prompt: 'consent',
            access_type: 'offline',
            response_type: 'code',
          })}
          className="bg-blue-600 px-4 py-2 mt-2 rounded"
        >
          Googleでログイン
        </button>
        
        
  
  
  
  
  
  
  
  
  <div className="pt-10 text-center">
    <button
      onClick={() => signOut()}
      className="bg-red-600 px-4 py-2 rounded text-white text-sm"
    >
      ログアウト
    </button>
  </div>
</main>
  );
  }

  return (
    <main className="max-w-xl mx-auto p-4 space-y-6">
      <div className="flex items-center gap-3">
        <img src="/logo.png" alt="MATELEDGE Logo" className="w-12" />
        <h1 className="text-2xl font-bold text-white">Task Manager</h1>
      </div>
      <Toaster position="top-right" />

      <div className="space-y-2">
        <input
          className="w-full p-2 border rounded text-black"
          type="text"
          placeholder="タスク名"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
        />

        <div className="space-y-2">
          <label className="text-white block">カテゴリ</label>
          <select
            className="w-full p-2 border rounded text-black"
            value={category}
            onChange={(e) => setCategory(e.target.value as Task['category'])}
          >
            <option value="業務">業務（アプリ表示のみ）</option>
            <option disabled>──────────</option>
            <option value="外出">外出</option>
            <option value="来客">来客</option>
            <option value="プライベート">プライベート</option>
            <option value="WEB">WEB</option>
            <option value="重要">重要</option>
          </select>
          {category !== '業務' && (
            <p className="text-sm text-white mt-1">※ Googleカレンダーに登録されます</p>
          )}
        </div>

        <div className="flex items-center gap-3">
          <label className="text-white whitespace-nowrap">予定日</label>
          <input
            type="date"
            className="p-2 border rounded text-black"
            value={deadline}
            onChange={(e) => setDeadline(e.target.value)}
          />
          <label className="flex items-center text-white text-sm gap-1">
            <input
              type="checkbox"
              className="w-5 h-5"
              checked={isAllDay}
              onChange={() => setIsAllDay(!isAllDay)}
            />
            終日
          </label>
        </div>

        {category !== '業務' && (
          isAllDay ? (
            <>
              <label className="text-white">何日間</label>
              <select
                className="w-full p-2 border rounded text-black"
                value={days}
                onChange={(e) => setDays(Number(e.target.value))}
              >
                {[...Array(30)].map((_, i) => (
                  <option key={i + 1} value={i + 1}>
                    {i + 1} 日間
                  </option>
                ))}
              </select>
            </>
          ) : (
            <>
              <label className="text-white">開始時間</label>
              <select
                className="w-full p-2 border rounded text-black"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
              >
                <option value="">開始時間を選択</option>
                {Array.from({ length: 24 * 4 }, (_, i) => {
                  const hours = Math.floor(i / 4);
                  const minutes = (i % 4) * 15;
                  const time = `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
                  return (
                    <option key={time} value={time}>
                      {time}
                    </option>
                  );
                })}
              </select>

              <label className="text-white">所要時間</label>
              <select
                className="w-full p-2 border rounded text-black"
                value={duration}
                onChange={(e) => setDuration(e.target.value)}
              >
                <option value="">所要時間を選択</option>
                {Array.from({ length: 24 * 4 }, (_, i) => {
                  const hours = Math.floor(i / 4);
                  const minutes = (i % 4) * 15;
                  const time = `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
                  return (
                    <option key={time} value={time}>
                      {time}
                    </option>
                  );
                })}
              </select>
            </>
          )
        )}

        <button
          className="w-full bg-blue-500 text-white py-2 rounded"
          onClick={handleAddTask}
        >
          登録
        </button>
      </div>

      <hr />
      <h2 className="text-xl font-bold text-white">登録済みタスク</h2>
      {visibleTasks.map((task) => (
        <div
          key={task.id}
          className={`p-3 rounded border mb-4 shadow-md transition hover:scale-[1.01] ${task.completed ? 'bg-gray-400' : 'bg-white'}`}
        >
          <div className="text-black font-bold">{task.title}</div>
          <div className="text-sm text-gray-600">予定日: {task.deadline}</div>
          {task.category !== '業務' && !task.isAllDay && (
            <div className="text-sm text-gray-700">
              {task.startTime} ～ {task.duration}
            </div>
          )}
          {task.category !== '業務' && task.isAllDay && (
            <div className="text-sm text-gray-700">終日（{task.days}日間）</div>
          )}
          <div className="mt-4 flex justify-between text-sm">
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
      ))}
    </main>
  );
}

