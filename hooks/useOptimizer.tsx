import {useState, useEffect, useCallback, useRef} from 'react';
import {v4 as uuidv4} from 'uuid';
import JSZip from 'jszip';
import {ImageJob, OptimizerConfiguration} from '../types';
import {
  processImageInWorker,
  cancelAllWorkers,
} from '../services/workerService';
import {
  saveJobToDb,
  deleteJobFromDb,
  clearDb,
  getAllJobsFromDb,
} from '../services/storageService';
import {validateAndSanitizeFile} from '../utils';

class ResourceManager {
  private allocations: Map<string, Set<string>> = new Map();

  allocateView(scopeId: string, blob: Blob | File): string {
    const url = URL.createObjectURL(blob);
    if (!this.allocations.has(scopeId)) {
      this.allocations.set(scopeId, new Set());
    }
    this.allocations.get(scopeId)?.add(url);
    return url;
  }

  free(scopeId: string): void {
    const urls = this.allocations.get(scopeId);
    if (urls) {
      urls.forEach(url => URL.revokeObjectURL(url));
      this.allocations.delete(scopeId);
    }
  }

  garbageCollect(): void {
    for (const scopeId of this.allocations.keys()) {
      this.free(scopeId);
    }
  }
}

const calculateEstimatedDuration = (
  file: File,
  settings: OptimizerConfiguration,
): number => {
  const isFastPath =
    file.type === 'image/png' &&
    settings.resize.mode === 'off' &&
    !settings.palette.enabled &&
    settings.outputFormat !== 'webp' &&
    settings.outputFormat !== 'jpeg' &&
    settings.outputFormat !== 'avif' &&
    settings.outputFormat !== 'qoi' &&
    settings.outputFormat !== 'jxl';

  if (isFastPath) {
    return 200 + (file.size / 1024 / 1024) * 100;
  }

  const sizeInMB = file.size / (1024 * 1024);

  let durationMs = 1500 + sizeInMB * 3000;

  durationMs *= 1 + settings.level * 0.1;
  if (settings.palette.enabled) durationMs *= 2.0;
  if (settings.resize.mode !== 'off') durationMs *= 1.3;
  if (settings.outputFormat === 'avif') durationMs *= 2.5;
  if (settings.outputFormat === 'qoi') durationMs *= 0.5;

  return Math.min(Math.round(durationMs), 60000);
};

