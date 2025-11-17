import { Component, createSignal, Show } from 'solid-js';
import { importCSV, deleteImportSession } from '../services/expenseApi';
import { ApiException } from '../services/api';
import type { ImportResult, ImportSession } from '../../../shared/types';
import ConfirmOverwriteModal from './ConfirmOverwriteModal';

interface FileUploadProps {
  onImportComplete: (result: ImportResult) => void;
}

interface DuplicateResponse {
  isDuplicate: boolean;
  existingSession: ImportSession;
  message: string;
}

const FileUpload: Component<FileUploadProps> = (props) => {
  const [loading, setLoading] = createSignal(false);
  const [error, setError] = createSignal<string | null>(null);
  const [dragOver, setDragOver] = createSignal(false);
  const [showOverwriteModal, setShowOverwriteModal] = createSignal(false);
  const [duplicateSession, setDuplicateSession] = createSignal<ImportSession | null>(null);
  const [pendingFile, setPendingFile] = createSignal<File | null>(null);

  let fileInputRef: HTMLInputElement | undefined;

  const handleFileSelect = async (file: File) => {
    console.log('[FileUpload] handleFileSelect called with file:', file.name);

    // Validate file type
    if (!file.name.toLowerCase().endsWith('.csv')) {
      setError('Please select a CSV file');
      return;
    }

    // Validate file size (10MB max)
    if (file.size > 10 * 1024 * 1024) {
      setError('File size must be less than 10MB');
      return;
    }

    setError(null);
    setLoading(true);

    try {
      console.log('[FileUpload] Calling importCSV for file:', file.name);
      const result = await importCSV(file);
      console.log('[FileUpload] Import successful:', result);
      props.onImportComplete(result);

      // Reset file input
      if (fileInputRef) {
        fileInputRef.value = '';
      }
    } catch (err) {
      // Check if this is a duplicate import error (409 status)
      if (err instanceof ApiException && err.status === 409) {
        console.log('[FileUpload] Duplicate detected (409):', err.body);
        const duplicateData = err.body as DuplicateResponse;
        if (duplicateData.isDuplicate && duplicateData.existingSession) {
          // Show confirmation modal
          console.log('[FileUpload] Showing overwrite modal for session:', duplicateData.existingSession.id);
          setPendingFile(file);
          setDuplicateSession(duplicateData.existingSession);
          setShowOverwriteModal(true);
          setLoading(false);
          return;
        }
      }

      console.error('[FileUpload] Import error:', err);
      setError(err instanceof Error ? err.message : 'Failed to import CSV');
    } finally {
      setLoading(false);
    }
  };

  const handleFileInput = (e: Event) => {
    const target = e.target as HTMLInputElement;
    const file = target.files?.[0];
    if (file) {
      handleFileSelect(file);
    }
  };

  const handleDrop = (e: DragEvent) => {
    e.preventDefault();
    setDragOver(false);

    const file = e.dataTransfer?.files[0];
    if (file) {
      handleFileSelect(file);
    }
  };

  const handleDragOver = (e: DragEvent) => {
    e.preventDefault();
    setDragOver(true);
  };

  const handleDragLeave = () => {
    setDragOver(false);
  };

  const handleOverwriteConfirm = async () => {
    const session = duplicateSession();
    const file = pendingFile();

    console.log('[FileUpload] handleOverwriteConfirm - session:', session?.id, 'file:', file?.name);

    if (!session || !file) {
      console.warn('[FileUpload] Missing session or file in overwrite confirm');
      return;
    }

    setShowOverwriteModal(false);
    setLoading(true);

    try {
      console.log('[FileUpload] Deleting old session:', session.id);
      // Step 1: Delete the old import session (and all its expenses)
      const deleteResult = await deleteImportSession(session.id);
      console.log('[FileUpload] Delete result:', deleteResult);

      // Wait a moment to ensure database has committed the delete
      await new Promise(resolve => setTimeout(resolve, 100));

      console.log('[FileUpload] Re-importing file:', file.name);
      // Step 2: Re-import the file
      const result = await importCSV(file);
      console.log('[FileUpload] Overwrite successful:', result);
      props.onImportComplete(result);

      // Reset state - IMPORTANT: Clear all state to allow next import to work
      setPendingFile(null);
      setDuplicateSession(null);
      setShowOverwriteModal(false);
      setError(null);

      // Reset file input
      if (fileInputRef) {
        fileInputRef.value = '';
      }

      console.log('[FileUpload] State reset complete');
    } catch (err) {
      console.error('[FileUpload] Overwrite failed:', err);
      setError(err instanceof Error ? err.message : 'Failed to overwrite import');
      // Still reset state even on error
      setPendingFile(null);
      setDuplicateSession(null);
      setShowOverwriteModal(false);
    } finally {
      setLoading(false);
    }
  };

  const handleOverwriteCancel = () => {
    setShowOverwriteModal(false);
    setPendingFile(null);
    setDuplicateSession(null);

    // Reset file input
    if (fileInputRef) {
      fileInputRef.value = '';
    }
  };

  return (
    <div
      style={{
        'background-color': 'white',
        padding: '2rem',
        'border-radius': '0.5rem',
        'box-shadow': '0 1px 3px 0 rgba(0, 0, 0, 0.1)',
        'margin-bottom': '2rem',
      }}
    >
      <h2
        style={{
          'font-size': '1.25rem',
          'font-weight': '600',
          'margin-bottom': '1rem',
        }}
      >
        Import Expenses
      </h2>

      <div
        classList={{
          'upload-zone': true,
          'drag-over': dragOver(),
        }}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onClick={() => fileInputRef?.click()}
      >
        <input
          type="file"
          ref={fileInputRef}
          accept=".csv"
          style={{ display: 'none' }}
          onChange={handleFileInput}
          disabled={loading()}
        />

        <Show when={!loading()}>
          <div>
            <svg
              style={{
                width: '3rem',
                height: '3rem',
                margin: '0 auto 1rem',
                color: '#9ca3af',
              }}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
              />
            </svg>
            <p style={{ 'font-size': '1rem', 'margin-bottom': '0.5rem' }}>
              <span style={{ color: '#2563eb', 'font-weight': '500' }}>
                Click to upload
              </span>{' '}
              or drag and drop
            </p>
            <p style={{ 'font-size': '0.875rem', color: '#6b7280' }}>
              CSV files only (max 10MB)
            </p>
          </div>
        </Show>

        <Show when={loading()}>
          <div>
            <div
              style={{
                width: '3rem',
                height: '3rem',
                margin: '0 auto 1rem',
                border: '4px solid #e5e7eb',
                'border-top-color': '#2563eb',
                'border-radius': '50%',
                animation: 'spin 1s linear infinite',
              }}
            />
            <p style={{ 'font-size': '1rem', color: '#6b7280' }}>
              Importing...
            </p>
          </div>
        </Show>
      </div>

      <Show when={error()}>
        <div
          style={{
            'margin-top': '1rem',
            padding: '0.75rem 1rem',
            'background-color': '#fee2e2',
            border: '1px solid #fecaca',
            'border-radius': '0.375rem',
            color: '#991b1b',
            'font-size': '0.875rem',
          }}
        >
          {error()}
        </div>
      </Show>

      <style>
        {`
          .upload-zone {
            border: 2px dashed #d1d5db;
            border-radius: 0.5rem;
            padding: 2rem;
            text-align: center;
            background-color: #f9fafb;
            transition: all 0.2s;
            cursor: pointer;
          }

          .upload-zone.drag-over {
            border-color: #2563eb;
            background-color: #eff6ff;
          }

          @keyframes spin {
            to { transform: rotate(360deg); }
          }
        `}
      </style>

      <Show when={duplicateSession()}>
        <ConfirmOverwriteModal
          isOpen={showOverwriteModal()}
          existingSession={duplicateSession()!}
          onConfirm={handleOverwriteConfirm}
          onCancel={handleOverwriteCancel}
        />
      </Show>
    </div>
  );
};

export default FileUpload;
