'use client';

import { useEffect, useState } from 'react';
import { signOut } from 'next-auth/react';
import TaskInput from './components/TaskInput';
import TaskList from './components/TaskList';
import MemoList from './components/MemoList';
import { saveToLocalStorage, loadFromLocalStorage } from './utils/localStorage';
import { exportData, importData } from './utils/dataTransfer';
import { openGoogleCalendar } from './utils/googleCalendar';

export default function Page() {
  const [tasks, setTasks] = useState([]);
  const [memos, setMemos] = useState([]);
  const [editingTask, setEditingTask] = useState(null);
  const [showForm, setShowForm] = useState(false);

  useEffect(() => {
    const storedData = loadFromLocalStorage();
    setTasks(storedData.tasks || []);
    setMemos(storedData.memos || []);
  }, []);

  useEffect(() => {
    saveToLocalStorage({ tasks, memos });
  }, [tasks, memos]);

  const handleAddTask = (task) => {
    setTasks([...tasks, task]);
    setShowForm(false);
  };

  const handleUpdateTask = (updatedTask) => {
    setTasks(tasks.map((t) => (t.id === updatedTask.id ? updatedTask : t)));
    setEditingTask(null);
    setShowForm(false);
  };

  const handleDeleteTask = (id) => {
    setTasks(tasks.filter((t) => t.id !== id));
  };

  const handleCompleteTask = (id) => {
    setTasks(
      tasks.map((t) =>
        t.id === id ? { ...t, completed: !t.completed } : t
      )
    );
  };

  const handleAddMemo = (memo) => {
    setMemos([...memos, memo]);
    setShowForm(false);
  };

  const handleEditTask = (task) => {
    setEditingTask(task);
    setShowForm(true);
  };

  const handleImport = (data) => {
    setTasks(data.tasks || []);
    setMemos(data.memos || []);
  };

  const categoryColorMap = {
    PB: '10', // セージ
    外出: '11', // トマト
    来客: '5', // バナナ
    作業: '6', // ミカン
    WEB: '3', // ブドウ
    重要: '9', // ブルーベリー
    NKE: '8', // グラファイト
  };

  const categoryOrder = [
    '業務',
    'メモ',
    '外出',
    '来客',
    '作業',
    'WEB',
    'NKE',
    '重要',
    'PB',
  ];

  return (
    <main className="p-4">
      <header className="bg-gray-800 text-white p-2 fixed top-0 left-0 w-full z-10 flex justify-between items-center">
        <h1 className="text-lg font-bold">タスク管理アプリ</h1>
        <button onClick={() => signOut()} className="text-sm">
          ログアウト
        </button>
      </header>

      <div className="mt-16 flex justify-end space-x-2">
        <button
          onClick={() => setShowForm(true)}
          className="bg-blue-500 text-white px-4 py-1 rounded"
        >
          ＋
        </button>
        <button
          onClick={openGoogleCalendar}
          className="bg-green-500 text-white px-4 py-1 rounded"
        >
          Googleカレンダー
        </button>
        <button
          onClick={() => importData(handleImport)}
          className="bg-gray-500 text-white px-4 py-1 rounded text-sm"
        >
          データ復元
        </button>
      </div>

      {showForm && (
        <TaskInput
          onAddTask={handleAddTask}
          onAddMemo={handleAddMemo}
          onUpdateTask={handleUpdateTask}
          editingTask={editingTask}
          categoryColorMap={categoryColorMap}
        />
      )}

      <div className="flex flex-col md:flex-row mt-4 space-y-4 md:space-y-0 md:space-x-4">
        <MemoList memos={memos} />
        <TaskList
          tasks={tasks}
          onDelete={handleDeleteTask}
          onToggleComplete={handleCompleteTask}
          onEdit={handleEditTask}
          categoryOrder={categoryOrder}
        />
      </div>
    </main>
  );
}
