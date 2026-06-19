import os
os.environ["KMP_DUPLICATE_LIB_OK"] = "TRUE"
import torch

import cv2
import numpy as np
from fastapi import FastAPI, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from ultralytics import YOLO

app = FastAPI(title="YOLOv8 Local Inference API")

# Enable CORS for browser access
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Load custom YOLO model (place your best.pt or yolov8n.pt in the same folder)
try:
    model = YOLO("yolov8n.pt")  # Fallback to default Nano model if no custom model is present
except Exception as e:
    print(f"Warning: Could not load model. Error: {e}")
    model = None

@app.post("/detect")
async def detect_objects(file: UploadFile = File(...)):
    if model is None:
        return {"error": "Model not loaded on server.", "predictions": []}
        
    try:
        image_bytes = await file.read()
        nparr = np.frombuffer(image_bytes, np.uint8)
        img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)

        results = model(img)
        predictions = []
        
        for box in results[0].boxes:
            x1, y1, x2, y2 = box.xyxy[0].tolist()
            cls_id = int(box.cls[0])
            label = results[0].names[cls_id]
            conf = float(box.conf[0]) * 100

            predictions.append({
                "x": int(x1),
                "y": int(y1),
                "w": int(x2 - x1),
                "h": int(y2 - y1),
                "label": label,
                "confidence": round(conf, 1)
            })
        return {"predictions": predictions}
    except Exception as e:
        return {"error": str(e), "predictions": []}
@app.post("/detect/color")
async def detect_color(file: UploadFile = File(...)):
    # Simple color detection (e.g. finding brightest spot or specific color range)
    try:
        image_bytes = await file.read()
        nparr = np.frombuffer(image_bytes, np.uint8)
        img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
        
        # Convert to HSV and detect e.g., red color as an example
        hsv = cv2.cvtColor(img, cv2.COLOR_BGR2HSV)
        lower_red = np.array([0, 120, 70])
        upper_red = np.array([10, 255, 255])
        mask1 = cv2.inRange(hsv, lower_red, upper_red)
        
        lower_red2 = np.array([170, 120, 70])
        upper_red2 = np.array([180, 255, 255])
        mask2 = cv2.inRange(hsv, lower_red2, upper_red2)
        
        mask = mask1 + mask2
        contours, _ = cv2.findContours(mask, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
        
        predictions = []
        for cnt in contours:
            area = cv2.contourArea(cnt)
            if area > 500: # filter small noise
                x, y, w, h = cv2.boundingRect(cnt)
                predictions.append({
                    "x": int(x), "y": int(y), "w": int(w), "h": int(h),
                    "label": "Color Match", "confidence": 100
                })
        return {"predictions": predictions}
    except Exception as e:
        return {"error": str(e), "predictions": []}

@app.post("/detect/change")
async def detect_change(file: UploadFile = File(...)):
    # For a stateless API, we might just return edges or require 2 images.
    # Here we do a simple edge detection (Canny) to represent 'features' 
    # Or in a real scenario, compare to a saved background.
    try:
        image_bytes = await file.read()
        nparr = np.frombuffer(image_bytes, np.uint8)
        img = cv2.imdecode(nparr, cv2.IMREAD_GRAYSCALE)
        
        edges = cv2.Canny(img, 100, 200)
        contours, _ = cv2.findContours(edges, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
        
        predictions = []
        for cnt in contours:
            area = cv2.contourArea(cnt)
            if area > 100:
                x, y, w, h = cv2.boundingRect(cnt)
                predictions.append({
                    "x": int(x), "y": int(y), "w": int(w), "h": int(h),
                    "label": "Change/Edge", "confidence": 100
                })
        return {"predictions": predictions}
    except Exception as e:
        return {"error": str(e), "predictions": []}

@app.post("/detect/measurement")
async def detect_measurement(file: UploadFile = File(...)):
    # Detect object contours and calculate bounding box size
    try:
        image_bytes = await file.read()
        nparr = np.frombuffer(image_bytes, np.uint8)
        img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
        
        gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
        blurred = cv2.GaussianBlur(gray, (5, 5), 0)
        edged = cv2.Canny(blurred, 50, 100)
        
        contours, _ = cv2.findContours(edged, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
        
        predictions = []
        for cnt in contours:
            area = cv2.contourArea(cnt)
            if area > 1000: # Only significant objects
                rect = cv2.minAreaRect(cnt)
                box = cv2.boxPoints(rect)
                box = np.int0(box)
                x, y, w, h = cv2.boundingRect(cnt)
                
                # Assume a calibration factor, e.g., 1 pixel = 0.1mm
                px_to_mm = 0.1
                width_mm = w * px_to_mm
                height_mm = h * px_to_mm
                
                predictions.append({
                    "x": int(x), "y": int(y), "w": int(w), "h": int(h),
                    "label": f"{width_mm:.1f}mm x {height_mm:.1f}mm", 
                    "confidence": 100
                })
        return {"predictions": predictions}
    except Exception as e:
        return {"error": str(e), "predictions": []}

@app.post("/detect/jig")
async def detect_jig(file: UploadFile = File(...)):
    # Simple mock jig detection/template matching
    try:
        image_bytes = await file.read()
        nparr = np.frombuffer(image_bytes, np.uint8)
        img = cv2.imdecode(nparr, cv2.IMREAD_GRAYSCALE)
        
        # Here we would normally use cv2.matchTemplate with a saved template.
        # As a mock, we'll just return a center bounding box.
        h, w = img.shape
        predictions = [{
            "x": int(w/4), "y": int(h/4), "w": int(w/2), "h": int(h/2),
            "label": "Jig Match", "confidence": 95
        }]
        return {"predictions": predictions}
    except Exception as e:
        return {"error": str(e), "predictions": []}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
