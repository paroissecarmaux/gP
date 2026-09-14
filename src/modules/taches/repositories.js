import { Repository } from '../../db/repository.js';
import { registerEntity } from '../../db/registry.js';

export const taskRepository = new Repository('tasks', 'Tâche');

registerEntity({ key: 'tasks', label: 'Tâches', repository: taskRepository, searchFields: ['title', 'description'], path: '/taches' });
