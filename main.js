let video = document.getElementById('video');
let canvas = document.getElementById('overlay');
let ctx = canvas.getContext('2d');
let captureButton = document.getElementById('capture-button');
let model;

// Initialize the video and model
async function initialize() {
    // Load the prediction model
    model = await loadModel(); // Replace with actual model loading logic

    // Start video capture
    await setupCamera();
    video.play();

    document.body.classList.remove('loading');
}

// Set up camera
async function setupCamera() {
    const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' },
    });
    video.srcObject = stream;

    return new Promise((resolve) => {
        video.onloadedmetadata = () => {
            resolve(video);
        };
    });
}

// Capture a frame from the video
function captureFrame() {
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    return canvas.toDataURL('image/png');
}

// Predict on the captured image
async function predict(imageData) {
    try {
        const predictions = await model.predict(imageData); // Replace with actual prediction logic
        displayPredictions(predictions);
    } catch (error) {
        console.error('Prediction failed:', error);
    }
}

// Display predictions
function displayPredictions(predictions) {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    predictions.forEach((prediction) => {
        // Draw bounding boxes or annotations
        const { x, y, width, height, label, confidence } = prediction;

        ctx.strokeStyle = 'red';
        ctx.lineWidth = 2;
        ctx.strokeRect(x, y, width, height);

        ctx.fillStyle = 'white';
        ctx.font = '16px Arial';
        ctx.fillText(`${label} (${Math.round(confidence * 100)}%)`, x, y - 10);
    });
}

// Capture image and predict on button click
captureButton.addEventListener('click', async () => {
    const frame = captureFrame();
    await predict(frame);
});

// Start the application
initialize();
