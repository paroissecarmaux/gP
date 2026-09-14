import { AppError } from '../errors/AppError.js';

let currentInstallationId = null;

export function setCurrentInstallationId(id) {
  currentInstallationId = id;
}

export function getCurrentInstallationId() {
  if (!currentInstallationId) {
    throw new AppError('Installation courante non initialisée');
  }
  return currentInstallationId;
}
