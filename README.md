# Driver Drowsiness Detection

A browser-based driver drowsiness monitoring prototype built with **JavaScript**, **MediaPipe Face Mesh**, and the **Eye Aspect Ratio (EAR)** algorithm. The application uses facial landmarks from a webcam stream to estimate eye closure, track blink and yawn events, and trigger visual and audio alerts.

> **Academic prototype notice:** This project is intended for learning, experimentation, and demonstration. It has not been validated for real-world driving or certified as a vehicle safety system. Never rely on it as a substitute for adequate rest, safe driving practices, or certified driver-assistance technology.

## Features

- **Real-time webcam input** through the browser camera.
- **Facial landmark tracking** using MediaPipe Face Mesh.
- **Eye closure estimation** using EAR calculated from six landmarks per eye.
- **EAR smoothing** with a short moving-average buffer to reduce frame-to-frame noise.
- **Blink counter** for short eye-closure events.
- **Yawn indicator** based on a mouth-opening ratio (MAR) heuristic.
- **Three alert states:** `NORMAL`, `WARNING`, and `DANGER`.
- **Audio alerts** with separate warning and danger sounds.
- **Simple controls** to start and stop camera processing.

## How It Works

### 1. Face landmarks

MediaPipe Face Mesh estimates facial landmarks from the webcam image. The application uses selected eye landmarks and mouth landmarks to calculate geometric ratios. The current configuration processes one face at a time.

### 2. Eye Aspect Ratio (EAR)

EAR estimates how open the eye is by comparing vertical eye distances with the horizontal eye width:

\[
EAR = \frac{\lVert p_2-p_6\rVert + \lVert p_3-p_5\rVert}{2\lVert p_1-p_4\rVert}
\]

A lower EAR value indicates that the eye may be closed. This implementation averages the left- and right-eye EAR values, smooths recent measurements, and compares the result with a configurable threshold.

### 3. Alert timing

The application measures how long the EAR stays below the configured threshold. The current code uses a warning threshold of **500 ms** and a danger threshold of **1,000 ms**. These are prototype settings, not validated driving-safety thresholds, and should be calibrated and tested before any research conclusions are drawn.

### 4. Mouth-opening ratio (MAR)

The application estimates mouth opening using the distance between selected upper/lower lip landmarks divided by the distance between two horizontal mouth landmarks. A sustained value above the configured MAR threshold increments the yawn counter. Reaching the configured count triggers a danger alert in the current implementation.

EAR and MAR are heuristic indicators. Eye shape, head pose, camera placement, lighting, glasses, and individual differences can affect their measurements.

## Technology Stack

- **HTML5** — page structure and webcam/canvas elements
- **CSS3** — interface styling and alert-state styling
- **JavaScript** — detection flow, EAR/MAR calculations, counters, and audio control
- **MediaPipe Face Mesh** — facial landmark estimation
- **MediaPipe Camera Utils** — browser camera frame handling
- **jsDelivr CDN** — loads the MediaPipe JavaScript libraries

This repository is a static front-end project. It does not include a custom backend, database, model-training pipeline, or persistent user-data storage.

## Project Structure

```text
driver-drowsiness-detection/
├── assets/
│   ├── danger-alarm.mp3
│   ├── warning-alarm.mp3
│   └── README.md
├── index.html
├── script.js
├── style.css
├── .gitignore
└── README.md
```

## Getting Started

### Requirements

- A modern browser with webcam support (for example, a recent version of Chrome or Firefox).
- A working webcam and permission to use it.
- An internet connection to load the MediaPipe libraries from the CDN.
- A local web server or an HTTPS origin. Browsers generally restrict camera access on insecure origins; `localhost` is suitable for local development.

### Run locally on Linux

1. Download or clone this repository.
2. Open a terminal in the project directory.
3. Start a simple local web server:

   ```bash
   python3 -m http.server 8000
   ```

4. Open [http://localhost:8000](http://localhost:8000) in your browser.
5. Allow camera access, then select **START**. Select **STOP** to stop processing and silence the alerts.

You can also open the folder in Visual Studio Code and use a local development server extension such as Live Server.

> Opening `index.html` directly as a `file://` URL may prevent camera access from working correctly. Use `localhost` or HTTPS instead.

## Configuration

The main detection parameters are defined near the top of `script.js`:

| Parameter | Current value | Purpose |
|---|---:|---|
| `EAR_THRESHOLD` | `0.16` | Eye-closure threshold |
| `MAR_THRESHOLD` | `0.45` | Mouth-opening threshold |
| `WARNING_TIME` | `500` ms | Time below EAR threshold before warning |
| `DANGER_TIME` | `1000` ms | Time below EAR threshold before danger |
| `YAWN_TIME` | `1200` ms | Sustained mouth-opening duration used by the yawn heuristic |
| `MAX_YAWN_LIMIT` | `3` | Yawn count that triggers a danger alert |
| `TARGET_FPS` | `30` | Target processing rate |

These are the values currently present in the source code, not recommended or medically validated settings. Do not interpret them as proven indicators of driver fatigue.

## Privacy Notes

The project does not implement an application backend or cloud-storage feature. Webcam frames are passed to the browser-side MediaPipe code for processing. The application downloads third-party JavaScript libraries from jsDelivr, so an internet connection is required. Before using or deploying the app, review third-party dependencies, browser camera permissions, and the privacy requirements that apply to your use case.

## Known Limitations

- The algorithm relies on fixed thresholds and does not perform automatic calibration for each person.
- Landmark quality can be affected by low light, camera angle, head movement, occlusion, or glasses.
- The current code does not provide formal performance metrics, validation data, or a benchmark against labeled drowsiness events.
- Yawning is only an indirect cue and does not, by itself, prove that a driver is sleepy.
- The application is not designed, tested, or certified for use as a real vehicle safety system.
- The current yawn-counting logic is a simple heuristic and would benefit from more robust event segmentation and testing.

## Potential Improvements

- Evaluate and calibrate EAR/MAR thresholds against a labeled dataset and varied lighting conditions.
- Add explicit handling for face loss, camera errors, and denied permissions.
- Improve yawn event segmentation to avoid counting one prolonged mouth-opening event more than once.
- Add configurable thresholds and a short setup/calibration step.
- Add automated tests and report precision, recall, and false-alert rates on a documented test set.
- Add a screenshot or short demo recording to the repository after capturing the actual application running.

## Acknowledgements

- [MediaPipe](https://github.com/google-ai-edge/mediapipe) for browser-based face landmark technology.
- [MediaPipe Face Mesh documentation](https://github.com/google-ai-edge/mediapipe/blob/master/docs/solutions/face_mesh.md) for the JavaScript solution reference.

## Asset Attribution

The two alarm audio files were carried over from the original project. Before publishing this repository publicly, confirm that you own these files or have permission to redistribute them. If their source or license is unclear, replace them with audio that is licensed for redistribution and record the attribution here.

## Author

Developed as an academic project exploring browser-based computer vision and rule-based drowsiness indicators.

---

**Disclaimer:** This software is a learning prototype, not a safety-critical product. Do not use it to decide whether it is safe to drive.
