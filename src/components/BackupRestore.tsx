import { useState, useRef } from 'react';
import { exportBackup, downloadBackup, restoreBackup } from '@/lib/backup';
import type { BackupData } from '@/lib/types';
import { DatabaseBackup, Download, Upload, AlertTriangle, Check, FileJson, RefreshCw, X } from 'lucide-react';

interface BackupRestoreProps {
  onRefresh: () => void;
}

export function BackupRestore({ onRefresh }: BackupRestoreProps) {
  const [exporting, setExporting] = useState(false);
  const [importing, setImporting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [pendingData, setPendingData] = useState<BackupData | null>(null);
  const [restoreMode, setRestoreMode] = useState<'replace' | 'merge'>('replace');
  const [dragOver, setDragOver] = useState(false);
  const fileInput = useRef<HTMLInputElement>(null);

  const handleExport = async () => {
    setExporting(true);
    setError(null);
    setSuccess(null);
    try {
      const data = await exportBackup();
      downloadBackup(data);
      setSuccess(`Backup downloaded with ${data.years.length} years, ${data.rows.length} rows, ${data.plants.length} plants, and ${data.observations.length} observations.`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to export backup.');
    } finally {
      setExporting(false);
    }
  };

  const handleFile = async (file: File) => {
    setError(null);
    setSuccess(null);
    setPendingData(null);
    try {
      const text = await file.text();
      const data = JSON.parse(text) as BackupData;
      if (!data.version || data.version !== 1) {
        setError('Invalid backup file: unsupported version.');
        return;
      }
      setPendingData(data);
    } catch {
      setError('Could not read the file. Make sure it is a valid JSON backup file.');
    }
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file) handleFile(file);
  };

  const handleRestore = async () => {
    if (!pendingData) return;
    setImporting(true);
    setError(null);
    setSuccess(null);
    try {
      await restoreBackup(pendingData, restoreMode);
      setSuccess(`Restore complete! ${pendingData.years.length} years, ${pendingData.rows.length} rows, ${pendingData.plants.length} plants, and ${pendingData.observations.length} observations imported.`);
      setPendingData(null);
      onRefresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to restore backup.');
    } finally {
      setImporting(false);
    }
  };

  const dismissPending = () => {
    setPendingData(null);
    if (fileInput.current) fileInput.current.value = '';
  };

  return (
    <div className="p-6 lg:p-8 max-w-3xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-stone-800">Backup & Restore</h1>
        <p className="text-sm text-stone-400 mt-1">Download your farm data to a file, or restore it from a previous backup.</p>
      </div>

      {/* Export card */}
      <div className="bg-white rounded-xl border border-stone-200 p-6">
        <div className="flex items-start gap-4">
          <div className="w-11 h-11 rounded-xl bg-emerald-50 flex items-center justify-center flex-shrink-0">
            <Download className="w-5 h-5 text-emerald-600" />
          </div>
          <div className="flex-1">
            <h3 className="font-semibold text-stone-800">Download Backup</h3>
            <p className="text-sm text-stone-400 mt-1 mb-4">
              Saves all your years, rows, plants, and observations into a single JSON file on your computer. Keep this file somewhere safe.
            </p>
            <button
              onClick={handleExport}
              disabled={exporting}
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-emerald-600 text-white text-sm font-medium rounded-lg hover:bg-emerald-700 transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {exporting ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
              {exporting ? 'Preparing...' : 'Download Backup'}
            </button>
          </div>
        </div>
      </div>

      {/* Import card */}
      <div className="bg-white rounded-xl border border-stone-200 p-6">
        <div className="flex items-start gap-4">
          <div className="w-11 h-11 rounded-xl bg-sky-50 flex items-center justify-center flex-shrink-0">
            <Upload className="w-5 h-5 text-sky-600" />
          </div>
          <div className="flex-1">
            <h3 className="font-semibold text-stone-800">Restore from Backup</h3>
            <p className="text-sm text-stone-400 mt-1 mb-4">
              Upload a previously saved backup file to restore your data. Choose whether to replace everything or merge with existing data.
            </p>

            <input
              ref={fileInput}
              type="file"
              accept="application/json,.json"
              onChange={handleFileInput}
              className="hidden"
            />

            {/* Drop zone */}
            <div
              onClick={() => fileInput.current?.click()}
              onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
              onDragLeave={() => setDragOver(false)}
              onDrop={handleDrop}
              className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all ${
                dragOver ? 'border-emerald-400 bg-emerald-50' : 'border-stone-200 hover:border-stone-300 hover:bg-stone-50'
              }`}
            >
              <FileJson className="w-8 h-8 text-stone-300 mx-auto mb-2" />
              <p className="text-sm text-stone-500 font-medium">
                {dragOver ? 'Drop your backup file here' : 'Click to select or drag a JSON file'}
              </p>
              <p className="text-xs text-stone-400 mt-1">Accepts .json files only</p>
            </div>
          </div>
        </div>
      </div>

      {/* Pending restore confirmation */}
      {pendingData && (
        <div className="bg-white rounded-xl border-2 border-amber-200 p-6 space-y-4">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-lg bg-amber-50 flex items-center justify-center flex-shrink-0">
              <AlertTriangle className="w-5 h-5 text-amber-600" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-stone-800">Confirm Restore</h3>
              <p className="text-sm text-stone-400 mt-1">
                This backup contains {pendingData.years.length} years, {pendingData.rows.length} rows, {pendingData.plants.length} plants, and {pendingData.observations.length} observations.
                {' '}Exported on {new Date(pendingData.exported_at).toLocaleString()}.
              </p>
            </div>
            <button onClick={dismissPending} className="p-1.5 rounded-lg hover:bg-stone-100 text-stone-400">
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Mode selector */}
          <div className="space-y-2">
            <label className="flex items-start gap-3 p-3 rounded-lg border border-stone-200 cursor-pointer hover:bg-stone-50 transition-colors">
              <input
                type="radio"
                name="restoreMode"
                checked={restoreMode === 'replace'}
                onChange={() => setRestoreMode('replace')}
                className="mt-0.5 accent-emerald-600"
              />
              <div>
                <p className="text-sm font-medium text-stone-700">Replace all data</p>
                <p className="text-xs text-stone-400 mt-0.5">Deletes everything currently in the database, then imports the backup. This cannot be undone.</p>
              </div>
            </label>
            <label className="flex items-start gap-3 p-3 rounded-lg border border-stone-200 cursor-pointer hover:bg-stone-50 transition-colors">
              <input
                type="radio"
                name="restoreMode"
                checked={restoreMode === 'merge'}
                onChange={() => setRestoreMode('merge')}
                className="mt-0.5 accent-emerald-600"
              />
              <div>
                <p className="text-sm font-medium text-stone-700">Merge with existing</p>
                <p className="text-xs text-stone-400 mt-0.5">Adds backup data alongside what's already there. Items with the same ID are skipped.</p>
              </div>
            </label>
          </div>

          <button
            onClick={handleRestore}
            disabled={importing}
            className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-amber-500 text-white text-sm font-medium rounded-lg hover:bg-amber-600 transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {importing ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
            {importing ? 'Restoring...' : `Restore (${restoreMode === 'replace' ? 'Replace' : 'Merge'})`}
          </button>
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}

      {/* Success */}
      {success && (
        <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 flex items-start gap-3">
          <Check className="w-5 h-5 text-emerald-600 flex-shrink-0 mt-0.5" />
          <p className="text-sm text-emerald-700">{success}</p>
        </div>
      )}

      {/* Info card */}
      <div className="bg-stone-50 rounded-xl border border-stone-200 p-5">
        <div className="flex items-start gap-3">
          <DatabaseBackup className="w-5 h-5 text-stone-400 flex-shrink-0 mt-0.5" />
          <div>
            <h4 className="text-sm font-medium text-stone-600">How backups work</h4>
            <ul className="text-xs text-stone-400 mt-1.5 space-y-1">
              <li>The backup file contains all your farm data in a single JSON file.</li>
              <li>Keep it on your computer or cloud storage as a safety copy.</li>
              <li>Use Restore to bring data back after accidental deletion or to move data between projects.</li>
              <li>Replace mode wipes the database first; Merge mode adds without overwriting existing entries.</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
