'use client';

import { useState, useEffect } from 'react';
import { useSession, signIn, signOut } from 'next-auth/react';
import toast, { Toaster } from 'react-hot-toast';

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
      startTime: category === '業務' || isAllDay ? undefined : startTime,
      duration: category === '業務' || isAllDay ? undefined : duration,
            <input className="w-full p-2 border rounded text-black" type="text" placeholder="タスク名" value={title} onChange={(e) => setTitle(e.target.value)} />
            <div className="flex gap-2 items-center">
              <select className="w-[112px] text-center p-2 border rounded text-black" value={category} onChange={(e) => { const selected = e.target.value as Task['category']; setCategory(selected); if (selected === 'NKE') setTitle('NKE'); }}>
                {['業務','メモ','外出','来客','作業','WEB','NKE','重要','PB'].map(v => <option key={v} value={v}>{v}</option>)}
              </select>
              {category !== 'メモ' ? (
                <label className="flex items-center gap-1 w-full">
                  <span className="whitespace-nowrap">Day</span>
                  <input type="date" className="w-32 p-2 border rounded text-black" value={deadline} onChange={(e) => setDeadline(e.target.value)} />
                </label>
              ) : (
                <label className="invisible flex items-center gap-1 w-full">
                  <span className="whitespace-nowrap">Day</span>
                  <input type="date" className="w-32 p-2 border rounded text-black" value={deadline} onChange={() => {}} />
                </label>
              )}
              <label className={`flex items-center gap-1 w-28 text-sm ${category === '業務' || category === 'メモ' ? 'invisible' : ''}`}>
                <input type="checkbox" className="w-5 h-5" checked={isAllDay} onChange={() => setIsAllDay(!isAllDay)} /> 終日
              </label>
            </div>
            {category !== '業務' && category !== 'メモ' && isAllDay && (
              <div>
                <label>何日間</label>
                <select className="w-full p-2 border rounded text-black" value={days} onChange={(e) => setDays(Number(e.target.value))}>
                  {[...Array(30)].map((_, i) => <option key={i + 1} value={i + 1}>{i + 1} 日間</option>)}
                </select>
              </div>
            )}
            <input className="w-full p-2 border rounded text-black" type="text" placeholder="タスク名" value={title} onChange={(e) => setTitle(e.target.value)} />
            <div className="flex gap-2 items-center">
              <select className="w-[112px] text-center p-2 border rounded text-black" value={category} onChange={(e) => { const selected = e.target.value as Task['category']; setCategory(selected); if (selected === 'NKE') setTitle('NKE'); }}>
                {['業務','メモ','外出','来客','作業','WEB','NKE','重要','PB'].map(v => <option key={v} value={v}>{v}</option>)}
              </select>
              {category !== 'メモ' ? (
                <label className="flex items-center gap-1 w-full">
                  <span className="whitespace-nowrap">Day</span>
                  <input type="date" className="w-32 p-2 border rounded text-black" value={deadline} onChange={(e) => setDeadline(e.target.value)} />
                </label>
              ) : (
                <label className="invisible flex items-center gap-1 w-full">
                  <span className="whitespace-nowrap">Day</span>
                  <input type="date" className="w-32 p-2 border rounded text-black" value={deadline} onChange={() => {}} />
                </label>
              )}
              <label className={`flex items-center gap-1 w-28 text-sm ${category === '業務' || category === 'メモ' ? 'invisible' : ''}`}>
                <input type="checkbox" className="w-5 h-5" checked={isAllDay} onChange={() => setIsAllDay(!isAllDay)} /> 終日
              </label>
            </div>
            {category !== '業務' && category !== 'メモ' && isAllDay && (
              <div>
                <label>何日間</label>
                <select className="w-full p-2 border rounded text-black" value={days} onChange={(e) => setDays(Number(e.target.value))}>
                  {[...Array(30)].map((_, i) => <option key={i + 1} value={i + 1}>{i + 1} 日間</option>)}
                </select>
              </div>
            )}
            {category !== '業務' && category !== 'メモ' && !isAllDay && (
              <>
                <div>
                  <label>開始時間</label>
                  <select className="w-full p-2 border rounded text-black" value={startTime} onChange={(e) => setStartTime(e.target.value)}>
                    <option value="">選択</option>
            <button className="w-full bg-blue-600 text-white py-2 rounded" onClick={handleAddTask}>
              {category === '業務' || category === 'メモ' ? '登録' : 'Googleカレンダー登録'}
            </button>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:grid-flow-col-reverse">
          <div>
            <h2 className="text-xl font-bold">管理タスク</h2>
            {visibleTasks.map((task) => (
              <div key={task.id} className={`p-3 rounded border mb-4 shadow-md transition hover:scale-[1.01] ${task.completed ? 'bg-gray-400' : 'bg-white'}`}>
                <div className="text-black font-bold">{task.title}</div>
                <div className="text-sm text-gray-600">予定日: {task.deadline}</div>
                <div className="mt-4 flex justify-between text-sm">
                  <div className="flex gap-4">
                    <button className="text-blue-600 underline" onClick={() => handleToggleComplete(task.id)}>
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
            <button className="w-full bg-blue-600 text-white py-2 rounded" onClick={handleAddTask}>
              {category === '業務' || category === 'メモ' ? '登録' : 'Googleカレンダー登録'}
            </button>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:grid-flow-col-reverse">
          <div>
            <h2 className="text-xl font-bold">管理タスク</h2>
            {visibleTasks.map((task) => (
              <div key={task.id} className={`p-3 rounded border mb-4 shadow-md transition hover:scale-[1.01] ${task.completed ? 'bg-gray-400' : 'bg-white'}`}>
                <div className="text-black font-bold">{task.title}</div>
                <div className="text-sm text-gray-600">予定日: {task.deadline}</div>
                <div className="mt-4 flex justify-between text-sm">
                  <div className="flex gap-4">
                    <button className="text-blue-600 underline" onClick={() => handleToggleComplete(task.id)}>
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
                    <button className="text-red-600 underline" onClick={() => handleDeleteTask(task.id)}>
                      完全削除
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
                  )}
                </div>
              </div>
            ))}
          </div>

          <div>
            <h2 className="text-xl font-bold">メモ一覧</h2>
            {memos.map((memo) => (
              <div key={memo.id} className="bg-white text-black p-3 rounded border mb-2 shadow">
                <div className="flex justify-between items-center">
                  <div className="font-bold">{memo.title}</div>
                  <button className="text-red-600 underline text-sm" onClick={() => handleDeleteMemo(memo.id)}>完全削除</button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </main>
    </>
  );
}
