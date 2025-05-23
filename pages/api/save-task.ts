let tasks: any[] = [];

export default function handler(req, res) {
  if (req.method === 'POST') {
    const newTask = req.body;
    tasks.push(newTask);
    return res.status(200).json({ message: '保存成功' });
  }

  if (req.method === 'GET') {
    return res.status(200).json({ tasks });
  }

  return res.status(405).json({ message: '許可されていないメソッドです' });
}
