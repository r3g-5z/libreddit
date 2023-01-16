// @license http://www.gnu.org/licenses/agpl-3.0.html AGPL-3.0
"use strict";
(function () {
    if (Hls.isSupported()) {
        let videoSources = document.querySelectorAll("video source[type='application/vnd.apple.mpegurl']");
        videoSources.forEach(function (source) {
            let playlist = source.src;

            let oldVideo = source.parentNode;
            let autoplay = oldVideo.classList.contains("hls_autoplay");

            // If HLS is supported natively then don't use hls.js
            if (oldVideo.canPlayType(source.type)) {
                if (autoplay) {
                    oldVideo.play();
                }
                return;
            }

            // Replace video with copy that will have all "source" elements removed
            let newVideo = oldVideo.cloneNode(true);
            let allSources = newVideo.querySelectorAll("source");
            allSources.forEach(function (source) {
                source.remove();
            });

            // Empty source to enable play event
            newVideo.src = "about:blank";

            oldVideo.parentNode.replaceChild(newVideo, oldVideo);

            function initializeHls() {
                newVideo.removeEventListener('play', initializeHls);

                let hls = new Hls({ autoStartLoad: false });
                hls.loadSource(playlist);
                hls.attachMedia(newVideo);
                hls.on(Hls.Events.MANIFEST_PARSED, function () {
                    hls.loadLevel = hls.levels.length - 1;
                    hls.startLoad();
                    newVideo.play();
                });

                hls.on(Hls.Events.ERROR, function (event, data) {
                    let errorType = data.type;
                    let errorFatal = data.fatal;
                    if (errorFatal) {
                        switch (errorType) {
                            case Hls.ErrorType.NETWORK_ERROR:
                                hls.startLoad();
                                break;
                            case Hls.ErrorType.MEDIA_ERROR:
                                hls.recoverMediaError();
                                break;
                            default:
                                hls.destroy();
                                break;
                        }
                    }

                    console.error("HLS error", data);
                });
            }

            newVideo.addEventListener('play', initializeHls);

            if (autoplay) {
                newVideo.play();
            }
        });
    } else {
        let videos = document.querySelectorAll("video.hls_autoplay");
        videos.forEach(function (video) {
            video.setAttribute("autoplay", "");
        });
    }
})();
// @license-end