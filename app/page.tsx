'use client';

import { useState } from 'react';
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

  const startVoiceInput = () => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      toast.error("このブラウザは音声入力に対応していません。");
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = 'ja-JP';
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;

    recognition.start();

    recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript;
      setTitle(transcript);
    };

    recognition.onerror = () => {
      toast.error("音声認識中にエラーが発生しました。");
    };
  };

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
      days: category === '業務' ? undefined : (isAllDay ? days : undefined),
      completed: false,
    };

    setTasks([...tasks, newTask]);

    // Googleカレンダー登録（業務以外）
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
    setTasks(tasks.map(task =>
      task.id === id ? { ...task, completed: !task.completed } : task
    ));
  };

  const visibleTasks = tasks
    .filter(task => task.category === '業務')
    .sort((a, b) => {
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
            response_type: 'code'
          })}
          className="bg-blue-600 px-4 py-2 mt-2 rounded"
        >
          Googleでログイン
        </button>
      </main>
    );
  }

  return (
    <main className="max-w-xl mx-auto p-4 space-y-6">
      <Toaster position="top-right" />
      <div className="flex justify-between items-center">
        <p className="text-white">こんにちは、{session.user?.name} さん</p>
        <button
          onClick={() => signOut()}
          className="bg-red-600 px-3 py-1 rounded text-white"
        >
          ログアウト
        </button>
      </div>

      <h1 className="text-2xl font-bold text-white">タスク登録</h1>

      <div className="space-y-2">
        <input
          className="w-full p-2 border rounded text-black"
          type="text"
          placeholder="タスク名"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
        />
        <button
          className="text-sm text-blue-600 underline"
          onClick={startVoiceInput}
        >
          🎤 マイクで入力
        </button>

        <div className="flex gap-4 flex-wrap">
          {['業務', '外出', '来客', 'プライベート', 'WEB', '重要'].map((c) => (
            <label key={c}>
              <input
                type="radio"
                value={c}
                checked={category === c}
                onChange={() => setCategory(c as Task['category'])}
              />
              <span className="ml-1 text-white">{c}</span>
            </label>
          ))}
        </div>

        <input
          className="w-full p-2 border rounded text-black"
          type="date"
          value={deadline}
          onChange={(e) => setDeadline(e.target.value)}
        />

        {category !== '業務' && (
          <>
            <label className="flex items-center gap-2 text-white">
              <input
                type="checkbox"
                checked={isAllDay}
                onChange={() => setIsAllDay(!isAllDay)}
              />
              終日
            </label>

            {isAllDay ? (
              <input
                className="w-full p-2 border rounded text-black"
                type="number"
                min={1}
                value={days}
                onChange={(e) => setDays(Number(e.target.value))}
                placeholder="何日間"
              />
            ) : (
              <>
                <select
                  className="w-full p-2 border rounded text-black"
                  value={startTime}
                  onChange={(e) => setStartTime(e.target.value)}
                >
                  <option value="">開始時間を選択</option>
                  {timeOptions.map((t) => (
                    <option key={t} value={t}>{t}</option>
                  ))}
                </select>

                <select
                  className="w-full p-2 border rounded text-black"
                  value={duration}
                  onChange={(e) => setDuration(e.target.value)}
                >
                  <option value="">所要時間を選択</option>
                  {timeOptions.map((t) => (
                    <option key={t} value={t}>{t}</option>
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
          登録
        </button>
      </div>

      <hr />

      <h2 className="text-xl font-bold text-white">登録済みタスク</h2>

      {visibleTasks.map((task) => (
        <div
          key={task.id}
          className={`p-3 rounded border mb-2 ${task.completed ? 'bg-gray-400' : 'bg-white'}`}
        >
          <div className="text-black font-bold">{task.title}</div>
          <div className="text-sm text-gray-600">期限: {task.deadline}</div>
          {task.category !== '業務' && !task.isAllDay && (
            <div className="text-sm text-gray-700">
              {task.startTime} ～ {task.duration}
            </div>
          )}
          {task.category !== '業務' && task.isAllDay && (
            <div className="text-sm text-gray-700">終日（{task.days}日間）</div>
          )}
          <button
            className="mt-2 text-sm text-blue-600 underline"
            onClick={() => handleToggleComplete(task.id)}
          >
            {task.completed ? '戻す' : '完了'}
          </button>
        </div>
      ))}
    </main>
  );
}
