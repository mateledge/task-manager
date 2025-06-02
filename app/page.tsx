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
  const [tasks, setTasks] = useState<Task[]>([]);
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState<Task['category']>('業務');
  const [deadline, setDeadline] = useState('');
  const [startTime, setStartTime] = useState('');
  const [duration, setDuration] = useState('');
  const [isAllDay, setIsAllDay] = useState(false);
  const [days, setDays] = useState(1);

  const timeOptions = Array.from({ length: 24 * 4 }, (_, i) => {
    const hours = Math.floor(i / 4);
    const minutes = (i % 4) * 15;
    return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
  });

  useEffect(() => {
    const stored = localStorage.getItem('tasks');
    if (stored) setTasks(JSON.parse(stored));
  }, []);

  useEffect(() => {
    localStorage.setItem('tasks', JSON.stringify(tasks));
  }, [tasks]);

  const handleAddTask = async () => {
    if (!title || !deadline) {
      return;
    }
    const newTask: Task = {
      id: Date.now(), title, category, deadline,
      startTime: category === '業務' || isAllDay ? undefined : startTime,
      duration: category === '業務' || isAllDay ? undefined : duration,
      isAllDay: category === '業務' ? undefined : isAllDay,
      days: category === '業務' ? undefined : (isAllDay ? days : undefined),
      completed: false,
    };
    setTasks([...tasks, newTask]);
    if (session && category !== '業務') {
      const resolvedStart = isAllDay ? deadline : `${deadline}T${startTime || '00:00'}`;
      const res = await fetch('/api/calendar/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ task: title, startDate: resolvedStart, duration, category, isAllDay, days }),
      });
      const data = await res.json();
      res.ok ? toast.success('登録完了しました') : toast.error(data.error || 'Googleカレンダー登録に失敗しました');
    }
    setTitle('');
    setDeadline('');
    setStartTime('');
    setDuration('');
    setIsAllDay(false);
    setDays(1);
  };

  const handleToggleComplete = (id: number) => {
    setTasks(tasks.map(t => t.id === id ? { ...t, completed: !t.completed } : t));
  };

  const handleDeleteTask = (id: number) => {
    setTasks(tasks.filter(t => t.id !== id));
    toast.success('削除しました');
  };

  const visibleTasks = tasks.filter(t => t.category === '業務').sort((a, b) => {
    if (a.completed !== b.completed) return a.completed ? 1 : -1;
    if (a.deadline < new Date().toISOString().slice(0, 10)) return -1;
    if (b.deadline < new Date().toISOString().slice(0, 10)) return 1;
    return a.deadline.localeCompare(b.deadline);
  });

  if (!session) return (
    <main className="text-white p-8">
      <Toaster position="top-right" />
      <p>ログインしていません</p>
      <button onClick={() => signIn('google', { prompt: 'consent', access_type: 'offline', response_type: 'code' })} className="bg-blue-600 px-4 py-2 mt-2 rounded">Googleでログイン</button>
    </main>
  );

  return (
    <main className="max-w-xl mx-auto p-4 space-y-6">
      <Toaster position="top-right" />
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-white">MATELEDGE Task Manager</h1>
        <button onClick={() => signOut()} className="bg-red-600 px-3 py-1 rounded text-white">ログアウト</button>
      </div>

      <div className="space-y-2">
        <input className="w-full p-2 border rounded text-black" type="text" placeholder="タスク名" value={title} onChange={(e) => setTitle(e.target.value)} />

        <div className="flex gap-4 flex-wrap">
          {['業務', '外出', '来客', 'プライベート', 'WEB', '重要'].map(c => (
            <label key={c}><input type="radio" value={c} checked={category === c} onChange={() => setCategory(c as Task['category'])} /><span className="ml-1 text-white">{c}</span></label>
          ))}
        </div>
        <label className="text-white">予定日</label>
        <input className="w-full p-2 border rounded text-black" type="date" value={deadline} onChange={(e) => setDeadline(e.target.value)} />
        {category !== '業務' && (
          <>
            <label className="flex items-center gap-2 text-white"><input type="checkbox" checked={isAllDay} onChange={() => setIsAllDay(!isAllDay)} />終日</label>
            {isAllDay ? (
              <>
                <label className="text-white">何日間</label>
                <select className="w-full p-2 border rounded text-black" value={days} onChange={(e) => setDays(Number(e.target.value))}>
                  {[...Array(30)].map((_, i) => (<option key={i + 1} value={i + 1}>{i + 1} 日間</option>))}
                </select>
              </>
            ) : (
              <>
                <label className="text-white">開始時間</label>
                <select className="w-full p-2 border rounded text-black" value={startTime} onChange={(e) => setStartTime(e.target.value)}>
                  <option value="">開始時間を選択</option>
                  {timeOptions.map(t => (<option key={t} value={t}>{t}</option>))}
                </select>
                <label className="text-white">所要時間</label>
                <select className="w-full p-2 border rounded text-black" value={duration} onChange={(e) => setDuration(e.target.value)}>
                  <option value="">所要時間を選択</option>
                  {timeOptions.map(t => (<option key={t} value={t}>{t}</option>))}
                </select>
              </>
            )}
          </>
        )}
        <button className="w-full bg-blue-500 text-white py-2 rounded" onClick={handleAddTask}>登録</button>
      </div>

      <hr />
      <h2 className="text-xl font-bold text-white">登録済みタスク</h2>
      {visibleTasks.map(task => (
        <div key={task.id} className={`p-3 rounded border mb-4 ${task.completed ? 'bg-gray-400' : 'bg-white'}`}>
          <div className="text-black font-bold">{task.title}</div>
          <div className="text-sm text-gray-600">予定日: {task.deadline}</div>
          {task.category !== '業務' && !task.isAllDay && (
            <div className="text-sm text-gray-700">{task.startTime} ～ {task.duration}</div>
          )}
          {task.category !== '業務' && task.isAllDay && (
            <div className="text-sm text-gray-700">終日（{task.days}日間）</div>
          )}
          <div className="mt-4 flex justify-between text-sm">
            <button className="text-blue-600 underline" onClick={() => handleToggleComplete(task.id)}>{task.completed ? '戻す' : '完了'}</button>
            <button className="text-red-600 underline" onClick={() => handleDeleteTask(task.id)}>削除</button>
          </div>
        </div>
      ))}
    </main>
  );
}
