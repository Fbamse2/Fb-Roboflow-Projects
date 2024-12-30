/*jshint esversion:8*/

$(document).ready(() => {
    const { InferenceEngine, CVImage } = inferencejs;
    const inferEngine = new InferenceEngine();

    const video = $("#video")[0];
    const canvas = $("#overlay")[0];
    const ctx = canvas.getContext("2d");

    let workerId = null;
    let prevTime = null;
    const frameTimes = [];
    const font = "16px sans-serif";

    const initializeVideoStream = async () => {
        const stream = await navigator.mediaDevices.getUserMedia({
            audio: false,
            video: { facingMode: "environment" }
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

    const calculateFPS = () => {
        if (!prevTime) return;
        frameTimes.push(Date.now() - prevTime);
        if (frameTimes.length > 30) frameTimes.shift();

        const total = frameTimes.reduce((acc, t) => acc + t / 1000, 0);
        const fps = Math.round(frameTimes.length / total);
        $("#fps").text(`FPS: ${fps}`);
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

    const detectFrame = async () => {
        if (!workerId) return requestAnimationFrame(detectFrame);

        const image = new CVImage(video);
        try {
            const predictions = await inferEngine.infer(workerId, image);
            renderPredictions(predictions);
            calculateFPS();
        } catch (error) {
            console.error("Inference Error:", error);
        } finally {
            prevTime = Date.now();
            requestAnimationFrame(detectFrame);
        }
    };

    // Initialize application
    (async () => {
        try {
            await initializeVideoStream();
            await initializeModel();
            $("body").removeClass("loading");
            resizeCanvas();
            detectFrame();

            $(window).resize(resizeCanvas);
        } catch (error) {
            console.error("Initialization Error:", error);
            $("#fps").text("Error initializing application.");
        }
    })();
});
