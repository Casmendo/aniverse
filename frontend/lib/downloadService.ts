import { downloadAPI } from '@/lib/api';
import { useDownloadQueueStore } from '@/store/downloadQueueStore';
import { useDownloadStore } from '@/store/downloadStore';
import { useAuthStore } from '@/store/authStore';

export const processDownload = async (
  ep: any, 
  anime: any, 
  quality: string, 
  audio: string, 
  toast: any
) => {
  if (!anime || !ep) return;

  const downloadName = `${anime.title.replace(/[^a-zA-Z0-9-_\. ]/g, '')}-EP${ep.num}`;
  const { addOrUpdateItem, removeItem } = useDownloadQueueStore.getState();
  const { add: addDownload } = useDownloadStore.getState();
  const { user } = useAuthStore.getState();

  try {
    toast(`Preparing EP ${ep.num} for download...`, 'info');
    const payload = { anime_slug: anime.slug, episode_session: ep.id, anime_title: anime.title, episode_number: ep.num, quality: quality.replace('p', ''), audio };
    const { data } = await downloadAPI.createJob(payload);
    const jobId = data?.job_id || data?.download_id || data?.id || data?.job?.id || data?.jobId;
    if (!jobId) throw new Error('Failed to create download job');

    const start = Date.now();
    let fileUrl = '';
    
    addOrUpdateItem(jobId, downloadName, 0);

    while (Date.now() - start < 120000) {
      const { data: st } = await downloadAPI.getJobStatus(jobId);
      const status = String(st?.status || st?.state || '').toLowerCase();
      const pct = Number(st?.progress ?? st?.percentage ?? st?.percent ?? 0) || 0;
      
      addOrUpdateItem(jobId, downloadName, Math.min(99, pct));

      if (['done', 'finished', 'completed'].includes(status)) {
        fileUrl = downloadAPI.getJobFile(ep.id, anime.slug || anime.id, audio);
        break;
      }
      if (['failed', 'error'].includes(status)) throw new Error('Server processing failed');
      await new Promise(r => setTimeout(r, 2000));
    }

    if (!fileUrl) throw new Error('Server timeout');

    addOrUpdateItem(jobId, downloadName, 100);

    // WEB DOWNLOAD: Browser handles it directly
    window.location.assign(fileUrl);
    
    toast(`✅ Successfully downloaded EP ${ep.num}!`, 'success');
    setTimeout(() => removeItem(jobId), 3000);
    
  } catch(e: any) {
    toast(`Error on EP ${ep.num}: ${e.message}`, 'error');
  }
};
