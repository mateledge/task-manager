
// --- Next.jsでクライアントサイドの機能を使う宣言（必要） ---
'use client';

// --- Reactの状態管理・副作用フックをインポート ---
import { useState, useEffect } from 'react';

// --- NextAuthによるセッション取得・ログイン処理 ---
import { useSession, signIn, signOut } from 'next-auth/react';

// --- トースト通知ライブラリ（成功・失敗メッセージ） ---
import toast, { Toaster } from 'react-hot-toast';

// --- タスクの型定義（カテゴリは固定リスト） ---
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

// --- メモの型定義（シンプル） ---
type Memo = {
  id: number;
  title: string;
};

// --- メインコンポーネント ---
export default function Home() {
  const { data: session, status } = useSession(); // セッション状態（ログイン/未ログイン）

  // --- 各種状態（初期値を設定） ---
  const [tasks, setTasks] = useState<Task[]>([]);
  const [memos, setMemos] = useState<Memo[]>([]);
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState<Task['category']>('業務');
  const [deadline, setDeadline] = useState('');
  const [startTime, setStartTime] = useState('');
  const [duration, setDuration] = useState('');
  const [isAllDay, setIsAllDay] = useState(false);
  const [days, setDays] = useState(1);
  const [showForm, setShowForm] = useState(false); // 入力フォームの表示制御

  // --- 初回マウント時：localStorageからデータを読み出し ---
  useEffect(() => {
    const storedTasks = localStorage.getItem('tasks');
    if (storedTasks) setTasks(JSON.parse(storedTasks));

    const storedMemos = localStorage.getItem('memos');
    if (storedMemos) setMemos(JSON.parse(storedMemos));
  }, []);

  // --- タスクが変更されるたびに保存 ---
  useEffect(() => {
    localStorage.setItem('tasks', JSON.stringify(tasks));
  }, [tasks]);

  // --- メモが変更されるたびに保存 ---
  useEffect(() => {
    localStorage.setItem('memos', JSON.stringify(memos));
  }, [memos]);

  // --- タスクまたはメモを追加する共通処理（Googleカレンダー連携あり） ---
  const handleAddTask = async () => {
    if (!title) return; // タイトルが空なら処理しない

    // --- メモカテゴリの場合は簡易保存のみ ---
    if (category === 'メモ') {
      const newMemo: Memo = { id: Date.now(), title };
      const updatedMemos = [...memos, newMemo];
      setMemos(updatedMemos);
      localStorage.setItem('backupMemos', JSON.stringify(updatedMemos));
      setTitle('');
      return;
    }

    if (!deadline) return; // 日付未入力もエラー扱い

    const isSpecialCategory = ['業務', 'メモ'].includes(category); // Googleカレンダー非対象カテゴリ
    // --- 新しいタスクの構築 ---
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

    // --- GoogleカレンダーAPIに登録（業務以外の場合） ---
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

    // --- 入力状態をリセット ---
    setTitle('');
    setDeadline('');
    setStartTime('');
    setDuration('');
    setIsAllDay(false);
    setDays(1);
    setShowForm(false);
  };
  // --- タスクを完全削除 ---
  const handleDeleteTask = (id: number) => {
    setTasks((prev) => prev.filter((task) => task.id !== id));
    toast.success('完全削除しました');
  };

  // --- メモを完全削除 ---
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

  // --- バックアップからタスク・メモを復元 ---
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

  // --- 「業務」カテゴリのみを表示するタスクリスト（完了優先） ---
  const visibleTasks = tasks
    .filter((t) => t.category === '業務')
    .sort((a, b) => {
      if (a.completed !== b.completed) return a.completed ? 1 : -1;
      return a.deadline.localeCompare(b.deadline);
    });

  // --- ログイン状態がまだ取得されていない場合 ---
  if (status === 'loading') {
    return <main className="text-white p-8">読み込み中...</main>;
  }

  // --- ログインしていない場合の画面 ---
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

  // --- ログイン済みの場合の画面表示 ---
  return (
    <>
      {/* 上部ヘッダー：ロゴ、タイトル、ログアウトボタン */}
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

      {/* メイン画面：タスク・メモ・入力フォームなど */}
      <main className="max-w-7xl mx-auto p-4 text-white space-y-4 mt-20">
        <Toaster position="top-right" />

        {/* 上部操作ボタン群 */}
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
        {/* 入力フォームエリア（＋ボタンで開閉） */}
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

            {/* カテゴリ選択＋日付＋終日チェック */}
            <div className="flex gap-2 items-center">
              {/* カテゴリ選択 */}
              <select
                className="w-[112px] text-center p-2 border rounded text-black"
                value={category}
                onChange={(e) => {
                  const selected = e.target.value as Task['category'];
                  setCategory(selected);
                  if (selected === 'NKE') setTitle('NKE');
                }}
              >
                {['業務', 'メモ', '外出', '来客', '作業', 'WEB', 'NKE', '重要', 'PB'].map((v) => (
                  <option key={v} value={v}>
                    {v}
                  </option>
                ))}
              </select>

              {/* 日付入力（メモカテゴリでは非表示） */}
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

            {/* 日数選択（終日がONのとき） */}
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

            {/* 時間指定（終日がOFFのとき） */}
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

            {/* 登録ボタン（業務・メモ以外はカレンダー登録） */}
            <button
              className="w-full bg-blue-600 text-white py-2 rounded"
              onClick={handleAddTask}
            >
              {category === '業務' || category === 'メモ'
                ? '登録'
                : 'Googleカレンダー登録'}
            </button>

            {/* カテゴリが業務・メモ以外のとき、カレンダーを自動表示 */}
{category !== '業務' && category !== 'メモ' && (
  <div className="mt-10 w-full" style={{ height: '600px' }}>
    <iframe
      src="https://calendar.google.com/calendar/embed?src=taniguchi.mateledge%40gmail.com&ctz=Asia%2FTokyo"
      style={{ border: 0 }}
      width="100%"  // ← ← ← ★ ここがポイント
      height="100%"
      frameBorder="0"
      scrolling="no"
    ></iframe>
  </div>
)}

        {/* タスク・メモの一覧表示 */}
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
                <div className="text-sm text-gray-600">
                  予定日: {task.deadline}
                </div>
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
