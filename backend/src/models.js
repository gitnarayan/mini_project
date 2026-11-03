import mongoose from 'mongoose';
const { Schema } = mongoose;
export const User = mongoose.model('User', new Schema({ email: { type: String, required: true, unique: true }, passwordHash: { type: String, required: true, select: false } }, { timestamps: true }));
// Tasks are embedded: project ownership protects every task and deletion is atomic.
const task = new Schema({ title: { type: String, required: true }, description: { type: String, default: '' }, status: { type: String, enum: ['todo', 'in-progress', 'done'], default: 'todo' }, dueDate: { type: String, required: true } }, { timestamps: true });
const project = new Schema({ ownerId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true }, title: { type: String, required: true }, description: { type: String, default: '' }, tasks: [task] }, { timestamps: true });
export const Project = mongoose.model('Project', project);
