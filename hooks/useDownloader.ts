import {useState, useCallback} from 'react';
import JSZip from 'jszip';
import {ImageJob, OptimizerConfiguration} from '../types';
import {downloadJob, generateFilename} from '../utils';

interface UseDownloaderReturn {
  isZipping: boolean;
  handleDownloadZip: (
    completedJobs: ImageJob[],
    allJobs: ImageJob[],
    settings: OptimizerConfiguration,
    onSuccess?: () => void,
    onError?: () => void,
  ) => Promise<void>;
  handleDownloadIndividual: (
    completedJobs: ImageJob[],
    allJobs: ImageJob[],
    settings: OptimizerConfiguration,
  ) => void;
}

export const useDownloader = (): UseDownloaderReturn => {
  const [isZipping, setIsZipping] = useState(false);

  const getJobSequenceIndex = (
    jobId: string,
    allJobs: ImageJob[],
    startSequence: number,
  ) => {
    const sorted = [...allJobs].sort((a, b) => a.file.size - b.file.size);
    return sorted.findIndex(j => j.id === jobId) + (startSequence || 1);
  };

  const handleDownloadZip = useCallback(
    async (
      completedJobs: ImageJob[],
      allJobs: ImageJob[],
      settings: OptimizerConfiguration,
      onSuccess?: () => void,
      onError?: () => void,
    ) => {
      if (completedJobs.length === 0) return;

      if (completedJobs.length === 1) {
        const job = completedJobs[0];
        const seq = getJobSequenceIndex(
          job.id,
          allJobs,
          settings.renaming.startSequence,
        );
        const name = generateFilename(
          job.file.name,
          settings.renaming.pattern,
          seq,
        );
        downloadJob(job, name);
        return;
      }

      const userFilename = window.prompt(
        'Name your archive:',
        'img-compress-archive',
      );
      if (userFilename === null) return;

      let filename = userFilename.trim();
      if (!filename) filename = 'img-compress-archive';
      if (!filename.toLowerCase().endsWith('.zip')) filename += '.zip';

      setIsZipping(true);

      try {
        const zip = new JSZip();

        completedJobs.forEach(job => {
          if (job.optimizedBlob) {
            let extension = 'png';
            if (job.optimizedBlob.type === 'image/jpeg') extension = 'jpg';
            if (job.optimizedBlob.type === 'image/webp') extension = 'webp';
            if (job.optimizedBlob.type === 'image/avif') extension = 'avif';
            if (job.optimizedBlob.type === 'image/qoi') extension = 'qoi';
            if (job.optimizedBlob.type === 'image/jxl') extension = 'jxl';

            const seq = getJobSequenceIndex(
              job.id,
              allJobs,
              settings.renaming.startSequence,
            );
            const name = generateFilename(
              job.file.name,
              settings.renaming.pattern,
              seq,
            );
            const fullFileName = `${name}.${extension}`;

            zip.file(fullFileName, job.optimizedBlob);
          }
        });

        const content = await zip.generateAsync({
          type: 'blob',
          compression: 'DEFLATE',
          compressionOptions: {level: 5},
        });

        const url = URL.createObjectURL(content);
        const anchor = document.createElement('a');
        anchor.href = url;
        anchor.download = filename;
        document.body.appendChild(anchor);
        anchor.click();
        document.body.removeChild(anchor);
        URL.revokeObjectURL(url);

        if (onSuccess) onSuccess();
      } catch (e: unknown) {
        console.error('ZIP Error', e);
        if (onError) onError();
      } finally {
        setIsZipping(false);
      }
    },
    [],
  );

  const handleDownloadIndividual = useCallback(
    (
      completedJobs: ImageJob[],
      allJobs: ImageJob[],
      settings: OptimizerConfiguration,
    ) => {
      if (completedJobs.length === 0) return;

      completedJobs.forEach((job, index) => {
        if (job.optimizedBlob) {
          const seq = getJobSequenceIndex(
            job.id,
            allJobs,
            settings.renaming.startSequence,
          );
          const name = generateFilename(
            job.file.name,
            settings.renaming.pattern,
            seq,
          );

          setTimeout(() => {
            downloadJob(job, name);
          }, index * 250);
        }
      });
    },
    [],
  );

  return {
    isZipping,
    handleDownloadZip,
    handleDownloadIndividual,
  };
};