export const useOptimizer = (settings: OptimizerConfiguration) => {
  const [jobs, setJobs] = useState<ImageJob[]>([]);
  const [activeJobCount, setActiveJobCount] = useState(0);
  const [isRestoring, setIsRestoring] = useState(true);

  const resourceManager = useRef(new ResourceManager());

  const activeCountRef = useRef(0);
  const settingsRef = useRef(settings);

  useEffect(() => {
    activeCountRef.current = activeJobCount;
  }, [activeJobCount]);
  useEffect(() => {
    settingsRef.current = settings;
  }, [settings]);

  useEffect(() => {
    if (settings.disableStorage) {
      setIsRestoring(false);
      return;
    }

    const restoreSession = async () => {
      try {
        const persistedJobs = await getAllJobsFromDb();

        if (persistedJobs.length > 0) {
          const hydratedJobs = persistedJobs.map(job => ({
            ...job,
            previewUrl: resourceManager.current.allocateView(job.id, job.file),
          }));
          setJobs(hydratedJobs);
        }
      } catch (e) {
        console.error('Failed to restore session', e);
      } finally {
        setIsRestoring(false);
      }
    };
    void restoreSession();

    return () => resourceManager.current.garbageCollect();
  }, [settings.disableStorage]);

  useEffect(() => {
    if (settings.disableStorage) {
      void clearDb();
    }
  }, [settings.disableStorage]);

  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (activeJobCount > 0) {
        e.preventDefault();
        e.returnValue = '';
        return '';
      }
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [activeJobCount]);

  const addFiles = useCallback(async (files: File[]): Promise<number> => {
    const expandedFiles: File[] = [];

    for (const file of files) {
      if (
        file.type === 'application/zip' ||
        file.type === 'application/x-zip-compressed' ||
        file.name.endsWith('.zip')
      ) {
        try {
          const zip = await JSZip.loadAsync(file);
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const entries = Object.values(zip.files) as any[];
          for (const entry of entries) {
            if (!entry.dir) {
              const lowerName = entry.name.toLowerCase();
              if (
                lowerName.match(/\.(png|jpg|jpeg|webp|avif|qoi|jxl|gif|svg)$/)
              ) {
                const blob = await entry.async('blob');
                let type = blob.type;
                if (!type || type === 'application/octet-stream') {
                  if (lowerName.endsWith('.png')) type = 'image/png';
                  else if (
                    lowerName.endsWith('.jpg') ||
                    lowerName.endsWith('.jpeg')
                  )
                    type = 'image/jpeg';
                  else if (lowerName.endsWith('.webp')) type = 'image/webp';
                  else if (lowerName.endsWith('.avif')) type = 'image/avif';
                  else if (lowerName.endsWith('.gif')) type = 'image/gif';
                  else if (lowerName.endsWith('.qoi')) type = 'image/qoi';
                  else if (lowerName.endsWith('.jxl')) type = 'image/jxl';
                  else if (lowerName.endsWith('.svg')) type = 'image/svg+xml';
                }
                const extractedFile = new File(
                  [blob],
                  entry.name.split('/').pop() || entry.name,
                  {type},
                );
                expandedFiles.push(extractedFile);
              }
            }
          }
        } catch (err) {
          console.warn('Failed to unzip', file.name, err);
        }
      } else {
        expandedFiles.push(file);
      }
    }

    const validFiles: File[] = [];
    let rejectedCount = 0;

    for (const file of expandedFiles) {
      const validated = await validateAndSanitizeFile(file);
      if (validated) {
        validFiles.push(validated);
      } else {
        rejectedCount++;
      }
    }

    if (validFiles.length === 0) return rejectedCount;

    const newJobs: ImageJob[] = validFiles.map(file => {
      const id = uuidv4();
      const previewUrl = resourceManager.current.allocateView(id, file);

      const job: ImageJob = {
        id,
        file,
        previewUrl,
        status: 'queued',
        progress: 0,
      };
      return job;
    });

    setJobs(previousJobs => [...previousJobs, ...newJobs]);

    if (!settingsRef.current.disableStorage) {
      for (const job of newJobs) {
        await saveJobToDb(job);
      }
    }

    return rejectedCount;
  }, []);

  const removeJob = useCallback((id: string) => {
    resourceManager.current.free(id);
    setJobs(previousJobs => previousJobs.filter(job => job.id !== id));

    if (!settingsRef.current.disableStorage) {
      void deleteJobFromDb(id);
    }
  }, []);

  const clearAll = useCallback(() => {
    cancelAllWorkers();

    jobs.forEach(job => resourceManager.current.free(job.id));

    setJobs([]);
    void clearDb();
  }, [jobs]);

  const clearCompleted = useCallback(() => {
    setJobs(previousJobs => {
      const jobsToRemove = previousJobs.filter(
        job => job.status === 'done' || job.status === 'error',
      );

      jobsToRemove.forEach(job => {
        resourceManager.current.free(job.id);
        if (!settingsRef.current.disableStorage) {
          void deleteJobFromDb(job.id);
        }
      });

      return previousJobs.filter(
        job => job.status !== 'done' && job.status !== 'error',
      );
    });
  }, []);

  const updateJob = useCallback((id: string, updates: Partial<ImageJob>) => {
    setJobs(previousJobs => {
      return previousJobs.map(job => {
        if (job.id === id) {
          const updatedJob = {...job, ...updates};

          const statusChanged = updates.status && updates.status !== job.status;
          const isDone =
            updates.status === 'done' || updates.status === 'error';

          if (
            !settingsRef.current.disableStorage &&
            (statusChanged || isDone)
          ) {
            void saveJobToDb(updatedJob);
          }

          return updatedJob;
        }
        return job;
      });
    });
  }, []);

  const processJob = useCallback(
    async (job: ImageJob) => {
      try {
        setActiveJobCount(prev => prev + 1);

        const currentSettings = settingsRef.current;

        let outputFormat = currentSettings.outputFormat;
        if (currentSettings.maintainOriginalFormat) {
          const t = job.file.type;
          if (t === 'image/png') outputFormat = 'png';
          else if (t === 'image/jpeg') outputFormat = 'jpeg';
          else if (t === 'image/webp') outputFormat = 'webp';
          else if (t === 'image/avif') outputFormat = 'avif';
          else if (t === 'image/jxl') outputFormat = 'jxl';
          else if (t === 'image/qoi') outputFormat = 'qoi';
        }

        const effectiveSettings = {...currentSettings, outputFormat};

        const estimatedDuration = calculateEstimatedDuration(
          job.file,
          effectiveSettings,
        );

        const startedAt = Date.now();
        updateJob(job.id, {
          status: 'processing',
          progress: 0,
          estimatedDuration,
          startedAt,
        });

        if (job.file.type === 'image/svg+xml') {
          updateJob(job.id, {
            status: 'done',
            progress: 100,
            optimizedBlob: job.file,
            completedAt: Date.now(),
            stats: {
              originalSize: job.file.size,
              optimizedSize: job.file.size,
              timeTaken: 0,
              isOriginal: true,
            },
          });
          return;
        }

        const {buffer: optimizedBuffer, time} = await processImageInWorker(
          job.file,
          effectiveSettings,
        );

        let outputMimeType = 'image/png';
        if (effectiveSettings.outputFormat === 'webp')
          outputMimeType = 'image/webp';
        if (effectiveSettings.outputFormat === 'jpeg')
          outputMimeType = 'image/jpeg';
        if (effectiveSettings.outputFormat === 'avif')
          outputMimeType = 'image/avif';
        if (effectiveSettings.outputFormat === 'qoi')
          outputMimeType = 'image/qoi';
        if (effectiveSettings.outputFormat === 'jxl')
          outputMimeType = 'image/jxl';

        const finalBlob = new Blob([optimizedBuffer], {type: outputMimeType});

        const isOriginal = false;

        updateJob(job.id, {
          status: 'done',
          progress: 100,
          optimizedBlob: finalBlob,
          completedAt: Date.now(),
          stats: {
            originalSize: job.file.size,
            optimizedSize: finalBlob.size,
            timeTaken: time,
            isOriginal,
          },
        });
      } catch (error) {
        const err = error as Error;
        if (err.message !== 'Cancelled') {
          console.error('Job Failed', error);
        }
        updateJob(job.id, {
          status: 'error',
          error: err.message || 'Unknown error',
          progress: 100,
          completedAt: Date.now(),
        });
      } finally {
        setActiveJobCount(prev => Math.max(0, prev - 1));
      }
    },
    [updateJob],
  );

  useEffect(() => {
    if (isRestoring) return;

    const queuedJobs = jobs.filter(job => job.status === 'queued');
    const concurrencyLimit = settingsRef.current.concurrency || 5;

    if (queuedJobs.length > 0 && activeCountRef.current < concurrencyLimit) {
      const availableSlots = concurrencyLimit - activeCountRef.current;

      const prioritizedQueue = [...queuedJobs].sort(
        (a, b) => a.file.size - b.file.size,
      );
      const nextBatch = prioritizedQueue.slice(0, availableSlots);

      for (const job of nextBatch) {
        updateJob(job.id, {status: 'processing'});
        void processJob(job);
      }
    }
  }, [jobs, activeJobCount, processJob, updateJob, isRestoring]);

  return {
    jobs,
    addFiles,
    removeJob,
    clearCompleted,
    clearAll,
    isProcessing: activeJobCount > 0,
    isRestoring,
  };
};
