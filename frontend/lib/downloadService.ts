import { Capacitor, CapacitorHttp } from '@capacitor/core';
import { Filesystem, Directory } from '@capacitor/filesystem';
import { LocalNotifications } from '@capacitor/local-notifications';
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
  const notifId = Math.floor(Math.random() * 1000000);
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

      if (Capacitor.isNativePlatform()) {
        try {
          await LocalNotifications.requestPermissions();
          await LocalNotifications.schedule({
            notifications: [{
              title: 'AniVerse Downloading',
              body: `${downloadName}: ${pct}%`,
              id: notifId,
              schedule: { at: new Date(Date.now() + 100) },
              smallIcon: 'ic_stat_name', // optional icon
            }]
          });
        } catch(e) {}
      }

      if (['done', 'finished', 'completed'].includes(status)) {
        fileUrl = await downloadAPI.getJobFile(jobId);
        break;
      }
      if (['failed', 'error'].includes(status)) throw new Error('Server processing failed');
      await new Promise(r => setTimeout(r, 2000));
    }

    if (!fileUrl) throw new Error('Server timeout');

    addOrUpdateItem(jobId, downloadName, 100);

    if (Capacitor.isNativePlatform()) {
      try {
        const status = await Filesystem.requestPermissions();
        if (status.publicStorage !== 'granted') throw new Error('Storage permission denied');
        
        await LocalNotifications.schedule({
          notifications: [{
            title: 'AniVerse',
            body: `Saving ${downloadName} to device...`,
            id: notifId,
          }]
        });

        const downloadRes = await CapacitorHttp.downloadFile({
          url: fileUrl,
          filePath: `Download/${downloadName}.mp4`,
          fileDirectory: Directory.ExternalStorage, // Save to public downloads folder
        });

        // Saved to device successfully, now add to local app library for offline custom player
        await addDownload({
          anime_slug: anime.slug, anime_title: anime.title, anime_cover: anime.cover,
          episode_num: ep.num, episode_id: ep.id, episode_title: ep.title,
        }, !!user);
        
        await LocalNotifications.schedule({
          notifications: [{
            title: 'AniVerse Download Complete',
            body: `${downloadName} is ready to watch offline!`,
            id: notifId,
          }]
        });

      } catch (e: any) {
        throw new Error('Native download failed: ' + e.message);
      }
    } else {
      // WEB DOWNLOAD: Browser handles it. No library saving.
      window.location.assign(fileUrl);
    }
    
    toast(`Download ready: EP ${ep.num}`, 'success');
    setTimeout(() => removeItem(jobId), 3000);
    
  } catch(e: any) {
    toast(`Error on EP ${ep.num}: ${e.message}`, 'error');
    if (Capacitor.isNativePlatform()) {
      try {
        await LocalNotifications.schedule({
          notifications: [{
            title: 'Download Failed',
            body: `${downloadName}: ${e.message}`,
            id: notifId,
          }]
        });
      } catch(err) {}
    }
  }
};
