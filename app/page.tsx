'use client';

import { useState, useEffect } from 'react';
import { useSession, signIn, signOut } from 'next-auth/react';
import toast, { Toaster } from 'react-hot-toast';

type Task = {
  id: number;
  title: string;
  category: '業務' | '外出' | '来客' | 'プライベート' | 'WEB' | '重要' | 'メモ';
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
      setMemos([...memos, newMemo]);
      setTitle('');
      return;
    }

    if (!deadline) return;

const newTask: Task = {
  id: Date.now(),
  title,
  category,
  deadline,
  startTime: category === '業務' || isAllDay ? undefined : startTime,
  duration: category === '業務' || isAllDay ? undefined : duration,
  isAllDay: category === '業務' || category === 'メモ' ? undefined : isAllDay,
  days: category === '業務' || category === 'メモ' ? undefined : isAllDay ? days : undefined,
  completed: false,
};


    const updatedTasks = [...tasks, newTask];
    setTasks(updatedTasks);

    if (category === '業務') {
      localStorage.setItem('backupTasks', JSON.stringify(updatedTasks));
    }

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

  const handleDeleteTask = (id: number) => {
    setTasks((prev) => prev.filter((task) => task.id !== id));
    toast.success('完全削除しました');
  };

  const handleDeleteMemo = (id: number) => {
    setMemos((prev) => prev.filter((memo) => memo.id !== id));
    toast.success('完全削除しました');
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
    .sort((a, b) => a.deadline.localeCompare(b.deadline));

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
    <main className="max-w-7xl mx-auto p-4 text-white space-y-6">
      <Toaster position="top-right" />
      <div className="flex items-center gap-3">
        <img src="/logo.png" alt="MATELEDGE Logo" className="w-12" />
        <h1 className="text-2xl font-bold">Task Manager</h1>
        <div className="ml-auto">
          <button
            onClick={() => signOut()}
            className="bg-red-600 px-4 py-2 rounded text-white text-sm"
          >
            ログアウト
          </button>
        </div>
      </div>

      {/* 入力フォーム */}
      <div className="space-y-2">
        <input
          className="w-full p-2 border rounded text-black"
          type="text"
          placeholder="タスク名"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
        />

        <select
          className="w-full p-2 border rounded text-black"
          value={category}
          onChange={(e) => setCategory(e.target.value as Task['category'])}
        >
          <option value="業務">業務（アプリ表示）</option>
          <option disabled>──────────</option>
          <option value="外出">外出</option>
          <option value="来客">来客</option>
          <option value="プライベート">プライベート</option>
          <option value="WEB">WEB</option>
          <option value="重要">重要</option>
          <option disabled>──────────</option>
          <option value="メモ">メモ（別一覧）</option>
        </select>

        {category !== 'メモ' && (
          <>
            {category !== '業務' && (
              <>
                <label className="block">終日</label>
                <input
                  type="checkbox"
                  checked={isAllDay}
                  onChange={() => setIsAllDay(!isAllDay)}
                />
              </>
            )}

            <label className="block mt-2">予定日</label>
            <input
              type="date"
              className="w-full p-2 border rounded text-black"
              value={deadline}
              onChange={(e) => setDeadline(e.target.value)}
            />

            {category !== '業務' && !isAllDay && (
              <>
                <label>開始時間</label>
                <select
                  className="w-full p-2 border rounded text-black"
                  value={startTime}
                  onChange={(e) => setStartTime(e.target.value)}
                >
                  <option value="">選択</option>
                  {Array.from({ length: ((23 - 6) * 4) + 1 }, (_, i) => {
                    const totalMinutes = (6 * 60) + (i * 15);
                    const h = String(Math.floor(totalMinutes / 60)).padStart(2, '0');
                    const m = String(totalMinutes % 60).padStart(2, '0');
                    return <option key={i} value={`${h}:${m}`}>{`${h}:${m}`}</option>;
                  })}
                </select>

                <label>所要時間</label>
                <select
                  className="w-full p-2 border rounded text-black"
                  value={duration}
                  onChange={(e) => setDuration(e.target.value)}
                >
                  <option value="">選択</option>
                  {[...Array(8)].map((_, i) => (
                    <option key={i + 1} value={`${i + 1}:00`}>
                      {`${i + 1}時間`}
                    </option>
                  ))}
                </select>
              </>
            )}
          </>
        )}

        <button
          className="w-full bg-blue-500 text-white py-2 rounded"
          onClick={handleAddTask}
        >
          {category === '業務' || category === 'メモ' ? '登録' : 'Googleカレンダー登録'}
        </button>

        <a
          href="https://calendar.google.com/calendar/u/0/r/month"
          target="_blank"
          rel="noopener noreferrer"
          className="mt-2 block text-center bg-green-600 text-white py-2 rounded"
        >
          Googleカレンダーを開く
        </a>
      </div>

      {/* 一覧表示（横並び） */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* メモ一覧 */}
        <div>
          <h2 className="text-xl font-bold">メモ一覧</h2>
          {memos.map((memo) => (
            <div key={memo.id} className="bg-white text-black p-3 rounded border mb-2 shadow">
              <div className="font-bold">{memo.title}</div>
              <button
                className="text-red-600 underline mt-2"
                onClick={() => handleDeleteMemo(memo.id)}
              >
                完全削除
              </button>
            </div>
          ))}
        </div>

        {/* 管理タスク一覧 */}
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
                    className="text-green-600 underline"
                    onClick={() => {
                      setTitle(task.title);
                      setDeadline(task.deadline);
                      setTasks((prev) => prev.filter((t) => t.id !== task.id));
                      toast.success('タスクを修正モードで開きました');
                    }}
                  >
                    修正
                  </button>
                </div>
                <button
                  className="text-red-600 underline"
                  onClick={() => handleDeleteTask(task.id)}
                >
                  完全削除
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}
