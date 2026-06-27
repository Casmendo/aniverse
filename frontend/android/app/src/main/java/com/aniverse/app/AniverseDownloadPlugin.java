package com.aniverse.app;

import android.app.DownloadManager;
import android.content.Context;
import android.content.Intent;
import android.database.Cursor;
import android.net.Uri;
import android.os.Build;
import android.os.Environment;
import android.os.Handler;
import android.os.Looper;

import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

import java.io.File;
import java.io.FileOutputStream;
import java.io.IOException;
import java.io.InputStream;
import java.net.HttpURLConnection;
import java.net.URL;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;

@CapacitorPlugin(name = "AniverseDownload")
public class AniverseDownloadPlugin extends Plugin {

    private static final String DOWNLOADS_DIR = "aniverse_downloads";
    private ExecutorService executor = Executors.newCachedThreadPool();

    /**
     * Called from JS: window.Android.startDownload(url, filename, animeSlug, epId, title)
     * 
     * Via Capacitor bridge:
     *   const result = await AniverseDownload.startDownload({url, filename, animeSlug, epId, title, cover, epNum, epTitle});
     */
    @PluginMethod
    public void startDownload(PluginCall call) {
        String url       = call.getString("url");
        String filename  = call.getString("filename");
        String animeSlug = call.getString("animeSlug");
        String epId      = call.getString("epId");
        String title     = call.getString("title");
        String cover     = call.getString("cover", "");
        int    epNum     = call.getInt("epNum", 0);
        String epTitle   = call.getString("epTitle", title);
        String animeTitle= call.getString("animeTitle", animeSlug);

        if (url == null || filename == null) {
            call.reject("Missing url or filename");
            return;
        }

        // Acknowledge immediately so UI doesn't freeze
        call.resolve();

        // Run download in background thread
        executor.execute(() -> downloadFile(url, filename, animeSlug, epId, title, cover, epNum, epTitle, animeTitle));
    }

    private void downloadFile(String urlStr, String filename, String animeSlug,
                              String epId, String title, String cover,
                              int epNum, String epTitle, String animeTitle) {
        Context ctx = getContext();
        
        // Use app-internal hidden storage (not visible in gallery)
        File dir = new File(ctx.getFilesDir(), DOWNLOADS_DIR + "/" + animeSlug);
        if (!dir.exists()) {
            dir.mkdirs();
        }

        // Create .nomedia to hide from gallery/VLC
        File noMedia = new File(dir, ".nomedia");
        if (!noMedia.exists()) {
            try { noMedia.createNewFile(); } catch (IOException ignored) {}
        }

        File destFile = new File(dir, filename + ".mp4");
        String jobId  = epId;

        try {
            URL url = new URL(urlStr);
            HttpURLConnection conn = (HttpURLConnection) url.openConnection();
            conn.setRequestProperty("User-Agent", "Aniverse-Android/1.0");
            conn.connect();

            int fileLength = conn.getContentLength();
            InputStream is = conn.getInputStream();
            FileOutputStream fos = new FileOutputStream(destFile);

            byte[] buffer   = new byte[8192];
            long downloaded = 0;
            int  read;
            int  lastPct    = -1;

            while ((read = is.read(buffer)) != -1) {
                fos.write(buffer, 0, read);
                downloaded += read;

                if (fileLength > 0) {
                    int pct = (int) ((downloaded * 100L) / fileLength);
                    if (pct != lastPct) {
                        lastPct = pct;
                        final int progress = pct;
                        final String jsTitle = title;
                        // Report progress back to JS
                        new Handler(Looper.getMainLooper()).post(() ->
                            getBridge().getWebView().evaluateJavascript(
                                "window.updateDownloadProgress && window.updateDownloadProgress('" + jobId + "','" + jsTitle.replace("'","\\'") + "'," + progress + ")",
                                null
                            )
                        );
                    }
                }
            }

            fos.flush();
            fos.close();
            is.close();
            conn.disconnect();

            // Signal completion
            final String localPath = destFile.getAbsolutePath();
            final String safeTitle     = title.replace("'","\\'");
            final String safeSlug      = animeSlug.replace("'","\\'");
            final String safeAnimeTitle= animeTitle.replace("'","\\'");
            final String safeCover     = cover.replace("'","\\'");
            final String safeEpTitle   = epTitle.replace("'","\\'");
            final String safeLocalPath = localPath.replace("'","\\'");

            new Handler(Looper.getMainLooper()).post(() ->
                getBridge().getWebView().evaluateJavascript(
                    "window.finishDownload && window.finishDownload('" + jobId + "','" + safeSlug + "','" + safeAnimeTitle + "','" + safeCover + "'," + epNum + ",'" + safeEpTitle + "','" + safeLocalPath + "')",
                    null
                )
            );

        } catch (Exception e) {
            // Report error to JS
            new Handler(Looper.getMainLooper()).post(() ->
                getBridge().getWebView().evaluateJavascript(
                    "window.updateDownloadProgress && window.updateDownloadProgress('" + jobId + "','Error: " + e.getMessage() + "',-1)",
                    null
                )
            );
        }
    }

    /**
     * Lists all downloaded files in a given anime's folder.
     */
    @PluginMethod
    public void listDownloads(PluginCall call) {
        String animeSlug = call.getString("animeSlug", "");
        Context ctx      = getContext();
        File dir         = new File(ctx.getFilesDir(), DOWNLOADS_DIR + (animeSlug.isEmpty() ? "" : "/" + animeSlug));

        JSObject result  = new JSObject();
        if (!dir.exists()) {
            result.put("files", new org.json.JSONArray());
            call.resolve(result);
            return;
        }

        org.json.JSONArray files = new org.json.JSONArray();
        File[] listing = dir.listFiles(f -> f.getName().endsWith(".mp4"));
        if (listing != null) {
            for (File f : listing) {
                JSObject item = new JSObject();
                item.put("name", f.getName());
                item.put("path", f.getAbsolutePath());
                item.put("size", f.length());
                files.put(item);
            }
        }
        result.put("files", files);
        call.resolve(result);
    }

    /**
     * Deletes a specific downloaded file.
     */
    @PluginMethod
    public void deleteDownload(PluginCall call) {
        String path = call.getString("path");
        if (path == null) { call.reject("No path"); return; }
        File f = new File(path);
        boolean deleted = f.exists() && f.delete();
        JSObject result = new JSObject();
        result.put("deleted", deleted);
        call.resolve(result);
    }
}
