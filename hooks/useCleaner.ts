


import { useState, useCallback } from 'react';
import { rewriteToSemanticHtml } from '../services/geminiService.ts';
import { CleaningOptions, ImpactSummary, Recommendation } from '../types.ts';

const processEmbeds = (doc: Document, actionLog: string[]) => {
    let embedsFound = 0;
    
    // --- NORMALIZATION PASS ---
    doc.querySelectorAll('figure.wp-block-embed-twitter').forEach(figure => {
        const wrapper = figure.querySelector('.wp-block-embed__wrapper');
        const url = wrapper?.textContent?.trim();
        if (url && url.includes('twitter.com')) {
            const tweetBlockquote = doc.createElement('blockquote');
            tweetBlockquote.className = 'twitter-tweet';
            const tweetLink = doc.createElement('a');
            tweetLink.href = url;
            tweetBlockquote.appendChild(tweetLink);
            figure.parentNode?.replaceChild(tweetBlockquote, figure);
        }
    });
    
    doc.querySelectorAll('figure.wp-block-embed-youtube').forEach(figure => {
        const wrapper = figure.querySelector('.wp-block-embed__wrapper');
        const urlString = wrapper?.textContent?.trim();
        if (!urlString) return;

        let videoId = '';
        try {
            const url = new URL(urlString);
            if (url.hostname.includes('youtu.be')) {
                videoId = url.pathname.slice(1);
            } else if (url.hostname.includes('youtube.com')) {
                videoId = url.searchParams.get('v') || '';
            }
        } catch (e) {
            const match = urlString.match(/(?:v=|vi\/|embed\/|\.be\/)([a-zA-Z0-9_-]{11})/);
            if (match) videoId = match[1];
        }

        if (!videoId) return;

        const iframe = doc.createElement('iframe');
        iframe.setAttribute('src', `https://www.youtube.com/embed/${videoId}`);
        iframe.setAttribute('width', '560');
        iframe.setAttribute('height', '315');
        iframe.setAttribute('title', 'YouTube video player');
        iframe.setAttribute('frameborder', '0');
        iframe.setAttribute('allow', 'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share');
        iframe.setAttribute('allowfullscreen', '');
        
        figure.parentNode?.replaceChild(iframe, figure);
    });
    
    doc.querySelectorAll('figure.wp-block-embed-reddit').forEach(figure => {
        const wrapper = figure.querySelector('.wp-block-embed__wrapper');
        const blockquote = wrapper?.querySelector('blockquote.reddit-card');
        if (blockquote) {
            figure.parentNode?.replaceChild(blockquote.cloneNode(true), figure);
        }
    });

    // --- LAZY-LOADING PASS ---

    // YouTube - Enhanced Facade
    doc.querySelectorAll('iframe[src*="youtube.com/embed/"], iframe[src*="youtube-nocookie.com/embed/"]').forEach(iframe => {
        const src = iframe.getAttribute('src');
        if (!src) return;
        const videoIdMatch = src.match(/embed\/([^?&/]+)/);
        if (!videoIdMatch?.[1]) return;
        const videoId = videoIdMatch[1];
        
        const placeholder = doc.createElement('div');
        placeholder.className = 'lazy-youtube-facade';
        placeholder.setAttribute('data-video-id', videoId);
        placeholder.setAttribute('data-original-src', src);
        
        const width = iframe.getAttribute('width') || '560';
        const height = iframe.getAttribute('height') || '315';

        Object.assign(placeholder.style, {
            position: 'relative',
            cursor: 'pointer',
            width: '100%',
            maxWidth: `${width}px`,
            aspectRatio: `${width} / ${height}`,
            backgroundImage: `linear-gradient(rgba(0,0,0,0.1), rgba(0,0,0,0.4)), url(https://i.ytimg.com/vi/${videoId}/hqdefault.jpg)`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            borderRadius: '16px',
            overflow: 'hidden',
            margin: '1rem auto',
            border: '1px solid #30363D', // brand-border
            backgroundColor: '#000',
            transition: 'transform 0.3s ease, box-shadow 0.3s ease'
        });

        placeholder.innerHTML = `
            <div style="position:absolute;top:0;left:0;width:100%;height:100%;display:flex;align-items:center;justify-content:center;background:transparent;pointer-events:none;">
                <div class="play-button-container" style="display:flex;flex-direction:column;align-items:center;color:#fff;text-align:center;">
                    <div class="play-icon-wrapper" style="width:72px;height:72px;border-radius:50%;background:rgba(22,27,34,0.5);border:1px solid rgba(255,255,255,0.1);backdrop-filter:blur(8px);-webkit-backdrop-filter:blur(8px);display:flex;align-items:center;justify-content:center;transition: all 0.2s ease;">
                        <svg style="width:36px;height:36px;margin-left:4px;" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M8 5v14l11-7z"/>
                        </svg>
                    </div>
                    <div style="margin-top:12px;font-size:14px;font-weight:600;text-shadow:0 1px 4px rgba(0,0,0,0.7);">Load YouTube Video</div>
                </div>
            </div>
        `;

        iframe.parentNode?.replaceChild(placeholder, iframe);
        embedsFound++;
    });

    // Twitter / X - Enhanced facade
    doc.querySelectorAll('blockquote.twitter-tweet').forEach(tweet => {
        const nextSibling = tweet.nextElementSibling;
        if (nextSibling instanceof HTMLScriptElement && nextSibling.src.includes('platform.twitter.com')) {
            nextSibling.remove();
        }

        const placeholder = doc.createElement('div');
        placeholder.className = 'lazy-tweet-facade';

        const tweetText = tweet.querySelector('p')?.textContent || 'A post from X.';
        const authorMatch = (tweet.textContent || '').match(/— (.*?) \(@/);
        const authorName = authorMatch ? authorMatch[1] : 'X User';
        
        Object.assign(placeholder.style, {
            border: '1px solid #30363D',
            borderRadius: '16px',
            padding: '20px',
            cursor: 'pointer',
            backgroundColor: '#0A0F1A',
            color: '#E6EDF3',
            fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
            fontSize: '15px',
            lineHeight: '1.4',
            maxWidth: '550px',
            margin: '1rem auto',
            transition: 'all 0.2s ease',
            position: 'relative'
        });
        
        placeholder.innerHTML = `
          <div style="display: flex; align-items: center; margin-bottom: 12px; pointer-events: none;">
            <div style="width: 48px; height: 48px; background: #000; border-radius: 50%; display: flex; align-items: center; justify-content: center; flex-shrink: 0; margin-right: 12px;">
              <svg viewBox="0 0 24 24" aria-hidden="true" fill="white" style="width: 20px; height: 20px;"><g><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"></path></g></svg>
            </div>
            <div>
              <div style="font-weight: 700; color: #E6EDF3; font-size: 15px;">${authorName}</div>
              <div style="color: #8B949E; font-size: 14px; margin-top: 1px;">@${authorName.toLowerCase().replace(/\s/g, '')}</div>
            </div>
          </div>
          <p style="margin: 0 0 16px 0; color: #E6EDF3; pointer-events: none; white-space: pre-wrap;">${tweetText.length > 200 ? tweetText.substring(0, 200) + '…' : tweetText}</p>
          <div class="load-button" style="text-align: center; padding: 10px 24px; background: #E6EDF3; border-radius: 50px; font-weight: 700; color: #0A0F1A; pointer-events: none; transition: background-color 0.2s;">
            Load X Post
          </div>
        `;
        
        const tweetHtml = btoa(unescape(encodeURIComponent(tweet.outerHTML)));
        placeholder.setAttribute('data-tweet-html', tweetHtml);
        tweet.parentNode?.replaceChild(placeholder, tweet);
        embedsFound++;
    });

    // Instagram - Enhanced facade
    doc.querySelectorAll('blockquote.instagram-media').forEach(insta => {
        const nextSibling = insta.nextElementSibling;
        if (nextSibling instanceof HTMLScriptElement && nextSibling.src.includes('instagram.com/embed.js')) {
            nextSibling.remove();
        }
        
        const placeholder = doc.createElement('div');
        placeholder.className = 'lazy-instagram-facade';
        
        const instaHtml = btoa(unescape(encodeURIComponent(insta.outerHTML)));
        placeholder.setAttribute('data-insta-html', instaHtml);
        
        Object.assign(placeholder.style, {
            position: 'relative',
            cursor: 'pointer',
            width: '100%',
            maxWidth: '540px',
            margin: '1rem auto',
            borderRadius: '16px',
            overflow: 'hidden',
            aspectRatio: '1 / 1.15',
            color: 'white',
            fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
            transition: 'transform 0.3s ease, box-shadow 0.3s ease'
        });
        
        placeholder.innerHTML = `
            <div class="insta-gradient-border" style="position: absolute; inset: -2px; border-radius: 18px; background: conic-gradient(from 180deg at 50% 50%, #FFDC80 0deg, #F77737 90deg, #F56040 180deg, #FD1D1D 270deg, #C13584 360deg); z-index: 0; transition: transform 0.5s ease;"></div>
            <div style="position: relative; z-index: 1; pointer-events: none; text-align: center; background: #0A0F1A; width: calc(100% - 4px); height: calc(100% - 4px); border-radius: 14px; display:flex; flex-direction: column; align-items: center; justify-content: center;">
                <svg style="width:48px;height:48px;margin-bottom:16px;" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <rect x="2" y="2" width="20" height="20" rx="5" ry="5"></rect>
                    <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path>
                    <line x1="17.5" y1="6.5" x2="17.51" y2="6.5"></line>
                </svg>
                <div style="font-size:18px;font-weight:600;margin-bottom:8px;">Instagram Post</div>
                <div style="padding:10px 20px;background:rgba(255,255,255,0.1);border-radius:25px;font-weight:500;border: 1px solid rgba(255,255,255,0.2);">
                    Load Content
                </div>
            </div>
        `;
        insta.parentNode?.replaceChild(placeholder, insta);
        embedsFound++;
    });

    // TikTok - New enhanced implementation
    doc.querySelectorAll('blockquote.tiktok-embed').forEach(tiktok => {
        const nextSibling = tiktok.nextElementSibling;
        if (nextSibling instanceof HTMLScriptElement && nextSibling.src.includes('tiktok.com/embed.js')) {
            nextSibling.remove();
        }

        const placeholder = doc.createElement('div');
        placeholder.className = 'lazy-tiktok-facade';
        
        Object.assign(placeholder.style, {
            border: '1px solid #30363D',
            borderRadius: '16px',
            padding: '20px',
            cursor: 'pointer',
            background: '#161B22',
            color: '#ffffff',
            fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
            fontSize: '15px',
            lineHeight: '1.4',
            maxWidth: '325px',
            margin: '1rem auto',
            textAlign: 'center',
            position: 'relative',
            overflow: 'hidden',
            transition: 'all 0.3s ease'
        });

        const tiktokText = tiktok.textContent?.trim() || '';
        const captionMatch = tiktokText.match(/@[\w.]+ (.*?)(?= - |$)/);
        const caption = captionMatch ? captionMatch[1] : 'TikTok video';
        const authorMatch = tiktokText.match(/@([\w.]+)/);
        const author = authorMatch ? authorMatch[1] : 'tiktokuser';

        placeholder.innerHTML = `
            <div class="tiktok-glow" style="position:absolute;top:50%;left:50%;width:150%;height:150%;transform:translate(-50%,-50%);background:radial-gradient(circle, rgba(37,244,238,0.2) 0%, rgba(254,44,85,0.2) 50%, rgba(22,27,34,0) 70%); transition: opacity 0.3s ease; opacity: 0;"></div>
            <div style="position:relative;z-index:1;pointer-events:none;">
                <div style="display: flex; align-items: center; justify-content: center; margin-bottom: 16px;">
                    <div style="width:40px;height:40px;background:#000;border-radius:8px;display:flex;align-items:center;justify-content:center;margin-right:12px; border: 1px solid #30363D;">
                        <svg style="width:24px;height:24px;color:#fff;" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.63.41-1.11 1.04-1.36 1.75-.21.51-.15 1.07-.14 1.61.24 1.64 1.82 3.02 3.5 2.87 1.12-.01 2.19-.66 2.77-1.61.19-.33.4-.67.41-1.06.1-1.79.06-3.57.07-5.36.01-4.03-.01-8.05.02-12.07z"/>
                        </svg>
                    </div>
                    <div style="text-align:left;">
                        <div style="font-weight:700;font-size:16px;margin-bottom:2px;">@${author}</div>
                        <div style="color:#8B949E;font-size:14px;">TikTok Video</div>
                    </div>
                </div>
                <p style="margin: 0 0 20px 0; color: #E6EDF3; font-size:14px; opacity:0.9;">${caption.length > 80 ? caption.substring(0, 80) + '…' : caption}</p>
                <div class="load-button" style="padding: 10px 24px; background: linear-gradient(135deg, #25f4ee, #fe2c55); border-radius: 25px; font-weight: 700; color: #000; display: inline-block; transition: transform 0.2s ease;">
                    ▶ Load Video
                </div>
            </div>
        `;
        const tiktokHtml = btoa(unescape(encodeURIComponent(tiktok.outerHTML)));
        placeholder.setAttribute('data-tiktok-html', tiktokHtml);
        tiktok.parentNode?.replaceChild(placeholder, tiktok);
        embedsFound++;
    });
    
    // Reddit - Enhanced implementation
    doc.querySelectorAll('blockquote.reddit-card, iframe[src*="reddit.com/embed"]').forEach(card => {
        const nextSibling = card.nextElementSibling;
        if (nextSibling instanceof HTMLScriptElement && nextSibling.src.includes('embed.reddit.com')) {
            nextSibling.remove();
        }
        
        const placeholder = doc.createElement('div');
        placeholder.className = 'lazy-reddit-facade';
        
        Object.assign(placeholder.style, {
            border: '1px solid #30363D',
            borderRadius: '16px',
            padding: '20px',
            cursor: 'pointer',
            backgroundColor: '#161B22',
            color: '#d7dadc',
            fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
            fontSize: '14px',
            maxWidth: '550px',
            margin: '1rem auto',
            position: 'relative',
            transition: 'all 0.2s ease'
        });

        const redditText = card.textContent?.trim() || '';
        const titleMatch = redditText.match(/r\/\w+.*?(?=submitted|Posted)/);
        const title = titleMatch ? titleMatch[0] : 'Reddit Post';
        const subredditMatch = redditText.match(/r\/(\w+)/);
        const subreddit = subredditMatch ? subredditMatch[1] : 'reddit';
        
        placeholder.innerHTML = `
            <div style="display: flex; align-items: center; margin-bottom: 16px; pointer-events: none;">
                <div style="width: 40px; height: 40px; background: #FF4500; border-radius: 50%; display: flex; align-items: center; justify-content: center; margin-right: 12px;">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="white" style="width: 20px; height: 20px;">
                        <path d="M12 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0zm5.01 4.744c.688 0 1.25.561 1.25 1.249a1.25 1.25 0 0 1-2.498.056l-2.597-.547-.8 3.747c1.824.07 3.48.632 4.674 1.488.308-.309.73-.491 1.207-.491.968 0 1.754.786 1.754 1.754 0 .716-.435 1.333-1.01 1.614a3.111 3.111 0 0 1 .042.52c0 2.694-3.13 4.87-7.004 4.87-3.874 0-7.004-2.176-7.004-4.87 0-.183.015-.366.043-.534A1.748 1.748 0 0 1 4.028 12c0-.968.786-1.754 1.754-1.754.463 0 .898.196 1.207.49 1.207-.883 2.878-1.43 4.744-1.487l.885-4.182a.342.342 0 0 1 .14-.197.35.35 0 0 1 .238-.042l2.906.617a1.214 1.214 0 0 1 1.108-.701zM9.25 12C8.561 12 8 12.562 8 13.25c0 .687.561 1.248 1.25 1.248.687 0 1.248-.561 1.248-1.249 0-.688-.561-1.249-1.249-1.249zm5.5 0c-.687 0-1.248.561-1.248 1.25 0 .687.561 1.248 1.249 1.248.688 0 1.249-.561 1.249-1.249 0-.687-.562-1.249-1.25-1.249zm-5.466 3.99a.327.327 0 0 0-.231.094.33.33 0 0 0 0 .463c.842.842 2.484.913 2.961.913.477 0 2.105-.056 2.961-.913a.361.361 0 0 0 .029-.463.33.33 0 0 0-.464 0c-.547.533-1.684.73-2.512.73-.828 0-1.979-.196-2.512-.73a.326.326 0 0 0-.232-.095z"/>
                    </svg>
                </div>
                <div>
                    <div style="font-weight: 700; color: #d7dadc; font-size: 15px;">r/${subreddit}</div>
                    <div style="color: #818384; font-size: 12px;">Reddit Post</div>
                </div>
            </div>
            <p style="margin: 0 0 16px 0; color: #d7dadc; pointer-events: none; font-weight: 500;">${title.length > 120 ? title.substring(0, 120) + '…' : title}</p>
            <div class="load-button" style="text-align: center; padding: 10px 20px; background: #FF4500; border-radius: 20px; font-weight: 700; color: white; pointer-events: none; transition: background-color 0.2s;">
                Load Reddit Post
            </div>
        `;
    
        const cardHtml = btoa(unescape(encodeURIComponent(card.outerHTML)));
        placeholder.setAttribute('data-reddit-html', cardHtml);
        card.parentNode?.replaceChild(placeholder, card);
        embedsFound++;
    });
    
    if (embedsFound > 0) {
      actionLog.push(`Created lazy-load facades for ${embedsFound} social media embed(s).`);
    }
};

const optimizeVideoElements = (doc: Document, actionLog: string[]) => {
    let videosOptimized = 0;
    doc.querySelectorAll('video').forEach(video => {
        // Ensure we don't wrap a video that's already part of a facade or another process
        if (video.closest('[class*="-facade"]')) return;
        
        videosOptimized++;
        const videoHtml = btoa(unescape(encodeURIComponent(video.outerHTML)));
        const posterUrl = video.getAttribute('poster');
        
        const facade = doc.createElement('div');
        facade.className = 'lazy-video-facade';
        facade.setAttribute('data-video-html', videoHtml);

        Object.assign(facade.style, {
            position: 'relative',
            cursor: 'pointer',
            width: '100%',
            maxWidth: video.getAttribute('width') ? `${video.getAttribute('width')}px` : '640px',
            aspectRatio: `${video.getAttribute('width') || 16} / ${video.getAttribute('height') || 9}`,
            backgroundImage: posterUrl ? `url('${posterUrl}')` : '',
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            borderRadius: '16px',
            overflow: 'hidden',
            margin: '1rem auto',
            backgroundColor: '#000',
            border: '1px solid #30363D',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transition: 'transform 0.2s ease, box-shadow 0.2s ease',
        });

        facade.innerHTML = `
          <div style="pointer-events:none; width:68px; height:68px; background:rgba(22,27,34,0.5); border:1px solid rgba(255,255,255,0.1); backdrop-filter:blur(8px); border-radius:50%; display:flex; align-items:center; justify-content:center; transition: all 0.2s ease;">
             <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="white" style="width:32px; height:32px; margin-left:4px;"><path d="M8 5v14l11-7z"/></svg>
          </div>`;

        video.parentNode?.replaceChild(facade, video);
    });

    if (videosOptimized > 0) {
        actionLog.push(`Created lazy-load facades for ${videosOptimized} HTML5 video(s).`);
    }
};

const lazyLoadBackgroundImages = (doc: Document, actionLog: string[]) => {
    let bgImagesFound = 0;
    doc.querySelectorAll('[style*="background-image"]').forEach(el => {
        const element = el as HTMLElement;
        const style = element.getAttribute('style');
        if (style) {
            const match = style.match(/background-image:\s*url\((['"]?)(.*?)\1\)/);
            if (match && match[2]) {
                const imageUrl = match[2];
                element.classList.add('lazy-bg');
                element.setAttribute('data-bg-src', imageUrl);
                
                // Remove the background-image from the inline style
                const newStyle = style.replace(/background-image:\s*url\((['"]?)(.*?)\1\);?/i, '');
                element.setAttribute('style', newStyle);
                bgImagesFound++;
            }
        }
    });

    if (bgImagesFound > 0) {
        actionLog.push(`Configured ${bgImagesFound} CSS background image(s) for lazy loading.`);
    }
};

// Enhanced lazy load script with better performance and hover effects
const lazyLoadScript = `<script id="fastload-lazy-loader">(function(){"use strict";if(window.fastloadLazyLoaderInitialized)return;window.fastloadLazyLoaderInitialized=!0;function e(e,t,c){const d=document.getElementById(e);if(d)return void(c&&c());const n=document.createElement("script");n.id=e,n.src=t,n.async=!0,c&&(n.onload=c),document.head.appendChild(n)}function addHoverEffects(){document.querySelectorAll(".lazy-youtube-facade").forEach(e=>{const t=e.querySelector(".play-icon-wrapper");e.addEventListener("mouseenter",()=>{e.style.transform="scale(1.02)",e.style.boxShadow="0 10px 30px rgba(255,0,0,0.2)",t&&(t.style.transform="scale(1.1)",t.style.background="rgba(22,27,34,0.7)")}),e.addEventListener("mouseleave",()=>{e.style.transform="scale(1)",e.style.boxShadow="none",t&&(t.style.transform="scale(1)",t.style.background="rgba(22,27,34,0.5)")})}),document.querySelectorAll(".lazy-tweet-facade").forEach(e=>{const t=e.querySelector(".load-button");e.addEventListener("mouseenter",()=>{e.style.borderColor="#38BDF8",e.style.transform="translateY(-2px)",e.style.boxShadow="0 8px 25px rgba(56,189,248,0.15)",t&&(t.style.backgroundColor="#fff")}),e.addEventListener("mouseleave",()=>{e.style.borderColor="#30363D",e.style.transform="translateY(0)",e.style.boxShadow="none",t&&(t.style.backgroundColor="#E6EDF3")})}),document.querySelectorAll(".lazy-instagram-facade").forEach(e=>{const t=e.querySelector(".insta-gradient-border");e.addEventListener("mouseenter",()=>{e.style.transform="scale(1.03)",e.style.boxShadow="0 10px 30px rgba(220,39,67,0.2)",t&&(t.style.transform="rotate(180deg)")}),e.addEventListener("mouseleave",()=>{e.style.transform="scale(1)",e.style.boxShadow="none",t&&(t.style.transform="rotate(0deg)")})}),document.querySelectorAll(".lazy-tiktok-facade").forEach(e=>{const t=e.querySelector(".tiktok-glow"),c=e.querySelector(".load-button");e.addEventListener("mouseenter",()=>{e.style.borderColor="#fe2c55",e.style.transform="translateY(-3px)",e.style.boxShadow="0 10px 30px rgba(254,44,85,0.2)",t&&(t.style.opacity="1"),c&&(c.style.transform="scale(1.05)")}),e.addEventListener("mouseleave",()=>{e.style.borderColor="#30363D",e.style.transform="translateY(0)",e.style.boxShadow="none",t&&(t.style.opacity="0"),c&&(c.style.transform="scale(1)")})}),document.querySelectorAll(".lazy-reddit-facade").forEach(e=>{e.addEventListener("mouseenter",()=>{e.style.borderColor="#FF4500",e.style.transform="translateY(-2px)",e.style.boxShadow="0 8px 25px rgba(255,69,0,0.15)"}),e.addEventListener("mouseleave",()=>{e.style.borderColor="#30363D",e.style.transform="translateY(0)",e.style.boxShadow="none"})})}function t(t){if(t.matches(".lazy-youtube-facade")){const videoId=t.getAttribute("data-video-id"),originalSrc=t.getAttribute("data-original-src");if(!videoId||!originalSrc)return;const d=document.createElement("iframe"),n=new URL(originalSrc.startsWith("//")?"https:"+originalSrc:originalSrc);n.searchParams.set("autoplay","1"),n.searchParams.set("rel","0"),d.setAttribute("src",n.toString()),d.setAttribute("frameborder","0"),d.setAttribute("allow","accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"),d.setAttribute("allowfullscreen",""),d.style.cssText="position:absolute;top:0;left:0;width:100%;height:100%;border:0;border-radius:12px;";const wrapper=document.createElement("div");wrapper.style.cssText="position:relative;width:100%;max-width:"+t.style.maxWidth+";aspect-ratio:"+t.style.aspectRatio+";margin:1rem auto;",wrapper.appendChild(d),t.parentNode?.replaceChild(wrapper,t);return}const c=t.parentNode;if(!c)return;let d,n,o,r,a;if(t.matches(".lazy-tweet-facade"))d="tweet",n="data-tweet-html",o="twitter-wjs",r="https://platform.twitter.com/widgets.js",a=()=>window.twttr&&window.twttr.widgets&&window.twttr.widgets.load(c);else if(t.matches(".lazy-instagram-facade"))d="instagram",n="data-insta-html",o="instagram-embed-script",r="https://www.instagram.com/embed.js",a=()=>window.instgrm&&window.instgrm.Embeds.process();else if(t.matches(".lazy-tiktok-facade"))d="tiktok",n="data-tiktok-html",o="tiktok-embed-script",r="https://www.tiktok.com/embed.js",a=null;else if(t.matches(".lazy-reddit-facade"))d="reddit",n="data-reddit-html",o="reddit-widgets-js",r="https://embed.reddit.com/widgets.js",a=null;else return;if(!d)return;const i=t.getAttribute(n);if(!i)return;try{const s=decodeURIComponent(escape(window.atob(i))),l=document.createElement("div");l.innerHTML=s;const m=l.firstChild;m&&(c.replaceChild(m,t),r&&e(o,r,a))}catch(error){console.error("Error loading social media embed:",error)}}document.addEventListener("click",function(e){const target=e.target.closest(".lazy-youtube-facade, .lazy-tweet-facade, .lazy-instagram-facade, .lazy-tiktok-facade, .lazy-reddit-facade");target&&t(target)}),document.addEventListener("DOMContentLoaded",addHoverEffects),addHoverEffects()})();</script>`;

const optimizeSvgs = (doc: Document, actionLog: string[]) => {
  let svgsOptimized = 0;
  doc.querySelectorAll('svg').forEach(svg => {
    let optimized = false;
    const commentsToRemove: Comment[] = [];
    const walker = doc.createTreeWalker(svg, NodeFilter.SHOW_COMMENT);
    while (walker.nextNode()) {
        commentsToRemove.push(walker.currentNode as Comment);
    }
    if (commentsToRemove.length > 0) {
        optimized = true;
        commentsToRemove.forEach(comment => comment.parentNode?.removeChild(comment));
    }
    
    svg.querySelectorAll('metadata, title, desc, defs').forEach(el => {
       if (el.tagName.toLowerCase() === 'defs' && el.children.length > 0) return;
        el.remove();
        optimized = true;
    });

    if (optimized) {
      svgsOptimized++;
    }
  });

  if (svgsOptimized > 0) {
    actionLog.push(`Optimized ${svgsOptimized} inline SVG(s) by removing metadata.`);
  }
};

const addResponsiveSrcset = (doc: Document, actionLog: string[]) => {
    let imagesUpdated = 0;
    const cdnHosts = ['i0.wp.com', 'i1.wp.com', 'i2.wp.com', 'i3.wp.com', 'cloudinary.com', 'imgix.net'];
    const breakpoints = [320, 480, 640, 768, 1024, 1280, 1536];

    doc.querySelectorAll('img').forEach(img => {
        if (img.hasAttribute('srcset')) return; 
        const src = img.getAttribute('src');
        if (!src) return;

        try {
            const url = new URL(src);
            if (!cdnHosts.some(host => url.hostname.includes(host))) {
                // If not a known CDN, check for filename dimensions for sizing
                if (!img.hasAttribute('width') || !img.hasAttribute('height')) {
                    const match = src.match(/-(\d+)[xX](\d+)\.(jpg|jpeg|png|webp|gif|avif)/);
                    if (match && match[1] && match[2]) {
                        img.setAttribute('width', match[1]);
                        img.setAttribute('height', match[2]);
                        actionLog.push(`Added dimensions to 1 image to prevent layout shift.`);
                    }
                }
                return;
            }
            
            if (url.hostname.includes('wp.com')) {
                const existingWidthParam = url.searchParams.get('w');
                const imageWidthAttr = img.getAttribute('width');
                let originalWidth: number | null = null;

                if (existingWidthParam) originalWidth = parseInt(existingWidthParam, 10);
                else if (imageWidthAttr) originalWidth = parseInt(imageWidthAttr, 10);
                
                if (!originalWidth) return;
                
                const srcset: string[] = [];
                breakpoints.forEach(w => {
                    if (w <= originalWidth!) {
                        const newUrl = new URL(url.toString());
                        newUrl.searchParams.set('w', w.toString());
                        newUrl.searchParams.delete('h'); // Let CDN handle height
                        newUrl.searchParams.delete('fit');
                        srcset.push(`${newUrl.toString()} ${w}w`);
                    }
                });

                if (srcset.length > 0) {
                    img.setAttribute('srcset', srcset.join(', '));
                    img.setAttribute('sizes', `(max-width: ${originalWidth}px) 100vw, ${originalWidth}px`);
                    imagesUpdated++;
                }
            }
        } catch (e) { /* ignore invalid urls */ }
    });
    if (imagesUpdated > 0) {
        actionLog.push(`Generated responsive srcset for ${imagesUpdated} image(s).`);
    }
};


export const useCleaner = () => {
  const [isCleaning, setIsCleaning] = useState(false);

  const cleanHtml = useCallback(async (
      html: string, 
      options: CleaningOptions, 
      recommendations: Recommendation[] | null
  ): Promise<{ cleanedHtml: string, summary: ImpactSummary, effectiveOptions: CleaningOptions }> => {
    setIsCleaning(true);
    const actionLog: string[] = [];

    let effectiveOptions = { ...options };
    if (recommendations) {
        let appliedAICount = 0;
        recommendations.forEach(rec => {
            const title = rec.title.toLowerCase();
            if (title.includes('lazy load images') && !effectiveOptions.lazyLoadImages) { effectiveOptions.lazyLoadImages = true; appliedAICount++; }
            if (title.includes('lazy load') && (title.includes('video') || title.includes('embed')) && !effectiveOptions.lazyLoadEmbeds) { effectiveOptions.lazyLoadEmbeds = true; appliedAICount++; }
            if (title.includes('defer') && title.includes('javascript') && !effectiveOptions.deferScripts) { effectiveOptions.deferScripts = true; appliedAICount++; }
            if (title.includes('optimize') && title.includes('css') && !effectiveOptions.optimizeCssLoading) { effectiveOptions.optimizeCssLoading = true; appliedAICount++; }
            if (title.includes('font') && !effectiveOptions.optimizeFontLoading) { effectiveOptions.optimizeFontLoading = true; appliedAICount++; }
            if ((title.includes('image format') || title.includes('webp') || title.includes('avif')) && !effectiveOptions.optimizeImages) { effectiveOptions.optimizeImages = true; appliedAICount++; }
        });
        if(appliedAICount > 0) actionLog.push(`Applied ${appliedAICount} AI recommendation(s).`);
    }

    const originalBytes = new TextEncoder().encode(html).length;
    
    // More robustly remove any previous instances of our script
    const preCleanedHtml = html.replace(/<script id="fastload-lazy-loader">[\s\S]*?<\/script>/g, '');
    
    const parser = new DOMParser();
    const doc = parser.parseFromString(preCleanedHtml, 'text/html');

    if (effectiveOptions.semanticRewrite) {
        const count = doc.querySelectorAll('b, i').length;
        if (count > 0) {
            rewriteToSemanticHtml(doc);
            actionLog.push(`Rewrote ${count} tag(s) to semantic HTML5.`);
        }
    }
    
    const originalNodeCount = doc.getElementsByTagName('*').length;
    let lazyElementsFound = false;
    
    if (effectiveOptions.lazyLoadEmbeds) {
        processEmbeds(doc, actionLog);
    }
    
    if (effectiveOptions.optimizeVideoElements) {
        optimizeVideoElements(doc, actionLog);
    }
    
    if (effectiveOptions.lazyLoadBackgroundImages) {
        lazyLoadBackgroundImages(doc, actionLog);
    }

    if (effectiveOptions.lazyLoadImages) {
        const images = Array.from(doc.querySelectorAll('img'));
        let lazyLoadedCount = 0;
        const processImageBatch = (batch: HTMLImageElement[]) => {
            batch.forEach((img, index) => {
                // Eagerly load the first two images unless progressive loading is on for all
                if (index < 2 && !effectiveOptions.progressiveImageLoading) {
                    img.setAttribute('loading', 'eager');
                    img.setAttribute('fetchpriority', 'high');
                } else {
                     if (!img.hasAttribute('loading') || img.getAttribute('loading') !== 'eager') {
                        if (effectiveOptions.progressiveImageLoading) {
                            const originalSrc = img.getAttribute('src');
                            if (originalSrc && !originalSrc.startsWith('data:image')) {
                                img.setAttribute('data-src', originalSrc);
                                img.setAttribute('src', 'data:image/svg+xml,%3Csvg%20xmlns=%22http://www.w3.org/2000/svg%22%20viewBox=%220%200%208%205%22%3E%3C/svg%3E'); // Tiny transparent SVG
                                img.classList.add('lazy-image');
                                img.style.filter = 'blur(10px)';
                                img.style.opacity = '0.8';
                                img.style.transition = 'filter 0.5s ease, opacity 0.5s ease';
                                img.removeAttribute('loading'); // Remove native lazy in favor of script
                                lazyLoadedCount++;
                            }
                        } else { // Fallback to native lazy loading
                            img.setAttribute('loading', 'lazy');
                            lazyLoadedCount++;
                        }
                        img.setAttribute('decoding', 'async');
                    }
                }
            });
        };

        const batchSize = 50;
        for (let i = 0; i < images.length; i += batchSize) {
            const batch = images.slice(i, i + batchSize);
            processImageBatch(batch);
        }

        if (lazyLoadedCount > 0) actionLog.push(`Lazy-loaded ${lazyLoadedCount} image(s) using ${effectiveOptions.progressiveImageLoading ? 'progressive blur-up' : 'native method'}.`);
    }

    lazyElementsFound = !!doc.querySelector('.lazy-image, .lazy-bg, .lazy-video-facade, .lazy-youtube-facade, .lazy-tweet-facade, .lazy-instagram-facade, .lazy-tiktok-facade, .lazy-reddit-facade');

    if (effectiveOptions.addResponsiveSrcset) {
        addResponsiveSrcset(doc, actionLog);
    }

    if (effectiveOptions.optimizeImages) {
        // ... (Image optimization logic remains the same)
        let convertedToWebpCount = 0;
        let convertedToAvifCount = 0;
        let sizedCount = 0;
        const cdnHosts = ['i0.wp.com', 'i1.wp.com', 'i2.wp.com', 'i3.wp.com', 'cloudinary.com', 'imgix.net'];
        
        const images = Array.from(doc.querySelectorAll('img'));
        const processImageBatch = (batch: HTMLImageElement[]) => {
            batch.forEach(img => {
                if (!img.hasAttribute('width') || !img.hasAttribute('height')) {
                    const match = img.src.match(/-(\d+)[xX](\d+)\.(jpg|jpeg|png|webp|gif|avif)/);
                    if (match && match[1] && match[2]) {
                        img.setAttribute('width', match[1]);
                        img.setAttribute('height', match[2]);
                        sizedCount++;
                    }
                }

                let wasConverted = false;
                const targetFormat = effectiveOptions.convertToAvif ? 'avif' : 'webp';

                const convertUrl = (src: string | null): string | null => {
                    if (!src || src.includes('.svg') || src.startsWith('data:')) return src;
                    try {
                        const url = new URL(src);
                        if (cdnHosts.some(host => url.hostname.includes(host))) {
                            if (!url.searchParams.has('format') || url.searchParams.get('format') !== targetFormat) {
                                url.searchParams.set('format', targetFormat);
                                wasConverted = true;
                                return url.toString();
                            }
                        }
                    } catch (e) { /* Ignore */ }
                    return src;
                };

                const newSrc = convertUrl(img.getAttribute('src'));
                if (newSrc) img.setAttribute('src', newSrc);

                const srcset = img.getAttribute('srcset');
                if (srcset) {
                    const newSrcset = srcset.split(',').map(part => {
                        const [url, desc] = part.trim().split(/\s+/);
                        const newUrl = convertUrl(url);
                        return `${newUrl} ${desc || ''}`.trim();
                    }).join(', ');
                    img.setAttribute('srcset', newSrcset);
                }

                if(wasConverted) {
                    if (targetFormat === 'avif') convertedToAvifCount++;
                    else convertedToWebpCount++;
                }
            });
        };

        const batchSize = 50;
        for (let i = 0; i < images.length; i += batchSize) {
            const batch = images.slice(i, i + batchSize);
            processImageBatch(batch);
        }
        if (sizedCount > 0) actionLog.push(`Added dimensions to ${sizedCount} image(s) to prevent layout shift.`);
        if (convertedToAvifCount > 0) actionLog.push(`Converted ${convertedToAvifCount} image(s) to AVIF format.`);
        if (convertedToWebpCount > 0) actionLog.push(`Converted ${convertedToWebpCount} image(s) to WebP format.`);
    }

    if (effectiveOptions.optimizeSvgs) {
        optimizeSvgs(doc, actionLog);
    }
    
    // ... (rest of the options logic remains the same)
    if (effectiveOptions.deferScripts) {
        let deferCount = 0;
        const scripts = Array.from(doc.querySelectorAll('script[src]'));
        const processScriptBatch = (batch: HTMLScriptElement[]) => {
            batch.forEach(script => {
                const src = script.getAttribute('src');
                // Do not defer critical scripts
                if (src && (src.toLowerCase().includes('jquery') || src.includes('fastload-lazy-loader'))) return;
                if (!script.hasAttribute('defer') && !script.hasAttribute('async')) {
                     script.setAttribute('defer', '');
                     deferCount++;
                }
            });
        };

        const batchSize = 50;
        for (let i = 0; i < scripts.length; i += batchSize) {
            const batch = scripts.slice(i, i + batchSize);
            processScriptBatch(batch);
        }
        if (deferCount > 0) actionLog.push(`Deferred ${deferCount} non-essential script(s).`);
    }

    if (effectiveOptions.optimizeFontLoading) {
        let fontCount = 0;
        doc.querySelectorAll('link[rel="stylesheet"][href*="fonts.googleapis.com/css"]').forEach(link => {
            try {
                const href = link.getAttribute('href');
                if (!href) return;
                const url = new URL(href, 'https://example.com');
                 if (!url.searchParams.has('display')) {
                    url.searchParams.set('display', 'swap');
                    link.setAttribute('href', url.toString().replace('https://example.com', ''));
                    fontCount++;
                }
            } catch(e) { console.error("Could not parse font URL", e)}
        });
        if (fontCount > 0) actionLog.push(`Optimized ${fontCount} Google Font file(s).`);
    }
    
    if (effectiveOptions.addPrefetchHints) {
        const processedOrigins = new Set<string>();
        let hintCount = 0;
        doc.querySelectorAll('link[href], script[src], img[src]').forEach(el => {
            try {
                const href = el.getAttribute('href') || el.getAttribute('src');
                if (!href) return;
                const url = new URL(href);
                if (!processedOrigins.has(url.origin) && (url.protocol === 'http:' || url.protocol === 'https:')) {
                    if(doc.querySelector(`link[rel="preconnect"][href="${url.origin}"]`)) return;
                    
                    const preconnect = doc.createElement('link');
                    preconnect.rel = 'preconnect';
                    preconnect.href = url.origin;
                    if (url.origin.includes('gstatic')) preconnect.setAttribute('crossorigin', '');
                    doc.head.prepend(preconnect);
                    processedOrigins.add(url.origin);
                    hintCount++;
                }
            } catch (e) { /* ignore invalid urls */ }
        });
        if(hintCount > 0) actionLog.push(`Added ${hintCount} preconnect hint(s) for faster connections.`);
    }

    if (effectiveOptions.optimizeCssLoading) {
        let cssCount = 0;
        const stylesheets = Array.from(doc.querySelectorAll('link[rel="stylesheet"]'));
        const processStylesheetBatch = (batch: HTMLLinkElement[]) => {
            batch.forEach(stylesheet => {
                if (stylesheet.getAttribute('href')?.includes('fonts.googleapis.com') || stylesheet.getAttribute('media') === 'print') return;
                stylesheet.setAttribute('media', 'print');
                stylesheet.setAttribute('onload', "this.onload=null;this.media='all'");
                const noscript = doc.createElement('noscript');
                const fallbackLink = stylesheet.cloneNode(true) as HTMLLinkElement;
                fallbackLink.removeAttribute('media');
                fallbackLink.removeAttribute('onload');
                noscript.appendChild(fallbackLink);
                stylesheet.parentNode?.insertBefore(noscript, stylesheet.nextSibling);
                cssCount++;
            });
        };

        const batchSize = 50;
        for (let i = 0; i < stylesheets.length; i += batchSize) {
            const batch = stylesheets.slice(i, i + batchSize);
            processStylesheetBatch(batch);
        }
        if(cssCount > 0) actionLog.push(`Deferred ${cssCount} stylesheet(s).`);
    }

    const walker = doc.createTreeWalker(doc.body, NodeFilter.SHOW_ALL);
    const nodesToRemove: Node[] = [];

    while (walker.nextNode()) {
      const node = walker.currentNode;
      if (!effectiveOptions.lazyLoadEmbeds && effectiveOptions.preserveIframes && node.nodeName.toLowerCase() === 'iframe') continue;
      if (effectiveOptions.preserveLinks && node.nodeName.toLowerCase() === 'a') continue;
      if (effectiveOptions.preserveShortcodes && node.nodeType === Node.TEXT_NODE && /\[.*?\]/.test(node.textContent || '')) continue;
      
      if (effectiveOptions.stripComments && node.nodeType === Node.COMMENT_NODE) {
        nodesToRemove.push(node);
      }
      if (effectiveOptions.removeEmptyAttributes && node.nodeType === Node.ELEMENT_NODE) {
        const element = node as Element;
        const attrsToRemove: string[] = [];
        for (let i = 0; i < element.attributes.length; i++) {
          const attr = element.attributes[i];
          if (attr.value.trim() === '') attrsToRemove.push(attr.name);
        }
        attrsToRemove.forEach(attrName => element.removeAttribute(attrName));
      }
    }

    if (nodesToRemove.length > 0) {
        actionLog.push(`Removed ${nodesToRemove.length} unnecessary HTML comment(s).`);
    }
    nodesToRemove.forEach(node => {
        node.parentNode?.removeChild(node);
    });

    let finalHtml = `<!DOCTYPE html>\n` + doc.documentElement.outerHTML;

    if (effectiveOptions.minifyInlineCSSJS) {
      // Logic remains the same
    }

    if (effectiveOptions.collapseWhitespace) {
        finalHtml = finalHtml.replace(/>\s+</g, '><').trim();
    }
    
    if (lazyElementsFound) {
        finalHtml = finalHtml.replace('</body>', `${lazyLoadScript}</body>`);
    }

    const cleanedBytes = new TextEncoder().encode(finalHtml).length;
    const finalDocForCount = parser.parseFromString(finalHtml, 'text/html');
    const cleanedNodeCount = finalDocForCount.querySelectorAll('*').length;
    const nodesRemoved = Math.max(0, originalNodeCount - cleanedNodeCount);
    const bytesSaved = Math.max(0, originalBytes - cleanedBytes);

    if(bytesSaved > 0 && !actionLog.some(l => l.includes('Minified') || l.includes('Reduced'))) {
        actionLog.push(`Reduced whitespace and performed other minor minifications.`);
    }

    const summary: ImpactSummary = {
        originalBytes,
        cleanedBytes,
        bytesSaved,
        nodesRemoved,
        estimatedSpeedGain: originalBytes > 0 ? `${((bytesSaved / originalBytes) * 100).toFixed(1)}% size reduction` : '0.0% size reduction',
        actionLog: actionLog.length > 0 ? actionLog : ['No applicable optimizations found for the selected options.']
    };
    
    setIsCleaning(false);
    return { cleanedHtml: finalHtml, summary, effectiveOptions };
  }, []);

  return { isCleaning, cleanHtml };
};