import { useState, useEffect, useRef } from 'react';

export default function Home() {
  const [task, setTask] = useState('');
  const [category, setCategory] = useState('業務');
  const [deadline, setDeadline] = useState('');
  const [startDate, setStartDate] = useState('');
  const [duration, setDuration] = useState('');
  const [tasks, setTasks] = useState([]);
  const [showList, setShowList] = useState(true);
  const taskListRef = useRef(null);

  const fetchTasks = async () => {
    try {
      const res = await fetch('/api/save-task');
      const data = await res.json();
      setTasks(data.tasks || []);
    } catch (err) {
      console.error('取得失敗:', err);
    }
  };

  useEffect(() => {
    fetchTasks();
  }, []);

  const handleSubmit = async () => {
    const newTask = {
      task,
      category,
      ...(category === '業務'
        ? { deadline }
        : { startDate, duration })
    };

    try {
      const res = await fetch('/api/save-task', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newTask)
      });
      if (!res.ok) throw new Error('保存失敗');
      setTask('');
      setCategory('業務');
      setDeadline('');
      setStartDate('');
      setDuration('');
      await fetchTasks();
      taskListRef.current?.scrollIntoView({ behavior: 'smooth' });
    } catch (err) {
      alert('保存できませんでした: ' + err.message);
    }
  };

  return (
    <main style={{ maxWidth: 600, margin: '0 auto', padding: 20 }}>
      <h1>タスク登録</h1>

      <label>カテゴリ</label>
      <select value={category} onChange={e => setCategory(e.target.value)} style={{ width: '100%' }}>
        <option value="業務">業務</option>
        <option value="外出">外出</option>
        <option value="来客">来客</option>
        <option value="プライベート">プライベート</option>
      </select>

      <textarea
        placeholder="例：部品手配"
        value={task}
        onChange={e => setTask(e.target.value)}
        style={{ width: '100%', marginTop: 10 }}
      />

      {category === '業務' ? (
        <>
          <label>期限（日付のみ）</label>
          <input type="date" value={deadline} onChange={e => setDeadline(e.target.value)} />
        </>
      ) : (
        <>
          <label>開始日時</label>
          <input type="datetime-local" value={startDate} onChange={e => setStartDate(e.target.value)} />
          <label>所要時間（時間単位）</label>
          <input type="number" min="0.25" step="0.25" placeholder="例：1.5" value={duration} onChange={e => setDuration(e.target.value)} />
        </>
      )}

      <button onClick={handleSubmit} style={{ width: '100%', marginTop: 10 }}>
        保存
      </button>

      <hr />

      <button onClick={() => setShowList(!showList)} style={{ width: '100%', marginBottom: 10 }}>
        {showList ? '一覧を隠す' : '一覧を表示'}
      </button>

      {showList && (
        <div ref={taskListRef}>
          <h2>登録済みタスク</h2>
          {tasks.map((t, i) => (
            <div key={i} style={{ background: '#eef', padding: 10, marginBottom: 5 }}>
              <strong>{t.task}</strong><br />
              {t.deadline && <>期限: {t.deadline}</>} 
              {t.startDate && <>開始: {t.startDate} / 所要: {t.duration}時間</>}
            </div>
          ))}
        </div>
      )}
    </main>
  );
}
