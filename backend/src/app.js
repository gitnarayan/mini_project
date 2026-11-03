import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import { rateLimit } from 'express-rate-limit';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import mongoose from 'mongoose';
import { z } from 'zod';
import { User, Project } from './models.js';

const credentials = z.object({ email: z.email().max(254).transform(v => v.toLowerCase()), password: z.string().min(8).max(72).refine(v => Buffer.byteLength(v) <= 72, 'Password must fit within 72 bytes') }).strict();
const projectInput = z.object({ title: z.string().trim().min(1).max(120), description: z.string().trim().max(2000).default('') }).strict();
const taskInput = z.object({ title: z.string().trim().min(1).max(120), description: z.string().trim().max(2000).default(''), status: z.enum(['todo', 'in-progress', 'done']).default('todo'), dueDate: z.iso.date() }).strict();
const filters = z.object({ status: z.enum(['todo', 'in-progress', 'done']).optional(), sortBy: z.enum(['dueDate', 'status']).default('dueDate'), order: z.enum(['asc', 'desc']).default('asc'), dueFrom: z.iso.date().optional(), dueTo: z.iso.date().optional() }).strict();
const fail = (status, message) => Object.assign(new Error(message), { status });

export function createApp({ jwtSecret, clientOrigin = 'http://localhost:3000', production = false }) {
  if (!jwtSecret || jwtSecret.length < 32) throw new Error('JWT_SECRET must contain at least 32 characters');
  const app = express();
  app.use(helmet(), cors({ origin: clientOrigin, credentials: true }), express.json({ limit: '32kb' }), cookieParser());
  app.use((req, res, next) => {
    if (!['GET', 'HEAD', 'OPTIONS'].includes(req.method) && req.get('origin') !== clientOrigin) return res.status(403).json({ message: 'Untrusted request origin' });
    next();
  });
  const cookie = { httpOnly: true, secure: production, sameSite: 'lax', path: '/' };
  const session = (res, user) => {
    const token = jwt.sign({}, jwtSecret, { subject: String(user._id), expiresIn: '8h', algorithm: 'HS256', issuer: 'mini-project-manager', audience: 'mini-project-manager' });
    res.cookie('session', token, { ...cookie, maxAge: 8 * 60 * 60 * 1000 });
    return { id: user._id, email: user.email };
  };
  const auth = async (req, res, next) => {
    try {
      const payload = jwt.verify(req.cookies.session, jwtSecret, { algorithms: ['HS256'], issuer: 'mini-project-manager', audience: 'mini-project-manager' });
      req.user = await User.findById(payload.sub);
      if (!req.user) throw new Error();
      next();
    } catch { res.status(401).json({ message: 'Please log in to continue' }); }
  };
  app.get('/api/health', (req, res) => res.json({ status: 'ok' }));
  const limiter = rateLimit({ windowMs: 15 * 60 * 1000, limit: 50, standardHeaders: 'draft-8', legacyHeaders: false, message: { message: 'Too many attempts. Please try again later.' } });
  app.post('/api/auth/signup', limiter, async (req, res) => {
    const input = credentials.parse(req.body);
    const user = await User.create({ email: input.email, passwordHash: await bcrypt.hash(input.password, 12) });
    res.status(201).json(session(res, user));
  });
  app.post('/api/auth/login', limiter, async (req, res) => {
    const input = credentials.parse(req.body);
    const user = await User.findOne({ email: input.email }).select('+passwordHash');
    if (!user || !await bcrypt.compare(input.password, user.passwordHash)) throw fail(401, 'Invalid email or password');
    res.json(session(res, user));
  });
  app.post('/api/auth/logout', (req, res) => { res.clearCookie('session', cookie); res.status(204).end(); });
  app.get('/api/auth/me', auth, (req, res) => res.json({ id: req.user._id, email: req.user.email }));
  app.use('/api/projects', auth);
  app.get('/api/projects', async (req, res) => {
    const projects = await Project.find({ ownerId: req.user._id }).sort({ updatedAt: -1 });
    res.json(projects.map(p => ({ _id: p._id, title: p.title, description: p.description, taskCount: p.tasks.length, doneCount: p.tasks.filter(t => t.status === 'done').length })));
  });
  app.post('/api/projects', async (req, res) => res.status(201).json(await Project.create({ ...projectInput.parse(req.body), ownerId: req.user._id })));
  app.param('projectId', async (req, res, next, id) => {
    if (!mongoose.isObjectIdOrHexString(id)) throw fail(400, 'Invalid project ID');
    req.project = await Project.findOne({ _id: id, ownerId: req.user._id });
    if (!req.project) throw fail(404, 'Project not found');
    next();
  });
  app.get('/api/projects/:projectId', (req, res) => res.json(req.project));
  app.patch('/api/projects/:projectId', async (req, res) => {
    const input = projectInput.partial().parse(req.body);
    res.json(await Project.findOneAndUpdate({ _id: req.project._id, ownerId: req.user._id }, { $set: input }, { new: true, runValidators: true }));
  });
  app.delete('/api/projects/:projectId', async (req, res) => { await Project.deleteOne({ _id: req.project._id, ownerId: req.user._id }); res.status(204).end(); });
  app.get('/api/projects/:projectId/tasks', (req, res) => {
    const f = filters.parse(req.query);
    const ranks = { todo: 0, 'in-progress': 1, done: 2 };
    const tasks = req.project.tasks.filter(t => (!f.status || t.status === f.status) && (!f.dueFrom || t.dueDate >= f.dueFrom) && (!f.dueTo || t.dueDate <= f.dueTo));
    tasks.sort((a, b) => (f.sortBy === 'status' ? ranks[a.status] - ranks[b.status] : a.dueDate.localeCompare(b.dueDate)) * (f.order === 'desc' ? -1 : 1));
    res.json(tasks);
  });
  app.post('/api/projects/:projectId/tasks', async (req, res) => {
    const input = taskInput.parse(req.body);
    const task = { ...input, _id: new mongoose.Types.ObjectId() };
    const project = await Project.findOneAndUpdate({ _id: req.project._id, ownerId: req.user._id }, { $push: { tasks: task } }, { new: true, runValidators: true });
    res.status(201).json(project.tasks.id(task._id));
  });
  app.patch('/api/projects/:projectId/tasks/:taskId', async (req, res) => {
    if (!mongoose.isObjectIdOrHexString(req.params.taskId)) throw fail(400, 'Invalid task ID');
    const input = taskInput.partial().parse(req.body);
    const updates = Object.fromEntries(Object.entries(input).map(([k, v]) => [`tasks.$.${k}`, v]));
    const project = await Project.findOneAndUpdate({ _id: req.project._id, ownerId: req.user._id, 'tasks._id': req.params.taskId }, { $set: updates }, { new: true, runValidators: true });
    if (!project) throw fail(404, 'Task not found');
    res.json(project.tasks.id(req.params.taskId));
  });
  app.delete('/api/projects/:projectId/tasks/:taskId', async (req, res) => {
    if (!mongoose.isObjectIdOrHexString(req.params.taskId)) throw fail(400, 'Invalid task ID');
    const result = await Project.updateOne({ _id: req.project._id, ownerId: req.user._id, 'tasks._id': req.params.taskId }, { $pull: { tasks: { _id: req.params.taskId } } });
    if (!result.matchedCount) throw fail(404, 'Task not found');
    res.status(204).end();
  });
  app.use((req, res) => res.status(404).json({ message: 'Endpoint not found' }));
  app.use((err, req, res, next) => {
    if (err instanceof z.ZodError) return res.status(400).json({ message: err.issues.map(i => `${i.path.join('.')}: ${i.message}`).join('; ') });
    if (err.code === 11000) return res.status(409).json({ message: 'Email already registered' });
    const status = err.status || 500;
    if (status === 500) console.error(err);
    res.status(status).json({ message: status === 500 ? 'Something went wrong. Please try again.' : err.message });
  });
  return app;
}
