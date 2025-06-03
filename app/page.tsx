'use client';

import { useEffect, useState } from 'react';
import { signOut } from 'next-auth/react';

type Task = {
  id: number;
  title: string;
  category: string;
  deadline?: string;
  startTime?: string;
  duration?: string;
  isAllDay?: boolean;
  days?: number;
  completed: boolean;
};

type Memo = {
  id: number;
  content: string;
};

export default function Page() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [memos, setMemos] = useState<Memo[]>([]);
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('業務');
  const [deadline, setDeadline] = useState('');
  const [startTime, setStartTime] = useState('');
  const [duration, setDuration] = useState('');
  const [isAllDay, setIsAllDay] = useState(false);
  const [days, setDays] = useState(1);
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);

  const categoryOptions = ['業務', 'メモ', '外出', '来客', 'WEB', 'NKE', '重要', 'PB'];
  const colorMap: { [key: string]: string } = {
    外出: '11', 来客: '5', WEB: '3', PB: '10', 重要: '9', NKE: '8',
  };

  useEffect(() => {
    const savedTasks = localStorage.getItem('tasks');
    const savedMemos = localStorage.getItem('memos');
    if (savedTasks) setTasks(JSON.parse(savedTasks));
    if (savedMemos) setMemos(JSON.parse(savedMemos));
  }, []);

  useEffect(() => {
    localStorage.setItem('tasks', JSON.stringify(tasks));
    localStorage.setItem('memos', JSON.stringify(memos));
  }, [tasks, memos]);

  const resetForm = () => {
    setTitle('');
    setCategory('業務');
    setDeadline('');
    setStartTime('');
    setDuration('');
    setIsAllDay(false);
    setDays(1);
    setEditId(null);
  };

  const handleRegister = () => {
    if (category === 'メモ') {
      const newMemo: Memo = {
        id: Date.now(),
        content: title,
      };
      setMemos([newMemo, ...memos]);
    } else {
      const newTask: Task = {
        id: editId ?? Date.now(),
        title,
        category,
        deadline,
        startTime,
        duration,
        isAllDay,
        days,
        completed: false,
      };
      if (editId) {
        setTasks(tasks.map(t => t.id === editId ? newTask : t));
      } else {
        setTasks([newTask, ...tasks]);
      }
    }
    resetForm();
    setShowForm(false);
  };

  const handleEdit = (task: Task) => {
    setShowForm(true);
    setEditId(task.id);
    setTitle(task.title);
    setCategory(task.category);
    setDeadline(task.deadline ?? '');
    setStartTime(task.startTime ?? '');
    setDuration(task.duration ?? '');
    setIsAllDay(task.isAllDay ?? false);
    setDays(task.days ?? 1);
  };

  const toggleComplete = (id: number) => {
    setTasks(tasks.map(t => t.id === id ? { ...t, completed: !t.completed } : t));
  };

  const restoreData = () => {
    const savedTasks = localStorage.getItem('tasks');
    const savedMemos = localStorage.getItem('memos');
    if (savedTasks) setTasks(JSON.parse(savedTasks));
    if (savedMemos) setMemos(JSON.parse(savedMemos));
  };

  useEffect(() => {
    if (category === 'NKE') setTitle('NKE');
  }, [category]);

  return (
    <div className="p-4 space-y-4">
      {/* ヘッダー */}
      <div className="bg-gray-800 text-white p-4 rounded-xl flex justify-between items-center">
        <h1 className="text-xl font-bold">タスク管理</h1>
        <button onClick={() => signOut()} className="text-sm">ログアウト</button>
      </div>

      {/* Googleカレンダー */}
      <div className="flex justify-end">
        <a
          href="https://calendar.google.com/"
          target="_blank"
          rel="noopener noreferrer"
          className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-xl text-sm"
        >
          Googleカレンダーを開く
        </a>
      </div>

      {/* ボタン列 */}
      <div className="flex gap-2">
        <button onClick={() => setShowForm(!showForm)} className="bg-green-500 text-white px-4 py-2 rounded-xl">＋</button>
        <button onClick={restoreData} className="bg-gray-500 text-white px-4 py-2 rounded-xl text-sm">データ復元</button>
      </div>

      {/* 入力フォーム */}
      {showForm && (
        <div className="border p-4 rounded-xl space-y-2 bg-gray-100">
          <input
            type="text"
            value={title}
            onChange={e => setTitle(e.target.value)}
            placeholder="タスク名 / メモ内容"
            className="w-full p-2 border rounded"
          />
          <div className="flex gap-2">
            <select value={category} onChange={e => setCategory(e.target.value)} className="border p-2 rounded">
              {categoryOptions.map(opt => (
                <option key={opt} value={opt}>{opt}</option>
              ))}
            </select>
            <input type="date" value={deadline} onChange={e => setDeadline(e.target.value)} className="border p-2 rounded w-[40%]" />
            {category !== '業務' && (
              <label className="flex items-center text-sm">
                <input
                  type="checkbox"
                  checked={isAllDay}
                  onChange={e => setIsAllDay(e.target.checked)}
                  className="mr-1"
                />
                終日
              </label>
            )}
          </div>
          {isAllDay && category !== '業務' && (
            <input
              type="number"
              min={1}
              value={days}
              onChange={e => setDays(Number(e.target.value))}
              placeholder="日数"
              className="w-full p-2 border rounded"
            />
          )}
          {category !== 'メモ' && (
            <>
              <input
                type="time"
                value={startTime}
                onChange={e => setStartTime(e.target.value)}
                step={900}
                className="w-full p-2 border rounded"
              />
              <input
                type="time"
                value={duration}
                onChange={e => setDuration(e.target.value)}
                step={900}
                className="w-full p-2 border rounded"
              />
            </>
          )}
          <button onClick={handleRegister} className="bg-blue-600 text-white px-4 py-2 rounded-xl w-full">登録</button>
        </div>
      )}

      {/* 一覧エリア */}
      <div className="flex flex-col lg:flex-row gap-4">
        {/* 管理タスク */}
        <div className="w-full lg:w-1/2 space-y-2">
          <h2 className="text-lg font-bold">管理タスク</h2>
          {tasks
            .sort((a, b) => Number(a.completed) - Number(b.completed))
            .map(task => (
              <div key={task.id} className="border p-2 rounded flex justify-between items-center bg-white">
                <div>
                  <p className={task.completed ? 'line-through' : ''}>{task.title}</p>
                  <p className="text-xs text-gray-500">{task.category}</p>
                </div>
                <div className="flex gap-1">
                  <button onClick={() => toggleComplete(task.id)} className="text-xs bg-green-200 px-2 rounded">
                    {task.completed ? '戻す' : '完了'}
                  </button>
                  <button onClick={() => handleEdit(task)} className="text-xs bg-yellow-200 px-2 rounded">修正</button>
                </div>
              </div>
            ))}
        </div>

        {/* メモ */}
        <div className="w-full lg:w-1/2 space-y-2">
          <h2 className="text-lg font-bold">メモ</h2>
          {memos.map(memo => (
            <div key={memo.id} className="border p-2 rounded bg-white">
              {memo.content}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
