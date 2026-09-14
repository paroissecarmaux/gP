(function (gP) {
  'use strict';

  const taskRepository = new gP.db.Repository('tasks', 'Tâche');
  const taskAssignmentRepository = new gP.db.Repository('taskAssignments', 'Affectation de tâche');

  const STATUSES = ['À faire', 'En cours', 'Terminé', 'Annulé'];
  const PRIORITIES = ['Normale', 'Importante', 'Urgente'];

  function isOverdue(task) {
    return task.status !== 'Terminé' && task.status !== 'Annulé' && task.dueDate && new Date(task.dueDate) < new Date();
  }

  async function listAssignmentsFor(taskId) {
    const all = await taskAssignmentRepository.list();
    return all.filter((row) => row.taskId === taskId);
  }

  async function assignPerson(taskId, personId) {
    return taskAssignmentRepository.create({ taskId, personId, groupId: null });
  }

  async function assignGroup(taskId, groupId) {
    return taskAssignmentRepository.create({ taskId, personId: null, groupId });
  }

  async function removeAssignment(assignmentId) {
    return taskAssignmentRepository.remove(assignmentId);
  }

  Object.assign(gP.services, {
    taskRepository,
    taskAssignmentRepository,
    TASK_STATUSES: STATUSES,
    TASK_PRIORITIES: PRIORITIES,
    isTaskOverdue: isOverdue,
    listAssignmentsFor,
    assignPersonToTask: assignPerson,
    assignGroupToTask: assignGroup,
    removeTaskAssignment: removeAssignment,
  });

  gP.db.registerEntity({ key: 'tasks', label: 'Tâche', repository: taskRepository, searchFields: ['title', 'description'], path: '/taches' });
})(window.gP);
