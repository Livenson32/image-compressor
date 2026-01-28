import React, {memo, useState, useEffect, useCallback, useRef} from 'react';
import {
  Download,
  Trash2,
  Check,
  Loader2,
  Info,
  Copy,
  Eye,
  MoveDiagonal,
  Timer,
  FileWarning,
} from 'lucide-react';
import {clsx} from 'clsx';
import {ImageJob} from '../types';
import {formatBytes, downloadJob} from '../utils';

interface JobCardProps {
  job: ImageJob;
  onRemove: (id: string) => void;
  onCopySuccess: () => void;
  onInspect: (job: ImageJob) => void;
  downloadFilename: string;
  displayName: string;
}

const JobCardComponent = ({
  job,
  onRemove,
  onCopySuccess,
  onInspect,
  downloadFilename,
  displayName,
}: JobCardProps) => {
  const isDone = job.status === 'done';
  const isError = job.status === 'error';
  const isProcessing = job.status === 'processing';
  const isQueued = job.status === 'queued';
  const isOriginal = job.stats?.isOriginal;

  const isUnsupportedPreview = job.optimizedBlob?.type === 'image/qoi';

  const [displayedProgress, setDisplayedProgress] = useState(0);

  useEffect(() => {
    let timer: ReturnType<typeof setTimeout>;

    if (job.status === 'queued') {
      setDisplayedProgress(0);
    } else if (job.status === 'processing') {
      timer = setTimeout(() => {
        setDisplayedProgress(95);
      }, 50);
    } else if (job.status === 'done' || job.status === 'error') {
      setDisplayedProgress(100);
    }
    return () => clearTimeout(timer);
  }, [job.status]);

  let percentChange = '0';
  let isSizeIncreased = false;
  let durationLabel = '';

  if (job.stats) {
    const diff = job.stats.optimizedSize - job.stats.originalSize;
    const percentage = (Math.abs(diff) / job.stats.originalSize) * 100;
    percentChange = percentage.toFixed(1);
    isSizeIncreased = diff > 0;

    const ms = job.stats.timeTaken;
    durationLabel =
      ms < 1000 ? `${Math.round(ms)}ms` : `${(ms / 1000).toFixed(1)}s`;
  }

  const handleCopy = async () => {
    if (job.optimizedBlob) {
      try {
        await navigator.clipboard.write([
          new ClipboardItem({
            [job.optimizedBlob.type]: job.optimizedBlob,
          }),
        ]);
        onCopySuccess();
      } catch (err) {
        console.error('Failed to copy to clipboard', err);
      }
    }
  };

  const [optimizedUrl, setOptimizedUrl] = useState<string | null>(null);
  const [isPeeking, setIsPeeking] = useState(false);

  const pressTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isLongPress = useRef(false);

  useEffect(() => {
    if (job.optimizedBlob && !optimizedUrl && !isUnsupportedPreview) {
      setOptimizedUrl(URL.createObjectURL(job.optimizedBlob));
    }
    return () => {
      if (optimizedUrl) URL.revokeObjectURL(optimizedUrl);
    };
  }, [job.optimizedBlob, optimizedUrl, isUnsupportedPreview]);

  const handlePointerDown = useCallback(
    (e: React.PointerEvent) => {
      if (!isDone || e.button !== 0) return;
      isLongPress.current = false;
      pressTimer.current = setTimeout(() => {
        isLongPress.current = true;
        setIsPeeking(true);
      }, 150);
    },
    [isDone],
  );

  const handlePointerUp = useCallback(
    (e: React.PointerEvent) => {
      if (!isDone || e.button !== 0) return;

      if (pressTimer.current) {
        clearTimeout(pressTimer.current);
        pressTimer.current = null;
      }

      if (isLongPress.current) {
        setIsPeeking(false);
        isLongPress.current = false;
      } else {
        onInspect(job);
      }
    },
    [isDone, job, onInspect],
  );

  const handlePointerCancel = useCallback(() => {
    if (pressTimer.current) clearTimeout(pressTimer.current);
    setIsPeeking(false);
    isLongPress.current = false;
  }, []);

  return (
    <div
      className="bg-white dark:bg-slate-900 rounded-2xl p-5 shadow-sm border border-gray-100 dark:border-slate-700 hover:shadow-md transition-shadow relative overflow-hidden group"
      style={{contentVisibility: 'auto', contain: 'content'}}
      role="listitem"
    >
      <div className="flex gap-5 items-center">
        <div
          className="relative cursor-pointer group/thumb select-none touch-manipulation"
          onPointerDown={handlePointerDown}
          onPointerUp={handlePointerUp}
          onPointerLeave={handlePointerCancel}
          onPointerCancel={handlePointerCancel}
          title="Hold to see original, Click to compare"
        >
          <div
            className={clsx(
              'w-16 h-16 bg-gray-50 dark:bg-black/20 rounded-xl overflow-hidden border relative transition-all duration-200',
              isPeeking
                ? 'border-gleam-pink ring-2 ring-gleam-pink ring-offset-2 scale-110 z-10'
                : 'border-gray-100 dark:border-white/10',
            )}
          >
            <img
              src={
                isPeeking
                  ? job.previewUrl
                  : isUnsupportedPreview
                    ? job.previewUrl
                    : optimizedUrl || job.previewUrl
              }
              alt=""
              className="w-full h-full object-contain"
              draggable={false}
            />

            {isPeeking && (
              <div className="absolute inset-0 bg-black/10 flex items-center justify-center pointer-events-none">
                <span className="text-[10px] font-bold bg-white/90 text-gleam-dark px-1 rounded shadow-sm">
                  ORIGINAL
                </span>
              </div>
            )}

            {isUnsupportedPreview && !isPeeking && isDone && (
              <div className="absolute inset-0 bg-black/40 flex items-center justify-center pointer-events-none">
                <span className="text-[8px] font-bold bg-yellow-400 text-black px-1 rounded shadow-sm leading-tight text-center">
                  QOI
                  <br />
                  Preview
                </span>
              </div>
            )}

            {isDone && !isPeeking && !isUnsupportedPreview && (
              <div className="absolute inset-0 bg-black/0 group-hover/thumb:bg-black/20 transition-colors flex items-center justify-center pointer-events-none">
                <MoveDiagonal className="w-6 h-6 text-white opacity-0 group-hover/thumb:opacity-100 transform scale-75 group-hover/thumb:scale-100 transition-all" />
              </div>
            )}
          </div>

          {isDone && !isPeeking && (
            <div
              className={clsx(
                'absolute -bottom-2 -right-2 w-7 h-7 rounded-full flex items-center justify-center border-2 border-white dark:border-slate-800 z-10',
                isOriginal
                  ? 'bg-blue-400'
                  : isSizeIncreased
                    ? 'bg-orange-400'
                    : 'bg-gleam-pink',
              )}
            >
              {isOriginal ? (
                <Info className="w-4 h-4 text-white" strokeWidth={3} />
              ) : (
                <Check className="w-4 h-4 text-gleam-dark" strokeWidth={4} />
              )}
            </div>
          )}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex justify-between items-center mb-1.5">
            <h4
              className="font-bold text-gleam-dark dark:text-white truncate pr-2 text-xl"
              title={`Original: ${job.file.name}`}
            >
              {displayName}
            </h4>
          </div>

          <div className="space-y-2.5">
            {isProcessing && (
              <div
                className="w-full h-2.5 bg-gray-100 dark:bg-slate-700 rounded-full overflow-hidden relative"
                role="progressbar"
              >
                <div
                  className="h-full bg-gleam-pink rounded-full origin-left absolute top-0 left-0"
                  style={{
                    width: `${displayedProgress}%`,
                    transition:
                      displayedProgress === 95
                        ? `width ${job.estimatedDuration || 5000}ms cubic-bezier(0.0, 0.0, 0.2, 1)`
                        : 'width 300ms ease-out',
                  }}
                />
              </div>
            )}

            <div className="flex items-center gap-3 text-base font-medium flex-wrap">
              {isQueued && (
                <span className="bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-300 text-xs font-bold px-2.5 py-1 rounded-full uppercase tracking-wider flex items-center gap-1.5">
                  <div className="w-2 h-2 rounded-full bg-slate-400 dark:bg-slate-500 animate-pulse" />
                  Waiting
                </span>
              )}

              {isProcessing && (
                <span className="flex items-center gap-2 text-gray-500 dark:text-gray-400 animate-pulse text-sm">
                  <Loader2
                    className="w-4 h-4 animate-spin"
                    aria-hidden="true"
                  />
                  Crunching...
                </span>
              )}

              {isError && (
                <span className="text-red-500 font-bold">
                  Optimization Failed
                </span>
              )}

              {isDone && job.stats && (
                <>
                  <span
                    className="text-gray-400 dark:text-gray-500 line-through decoration-gray-400 text-sm"
                    aria-label="Original size"
                  >
                    {formatBytes(job.stats.originalSize)}
                  </span>
                  <span
                    className="text-gleam-dark dark:text-white font-bold text-lg"
                    aria-label="Optimized size"
                  >
                    {formatBytes(job.stats.optimizedSize)}
                  </span>

                  {!isOriginal && (
                    <span
                      className={clsx(
                        'text-sm px-2.5 py-0.5 rounded-full font-bold',
                        isSizeIncreased
                          ? 'bg-orange-100 text-orange-700'
                          : 'bg-gleam-pink/20 text-pink-700 dark:text-pink-300',
                      )}
                    >
                      {isSizeIncreased ? '+' : '-'}
                      {percentChange}%
                    </span>
                  )}
                  {isOriginal && (
                    <span className="text-sm bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300 px-2.5 py-0.5 rounded-full font-bold">
                      No Changes
                    </span>
                  )}

                  <span className="flex items-center gap-1 text-xs text-gray-400 dark:text-gray-500 bg-gray-50 dark:bg-white/5 px-2 py-0.5 rounded-full font-bold ml-1">
                    <Timer className="w-3 h-3" />
                    {durationLabel}
                  </span>

                  <div className="hidden sm:flex items-center gap-2 ml-auto">
                    {!isUnsupportedPreview ? (
                      <>
                        <span className="text-xs text-gray-400 dark:text-gray-500 font-bold bg-gray-100 dark:bg-white/5 px-2 py-1 rounded-md">
                          Hold img to peek
                        </span>
                        <button
                          className="flex items-center gap-1 text-gray-400 dark:text-gray-500 text-sm group-hover:text-gleam-pink dark:group-hover:text-gleam-pink transition-colors cursor-pointer font-bold bg-transparent border-none"
                          onClick={() => onInspect(job)}
                        >
                          <Eye className="w-4 h-4" />
                          Compare
                        </button>
                      </>
                    ) : (
                      <span className="text-xs text-orange-400 font-bold flex items-center gap-1 bg-orange-50 dark:bg-orange-900/10 px-2 py-1 rounded-md">
                        <FileWarning className="w-3 h-3" />
                        No Preview (QOI)
                      </span>
                    )}
                  </div>
                </>
              )}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {isDone && (
            <>
              {!isUnsupportedPreview && (
                <button
                  onClick={handleCopy}
                  className="w-12 h-12 flex items-center justify-center rounded-xl bg-gray-50 dark:bg-white/5 hover:bg-indigo-100 hover:text-indigo-600 dark:hover:bg-indigo-900/40 dark:hover:text-indigo-300 text-gray-500 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 hidden sm:flex border border-transparent"
                  title="Copy image to clipboard"
                >
                  <Copy className="w-5 h-5" aria-hidden="true" />
                </button>
              )}
              <button
                onClick={() => downloadJob(job, downloadFilename)}
                className="w-12 h-12 flex items-center justify-center rounded-xl bg-gray-50 dark:bg-white/5 hover:bg-gleam-pink hover:text-gleam-dark text-gray-500 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-gleam-pink border border-transparent"
                title="Download optimized image"
              >
                <Download className="w-6 h-6" aria-hidden="true" />
              </button>
            </>
          )}
          <button
            onClick={() => onRemove(job.id)}
            className="w-12 h-12 flex items-center justify-center rounded-xl bg-transparent hover:bg-red-50 dark:hover:bg-red-900/20 text-gray-400 hover:text-red-500 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-red-500"
            title="Remove from queue"
          >
            <Trash2 className="w-6 h-6" aria-hidden="true" />
          </button>
        </div>
      </div>
    </div>
  );
};

export const JobCard = memo(JobCardComponent);
