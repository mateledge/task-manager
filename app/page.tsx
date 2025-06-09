'use client';

import { useState, useEffect } from 'react';
import { useSession, signIn, signOut } from 'next-auth/react';
import toast, { Toaster } from 'react-hot-toast';

// --- タスクの型定義（カテゴリ9種、完了状態などを含む） ---
type Task = {
  id: number;
  title: string;
  category: '業務' | 'メモ' | '外出' | '来客' | '作業' | 'WEB' | 'NKE' | '重要' | 'PB';
  deadline: string;
  startTime?: string;
  duration?: string;
  isAllDay?: boolean;
  days?: number;
  completed: boolean;
};

// --- メモの型定義（タイトルのみ） ---
type Memo = {
  id: number;
  title: string;
};

// --- メインコンポーネント開始 ---
export default function Home() {
  const { data: session, status } = useSession(); // Googleログインセッション取得

  // --- ステート変数定義 ---
  const [tasks, setTasks] = useState<Task[]>([]);
  const [memos, setMemos] = useState<Memo[]>([]);
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState<Task['category']>('業務');
  const [deadline, setDeadline] = useState('');
  const [startTime, setStartTime] = useState('');
  const [duration, setDuration] = useState('');
  const [isAllDay, setIsAllDay] = useState(false);
  const [days, setDays] = useState(1);
  const [showForm, setShowForm] = useState(false);
  // --- 初回読み込み時：localStorageから読み出す ---
  useEffect(() => {
    const storedTasks = localStorage.getItem('tasks');
    if (storedTasks) setTasks(JSON.parse(storedTasks));

    const storedMemos = localStorage.getItem('memos');
    if (storedMemos) setMemos(JSON.parse(storedMemos));
  }, []);

  // --- タスク更新時に保存 ---
  useEffect(() => {
    localStorage.setItem('tasks', JSON.stringify(tasks));
  }, [tasks]);

  // --- メモ更新時に保存 ---
  useEffect(() => {
    localStorage.setItem('memos', JSON.stringify(memos));
  }, [memos]);

  // --- タスク追加処理（Googleカレンダー登録も含む） ---
  const handleAddTask = async () => {
    if (!title) return;

    // メモとして追加する場合
    if (category === 'メモ') {
      const newMemo: Memo = { id: Date.now(), title };
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
      startTime: isSpecialCategory || isAllDay ? undefined : startTime,
      duration: isSpecialCategory || isAllDay ? undefined : duration,
      isAllDay: isSpecialCategory ? undefined : isAllDay,
      days: isSpecialCategory ? undefined : isAllDay ? days : undefined,
      completed: false,
    };
    const updatedTasks = [...tasks, newTask];
    setTasks(updatedTasks);
    localStorage.setItem('backupTasks', JSON.stringify(updatedTasks));

    // --- Googleカレンダーに登録（業務以外） ---
    if (session && category !== '業務') {
      const resolvedStart = isAllDay ? deadline : `${deadline}T${startTime || '00:00'}`;
      const colorMap: { [key in Task['category']]?: string } = {
        外出: '11',
        来客: '5',
        作業: '6',
        WEB: '3',
        NKE: '8',
        重要: '9',
        PB: '10',
      };

      try {
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
            colorId: colorMap[category],
          }),
        });

        const data = await res.json();
        if (!res.ok) toast.error(data.error || 'Googleカレンダー登録に失敗しました');
        else toast.success('登録完了しました');
      } catch {
        toast.error('通信エラーが発生しました');
      }
    }

    // --- 入力項目を初期化 ---
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
  // --- タスクの完了状態を切り替え ---
  const handleToggleComplete = (id: number) => {
    setTasks((prev) =>
      prev.map((task) => (task.id === id ? { ...task, completed: !task.completed } : task))
    );
  };

  // --- ローカルストレージからタスクとメモを復元 ---
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

  // --- 表示対象の業務タスク（完了済みを後ろに） ---
  const visibleTasks = tasks
    .filter((t) => t.category === '業務')
    .sort((a, b) => {
      if (a.completed !== b.completed) return a.completed ? 1 : -1;
      return a.deadline.localeCompare(b.deadline);
    });

  // --- セッション取得中は「読み込み中...」を表示 ---
  if (status === 'loading') {
    return <main className="text-white p-8">読み込み中...</main>;
  }

  // --- ログインしていない場合の表示 ---
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

  // --- ログイン済みの場合のメイン表示 ---
  return (
    <>
      {/* ヘッダー：タイトルとログアウトボタン */}
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

      {/* メイン画面本体 */}
      <main className="max-w-7xl mx-auto p-4 text-white space-y-4 mt-20">
        <Toaster position="top-right" />

        {/* 上部操作ボタン（フォーム表示、カレンダーリンク、データ復元） */}
        <div className="flex justify-center gap-2">
          <button
            onClick={() => setShowForm(!showForm)}
            className="bg-blue-500 px-4 py-2 rounded text-white text-sm"
          >
            ＋
          </button>
          <a
            href="https://calendar.google.com/calendar/u/0/r/month"
            target="_blank"
            rel="noopener noreferrer"
            className="bg-green-600 text-white px-6 py-2 rounded text-sm"
          >
            Googleカレンダー
          </a>
          <button
            onClick={handleRestoreBackup}
            className="bg-yellow-500 px-4 py-2 rounded text-black text-sm"
          >
            データ復元
          </button>
        </div>
        {/* 入力フォーム：showForm=trueのときのみ表示 */}
        {showForm && (
          <div className="space-y-3 border border-gray-400 p-4 rounded">
            {/* タスク名入力欄 */}
            <input
              className="w-full p-2 border rounded text-black"
              type="text"
              placeholder="タスク名"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />

            {/* カテゴリ選択 + 日付入力 + 終日チェック */}
            <div className="flex gap-2 items-center">
              {/* カテゴリ選択 */}
              <select
                className="w-[112px] text-center p-2 border rounded text-black"
                value={category}
                onChange={(e) => {
                  const selected = e.target.value as Task['category'];
                  setCategory(selected);
                  if (selected === 'NKE') setTitle('NKE'); // NKEなら自動入力
                }}
              >
                {['業務', 'メモ', '外出', '来客', '作業', 'WEB', 'NKE', '重要', 'PB'].map((v) => (
                  <option key={v} value={v}>
                    {v}
                  </option>
                ))}
              </select>

              {/* 日付入力（メモカテゴリは非表示） */}
              {category !== 'メモ' ? (
                <label className="flex items-center gap-1 w-full">
                  <span className="whitespace-nowrap">Day</span>
                  <input
                    type="date"
                    className="w-32 p-2 border rounded text-black"
                    value={deadline}
                    onChange={(e) => setDeadline(e.target.value)}
                  />
                </label>
              ) : (
                <label className="invisible flex items-center gap-1 w-full">
                  <span className="whitespace-nowrap">Day</span>
                  <input
                    type="date"
                    className="w-32 p-2 border rounded text-black"
                    value={deadline}
                    onChange={() => {}}
                  />
                </label>
              )}

              {/* 終日チェックボックス（業務・メモは非表示） */}
              <label
                className={`flex items-center gap-1 w-28 text-sm ${
                  category === '業務' || category === 'メモ' ? 'invisible' : ''
                }`}
              >
                <input
                  type="checkbox"
                  className="w-5 h-5"
                  checked={isAllDay}
                  onChange={() => setIsAllDay(!isAllDay)}
                />
                終日
              </label>
            </div>
            {/* 日数選択（終日の場合のみ） */}
            {category !== '業務' && category !== 'メモ' && isAllDay && (
              <div>
                <label>何日間</label>
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
              </div>
            )}

            {/* 時間入力（終日でない場合） */}
            {category !== '業務' && category !== 'メモ' && !isAllDay && (
              <>
                <div>
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
                      return (
                        <option key={i} value={`${h}:${m}`}>
                          {`${h}:${m}`}
                        </option>
                      );
                    })}
                  </select>
                </div>

                <div>
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
                </div>
              </>
            )}
            {/* 登録ボタン */}
            <button
              className="w-full bg-blue-600 text-white py-2 rounded"
              onClick={handleAddTask}
            >
              {category === '業務' || category === 'メモ'
                ? '登録'
                : 'Googleカレンダー登録'}
            </button>

            {/* Googleカレンダー表示（業務・メモ以外のカテゴリ時） */}
            {category !== '業務' && category !== 'メモ' && (
              <div className="mt-10 w-full" style={{ height: '600px' }}>
                <iframe
                  src="https://calendar.google.com/calendar/embed?src=taniguchi.mateledge%40gmail.com&ctz=Asia%2FTokyo&hl=ja&mode=MONTH"
                  style={{ border: 0 }}
                  width="100%"
                  height="100%"
                  frameBorder="0"
                  scrolling="no"
                ></iframe>
              </div>
            )}
          </div>
        )}

        {/* タスク＆メモ一覧 */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:grid-flow-col-reverse">
          {/* タスクリスト */}
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
                        setCategory('業務');
                        setShowForm(true);
                        setTasks((prev) => prev.filter((t) => t.id !== task.id));
                        toast.success('タスクを修正モードで開きました');
                      }}
                    >
                      修正
                    </button>
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
          </div>

          {/* メモリスト */}
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
                    完全削除
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </main>
    </>
  );
}
