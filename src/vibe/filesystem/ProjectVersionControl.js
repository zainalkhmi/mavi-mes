/**
 * ProjectVersionControl.js
 * Snapshot-based version history and undo/redo system for MaviCore Vibe Coding.
 * Keeps an immutable timeline of project snapshots before and after AI modifications.
 */

export class ProjectVersionControl {
  constructor(maxSnapshots = 20) {
    this.maxSnapshots = maxSnapshots;
    /** @type {Array<{ id: string, timestamp: Date, label: string, files: Record<string, string>, metadata?: object }>} */
    this.snapshots = [];
    this.currentIndex = -1;
  }

  /**
   * Creates a snapshot of the current file system state
   * @param {Record<string, string>} filesRecord
   * @param {string} label
   * @param {object} metadata
   * @returns {string} snapshotId
   */
  createSnapshot(filesRecord, label = 'AI Update', metadata = {}) {
    const id = `snap_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
    const snapshot = {
      id,
      timestamp: new Date(),
      label,
      files: JSON.parse(JSON.stringify(filesRecord)),
      metadata
    };

    // If we branched or rewound, truncate forward history
    if (this.currentIndex < this.snapshots.length - 1) {
      this.snapshots = this.snapshots.slice(0, this.currentIndex + 1);
    }

    this.snapshots.push(snapshot);
    if (this.snapshots.length > this.maxSnapshots) {
      this.snapshots.shift();
    }
    this.currentIndex = this.snapshots.length - 1;

    return id;
  }

  /**
   * Can we undo to an earlier snapshot?
   */
  canUndo() {
    return this.currentIndex > 0;
  }

  /**
   * Can we redo forward?
   */
  canRedo() {
    return this.currentIndex < this.snapshots.length - 1;
  }

  /**
   * Undo to previous snapshot
   * @returns {object | null} snapshot
   */
  undo() {
    if (!this.canUndo()) return null;
    this.currentIndex -= 1;
    return this.snapshots[this.currentIndex];
  }

  /**
   * Redo to next snapshot
   * @returns {object | null} snapshot
   */
  redo() {
    if (!this.canRedo()) return null;
    this.currentIndex += 1;
    return this.snapshots[this.currentIndex];
  }

  /**
   * Restores a specific snapshot by ID
   * @param {string} snapshotId
   * @returns {object | null}
   */
  restore(snapshotId) {
    const idx = this.snapshots.findIndex(s => s.id === snapshotId);
    if (idx !== -1) {
      this.currentIndex = idx;
      return this.snapshots[idx];
    }
    return null;
  }

  /**
   * Computes file-level diff between two file records
   * @param {Record<string, string>} oldFiles
   * @param {Record<string, string>} newFiles
   * @returns {Array<{ path: string, type: 'created'|'modified'|'deleted', oldContent?: string, newContent?: string }>}
   */
  static computeDiff(oldFiles = {}, newFiles = {}) {
    const diffs = [];
    const allPaths = new Set([...Object.keys(oldFiles), ...Object.keys(newFiles)]);

    for (const path of Array.from(allPaths).sort()) {
      const hadOld = Object.prototype.hasOwnProperty.call(oldFiles, path);
      const hasNew = Object.prototype.hasOwnProperty.call(newFiles, path);

      if (!hadOld && hasNew) {
        diffs.push({ path, type: 'created', newContent: newFiles[path] });
      } else if (hadOld && !hasNew) {
        diffs.push({ path, type: 'deleted', oldContent: oldFiles[path] });
      } else if (hadOld && hasNew && oldFiles[path] !== newFiles[path]) {
        diffs.push({
          path,
          type: 'modified',
          oldContent: oldFiles[path],
          newContent: newFiles[path]
        });
      }
    }
    return diffs;
  }
}
