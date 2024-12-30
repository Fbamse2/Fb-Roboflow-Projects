/*jshint esversion:8*/

$(document).ready(() => {
    const { InferenceEngine, CVImage } = inferencejs;
    const inferEngine = new InferenceEngine();

    const video = $("#video")[0];
    const canvas = $("#overlay")[0];
    const ctx = canvas.getContext("2d");
    const photoCanvas = document.createElement("canvas");
    const photoCtx = photoCanvas.getContext("2d");

    let workerId = null;
    const font = "16px sans-serif";

    const initializeVideoStream = async () => {
        const stream = await navigator.mediaDevices.getUserMedia({
            audio: false,
            video: { facingMode: "environment", width: { ideal: 640 }, height: { ideal: 480 } }
        });
        video.srcObject = stream;

        return new Promise((resolve) => {
            video.onloadeddata = () => {
                video.play();
                resolve();
            };
        });
    };

    const initializeModel = async () => {
        workerId = await inferEngine.startWorker(
            "sign-vyotz",
            "2",
            "rf_8VWEzd82SjOgwThUCRgbrZviOaA3"
        );
    };

    const resizeCanvas = () => {
        const videoRatio = video.videoWidth / video.videoHeight;
        const windowRatio = $(window).width() / $(window).height();

        let canvasWidth, canvasHeight;
        if (windowRatio > videoRatio) {
            canvasHeight = $(window).height();
            canvasWidth = canvasHeight * videoRatio;
        } else {
            canvasWidth = $(window).width();
            canvasHeight = canvasWidth / videoRatio;
        }

        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;

        $(canvas).css({
            width: canvasWidth,
            height: canvasHeight,
            position: "absolute",
            left: ($(window).width() - canvasWidth) / 2,
            top: ($(window).height() - canvasHeight) / 2
        });
    };

    const capturePhoto = () => {
        // Capture a single frame from the video
        photoCanvas.width = video.videoWidth;
        photoCanvas.height = video.videoHeight;
        photoCtx.drawImage(video, 0, 0, video.videoWidth, video.videoHeight);

        return new CVImage(photoCanvas);
    };

    const renderPredictions = (predictions) => {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.font = font;

        predictions.forEach(({ bbox, class: label, color }) => {
            const { x, y, width, height } = bbox;
            ctx.strokeStyle = color;
            ctx.lineWidth = 4;

            // Draw bounding box
            ctx.strokeRect(x - width / 2, y - height / 2, width, height);

            // Draw label
            ctx.fillStyle = color;
            ctx.fillRect(x - width / 2, y - height / 2 - 20, ctx.measureText(label).width + 8, 20);
            ctx.fillStyle = "#000000";
            ctx.fillText(label, x - width / 2 + 4, y - height / 2 - 18);
        });
    };

    const processPhoto = async () => {
        if (!workerId) return;

        const image = capturePhoto();
        try {
            const predictions = await inferEngine.infer(workerId, image);
            renderPredictions(predictions);
        } catch (error) {
            console.error("Inference Error:", error);
        }
    };

    // Initialize application
    (async () => {
        try {
            await initializeVideoStream();
            await initializeModel();
            $("body").removeClass("loading");
            resizeCanvas();

            $(window).resize(resizeCanvas);

            // Attach photo capture to a button
            $("#captureButton").on("click", () => {
                processPhoto();
            });
        } catch (error) {
            console.error("Initialization Error:", error);
            $("#fps").text("Error initializing application.");
        }
    })();
});
