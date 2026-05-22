const express = require('express');
const { PrismaClient } = require('@prisma/client');
const cors = require('cors');

const app = express();
const prisma = new PrismaClient();

app.use(cors());
app.use(express.json());
const cacheService = require('./services/cacheService');

// GET /tasks
app.get('/tasks', async (req, res, next) => {
  try {
    const cacheKey = 'tasks:list';
    
    if (cacheService.has(cacheKey)) {
      console.log('Serving from cache');
      const cachedResult = cacheService.get(cacheKey);
      return res.status(200).json(cachedResult);
    }

    const tasks = await prisma.task.findMany();
    cacheService.set(cacheKey, tasks, 60); // cache for 60 seconds
    
    res.status(200).json(tasks);
  } catch (err) {
    next(err);
  }
});

// GET /tasks/:id
app.get('/tasks/:id', async (req, res, next) => {
  const { id } = req.params;
  const cacheKey = `task:${id}`;

  try {
    if (cacheService.has(cacheKey)) {
      return res.status(200).json(cacheService.get(cacheKey));
    }

    const task = await prisma.task.findUnique({
      where: { id: parseInt(id) }
    });

    if (!task) {
      return res.status(404).json({ message: 'Task not found' });
    }

    cacheService.set(cacheKey, task, 60);
    
    res.status(200).json(task);
  } catch (err) {
    next(err);
  }
});

// POST /tasks
app.post('/tasks', async (req, res, next) => {
  const { title, description, price } = req.body;
  
  if (!title || !description || price === undefined) {
    return res.status(400).json({ message: 'Missing required fields' });
  }

  try {
    const newTask = await prisma.task.create({
      data: { title, description, price: parseFloat(price) }
    });

    cacheService.del('tasks:list');
    
    res.status(201).json(newTask);
  } catch (err) {
    next(err);
  }
});

// DELETE /tasks/:id
app.delete('/tasks/:id', async (req, res, next) => {
  const { id } = req.params;
  try {
    await prisma.task.delete({
      where: { id: parseInt(id) }
    });

    cacheService.del('tasks:list');
    cacheService.del(`task:${id}`);
    
    res.status(204).send();
  } catch (err) {
    if (err.code === 'P2025') {
      return res.status(404).json({ message: 'Task not found' });
    }
    next(err);
  }
});

// Central error handling middleware
app.use((err, req, res, next) => {
  console.error('Unhandled Error:', err);
  res.status(500).json({ message: 'Internal Server Error' });
});

const PORT = 5000;
app.listen(PORT, () => {
  console.log(`Broken Server running on http://localhost:${PORT}`);
});
