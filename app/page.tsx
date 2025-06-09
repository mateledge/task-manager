'use client';

import { useState } from 'react';

// タスクの型定義（必要に応じて拡張）
type Task = {
  id: number;
  title: string;
  category: string;
  deadline: string;
  completed: boolean;
};

export default function Home() {
  // 状態管理（タスクとGoogleカレンダー表示）
  const [tasks, setTasks] = useState<Task[]>([]);
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [newTaskDeadline, setNewTaskDeadline] = useState('');
  const [showCalendar, setShowCalendar] = useState(false);

  // タスク追加処理
  const handleAddTask = () => {
    if (!newTaskTitle.trim()) return;

    const newTask: Task = {
      id: Date.now(),
      title: newTaskTitle,
      category: '業務',
      deadline: newTaskDeadline,
      completed: false,
    };

    setTasks((prev) => [...prev, newTask]);
    setNewTaskTitle('');
    setNewTaskDeadline('');
  };

  // カレンダー表示切り替え
  const toggleCalendar = () => {
    setShowCalendar((prev) => !prev);
  };

  return (
    <div className="min-h-screen p-6 bg-gray-100 flex flex-col items-center">
      <h1 className="text-3xl font-bold mb-6">タスク管理アプリ</h1>

      {/* Googleカレンダー表示ボタン */}
      <button
        onClick={toggleCalendar}
        className="mb-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
      >
        Googleカレンダー表示
      </button>

      {/* 新しいタスクの入力 */}
      <div className="mb-6 w-full max-w-md">
        <input
          type="text"
          value={newTaskTitle}
          onChange={(e) => setNewTaskTitle(e.target.value)}
          placeholder="タスク名"
          className="w-full px-3 py-2 border rounded mb-2"
        />
        <input
          type="date"
          value={newTaskDeadline}
          onChange={(e) => setNewTaskDeadline(e.target.value)}
          className="w-full px-3 py-2 border rounded mb-2"
        />
        <button
          onClick={handleAddTask}
          className="w-full bg-green-600 text-white py-2 rounded hover:bg-green-700"
        >
          タスクを追加
        </button>
      </div>

      {/* タスク一覧表示 */}
      <ul className="w-full max-w-md space-y-2">
        {tasks.map((task) => (
          <li
            key={task.id}
            className="bg-white p-4 rounded shadow flex justify-between items-center"
          >
            <div>
              <p className="font-semibold">{task.title}</p>
              <p className="text-sm text-gray-500">期限: {task.deadline}</p>
            </div>
            <input
              type="checkbox"
              checked={task.completed}
              onChange={() =>
                setTasks((prev) =>
                  prev.map((t) =>
                    t.id === task.id ? { ...t, completed: !t.completed } : t
                  )
                )
              }
              className="ml-4"
            />
          </li>
        ))}
      </ul>

      {/* Googleカレンダー埋め込み（表示ONのときのみ） */}
      {showCalendar && (
        <div className="mt-8 w-full max-w-5xl h-[500px]">
          <iframe
            src="https://calendar.google.com/calendar/embed?src=taniguchi.mateledge%40gmail.com&ctz=Asia%2FTokyo"
            style={{ border: 0 }}
            width="100%"
            height="100%"
            frameBorder="0"
            scrolling="no"
          ></iframe>
        </div>
      )}
    </div>
  );
}
