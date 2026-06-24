import os
os.environ["KMP_DUPLICATE_LIB_OK"] = "TRUE"
import torch
import json

import cv2
import numpy as np
from fastapi import FastAPI, UploadFile, File, Response
from fastapi.middleware.cors import CORSMiddleware
from ultralytics import YOLO
from pydantic import BaseModel
from typing import List, Optional


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

@app.post("/calibrate/detect_corners")
async def detect_corners(file: UploadFile = File(...), rows: int = 9, cols: int = 6):
    try:
        image_bytes = await file.read()
        nparr = np.frombuffer(image_bytes, np.uint8)
        img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
        gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
        
        # Find the chessboard corners
        ret, corners = cv2.findChessboardCorners(gray, (cols, rows), None)
        
        if ret:
            # Refine corners
            criteria = (cv2.TERM_CRITERIA_EPS + cv2.TERM_CRITERIA_MAX_ITER, 30, 0.001)
            corners2 = cv2.cornerSubPix(gray, corners, (11, 11), (-1, -1), criteria)
            corners_list = corners2.reshape(-1, 2).tolist()
            return {
                "success": True, 
                "corners": corners_list,
                "message": "Chessboard corners successfully detected."
            }
        else:
            return {
                "success": False, 
                "corners": [],
                "message": "Failed to find chessboard corners. Check pattern size or image quality."
            }
    except Exception as e:
        return {"success": False, "corners": [], "error": str(e)}

class CalibrationRequest(BaseModel):
    corners_list: List[List[List[float]]]
    rows: int = 9
    cols: int = 6
    square_size: float = 25.0
    image_width: int = 640
    image_height: int = 480

@app.post("/calibrate/run_calibration")
async def run_calibration(req: CalibrationRequest):
    try:
        # Prepare object points, like (0,0,0), (1,0,0), (2,0,0) ....,(cols-1,rows-1,0)
        objp = np.zeros((req.cols * req.rows, 3), np.float32)
        objp[:, :2] = np.mgrid[0:req.cols, 0:req.rows].T.reshape(-1, 2)
        objp = objp * req.square_size
        
        objpoints = [] # 3d point in real world space
        imgpoints = [] # 2d points in image plane.
        
        for corners in req.corners_list:
            if len(corners) == req.cols * req.rows:
                objpoints.append(objp)
                imgpoints.append(np.array(corners, dtype=np.float32).reshape(-1, 1, 2))
                
        if len(objpoints) < 3:
            return {
                "success": False, 
                "error": "At least 3 valid sets of corners are required for calibration."
            }
            
        ret, mtx, dist, rvecs, tvecs = cv2.calibrateCamera(
            objpoints, imgpoints, (req.image_width, req.image_height), None, None
        )
        
        if ret:
            return {
                "success": True,
                "reprojection_error": float(ret),
                "camera_matrix": mtx.tolist(),
                "distortion_coefficients": dist.flatten().tolist(),
                "message": "Camera calibration successful."
            }
        else:
            return {
                "success": False,
                "error": "OpenCV camera calibration calculation failed."
            }
    except Exception as e:
        return {"success": False, "error": str(e)}

last_frames = {}

@app.post("/cv/process")
async def cv_process(
    file: UploadFile = File(...),
    filter_type: str = "GRAY",
    camera_id: str = "default_camera",
    threshold_value: int = 100,
    mm_per_pixel: float = 0.0,
    dim_measure_mode: str = "WIDTH",
    dim_unit: str = "mm",
    dim_min_mm: Optional[float] = None,
    dim_max_mm: Optional[float] = None,
    dim_threshold: int = 80,
    target_count: int = 3,
    change_threshold: int = 25
):
    try:
        image_bytes = await file.read()
        nparr = np.frombuffer(image_bytes, np.uint8)
        img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
        if img is None:
            return Response(content=b"Invalid image format", status_code=400)
            
        h, w = img.shape[:2]
        processed_img = img.copy()
        calculated_val = "-"
        is_passed = True
        detections = []
        
        # Check standard filterTypes
        if filter_type in ("GRAY", "GRAYSCALE"):
            processed_img = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
            calculated_val = "Grayscale Active"
            is_passed = True
            
        elif filter_type == "CANNY" or filter_type == "EDGE":
            gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
            processed_img = cv2.Canny(gray, threshold_value, threshold_value * 2)
            calculated_val = f"Canny Edges (Thresh: {threshold_value})"
            is_passed = True
            
        elif filter_type == "THRESHOLD":
            gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
            _, processed_img = cv2.threshold(gray, threshold_value, 255, cv2.THRESH_BINARY)
            calculated_val = f"Thresholded (Thresh: {threshold_value})"
            is_passed = True
            
        elif filter_type == "SOBEL":
            gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
            sobelx = cv2.Sobel(gray, cv2.CV_8U, 1, 0, ksize=3)
            sobely = cv2.Sobel(gray, cv2.CV_8U, 0, 1, ksize=3)
            processed_img = cv2.addWeighted(sobelx, 0.5, sobely, 0.5, 0)
            calculated_val = "Sobel Gradients Active"
            is_passed = True
            
        elif filter_type == "COUNTING":
            gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
            _, thresh = cv2.threshold(gray, threshold_value, 255, cv2.THRESH_BINARY_INV)
            contours, hierarchy = cv2.findContours(thresh, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
            
            count = 0
            for i, cnt in enumerate(contours):
                area = cv2.contourArea(cnt)
                if area > 300:
                    count += 1
                    cv2.drawContours(processed_img, contours, i, (34, 197, 94), 2)
            calculated_val = f"{count} parts counted"
            is_passed = count == target_count
            
        elif filter_type == "CHANGE_DETECTOR":
            gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
            # Define central ROI matching the UI box (size 60x60, centered)
            roi_size = 60
            sx = max(0, (w - roi_size) // 2)
            sy = max(0, (h - roi_size) // 2)
            
            roi_gray = gray[sy:sy+roi_size, sx:sx+roi_size]
            
            change_percent = 0
            is_change_detected = False
            
            ref_key = f"{camera_id}_change"
            ref = last_frames.get(ref_key)
            if ref is not None and ref.shape == roi_gray.shape:
                diff_mat = cv2.absdiff(roi_gray, ref)
                _, thresh_mat = cv2.threshold(diff_mat, 30, 255, cv2.THRESH_BINARY)
                non_zero = cv2.countNonZero(thresh_mat)
                change_percent = int((non_zero / (roi_size * roi_size)) * 100)
                is_change_detected = change_percent >= change_threshold
                
            last_frames[ref_key] = roi_gray.copy()
            
            color = (34, 197, 94) if is_change_detected else (8, 179, 234) # BGR
            cv2.rectangle(processed_img, (sx - 10, sy - 10), (sx + roi_size + 10, sy + roi_size + 10), color, 3)
            
            calculated_val = "MOTION" if is_change_detected else "NO MOTION"
            is_passed = is_change_detected
            
            detections.append({
                "type": "change",
                "x": sx,
                "y": sy,
                "w": roi_size,
                "h": roi_size,
                "changePercent": change_percent,
                "changeThreshold": change_threshold,
                "isChangeDetected": is_change_detected
            })
            
        elif filter_type in ("DIMENSION", "INSPECTION"):
            gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
            blurred = cv2.GaussianBlur(gray, (5, 5), 0)
            edges = cv2.Canny(blurred, dim_threshold, dim_threshold * 2)
            
            kernel = np.ones((3, 3), np.uint8)
            dilated = cv2.dilate(edges, kernel, iterations=1)
            
            contours, _ = cv2.findContours(dilated, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
            
            part_count = 0
            measured_val = 0.0
            
            for cnt in contours:
                area = cv2.contourArea(cnt)
                if area > 500:
                    part_count += 1
                    cv2.drawContours(processed_img, [cnt], -1, (129, 185, 16), 2)
                    
                    rect = cv2.minAreaRect(cnt)
                    box = cv2.boxPoints(rect)
                    box = np.int0(box)
                    cv2.drawContours(processed_img, [box], 0, (129, 185, 16), 1)
                    
                    (cx, cy), (w_px, h_px), angle = rect
                    
                    if mm_per_pixel > 0:
                        w_mm = w_px * mm_per_pixel
                        h_mm = h_px * mm_per_pixel
                        diag_mm = np.sqrt(w_px**2 + h_px**2) * mm_per_pixel
                        area_mm2 = w_mm * h_mm
                        
                        if dim_measure_mode == "WIDTH":
                            measured_val = w_mm
                        elif dim_measure_mode == "HEIGHT":
                            measured_val = h_mm
                        elif dim_measure_mode == "DIAGONAL":
                            measured_val = diag_mm
                        elif dim_measure_mode == "AREA":
                            measured_val = area_mm2
                            
                        detections.append({
                            "cx": float(cx),
                            "cy": float(cy),
                            "w": float(w_px),
                            "h": float(h_px),
                            "angle": float(angle),
                            "label": f"W: {w_mm:.2f} {dim_unit}",
                            "h_label": f"H: {h_mm:.2f}",
                            "area_label": f"{area_mm2:.1f} {dim_unit}2"
                        })
            
            if mm_per_pixel > 0 and part_count > 0:
                calculated_val = f"{measured_val:.3f} {dim_unit}"
                is_passed = True
                if dim_min_mm is not None and measured_val < dim_min_mm:
                    is_passed = False
                if dim_max_mm is not None and measured_val > dim_max_mm:
                    is_passed = False
            else:
                calculated_val = f"{part_count} parts detected" if mm_per_pixel > 0 else "UNCALIBRATED"
                is_passed = mm_per_pixel > 0

        _, encoded_img = cv2.imencode(".jpg", processed_img)
        img_bytes = encoded_img.tobytes()
        
        headers = {
            "Access-Control-Expose-Headers": "X-Calculated-Value, X-Is-Passed, X-Detections",
            "X-Calculated-Value": str(calculated_val),
            "X-Is-Passed": str(is_passed).lower(),
            "X-Detections": json.dumps(detections)
        }
        return Response(content=img_bytes, media_type="image/jpeg", headers=headers)
        
    except Exception as e:
        return Response(content=str(e).encode(), status_code=500, headers={"X-Error": str(e)})

def snap_to_edge(img_edges, x, y, max_radius=30):
    h, w = img_edges.shape
    x_int, y_int = int(round(x)), int(round(y))
    # Bound-check
    x_int = max(0, min(x_int, w - 1))
    y_int = max(0, min(y_int, h - 1))
    
    if img_edges[y_int, x_int] > 0:
        return float(x_int), float(y_int)
        
    best_dist = float('inf')
    best_pt = (float(x), float(y))
    
    # Concentric search
    for r in range(1, max_radius + 1):
        found_in_layer = False
        for dy in range(-r, r + 1):
            for dx in range(-r, r + 1):
                if abs(dx) != r and abs(dy) != r:
                    continue
                nx, ny = x_int + dx, y_int + dy
                if 0 <= nx < w and 0 <= ny < h:
                    if img_edges[ny, nx] > 0:
                        d = np.sqrt((nx - x)**2 + (ny - y)**2)
                        if d < best_dist:
                            best_dist = d
                            best_pt = (float(nx), float(ny))
                            found_in_layer = True
        if found_in_layer:
            break
            
    return best_pt

@app.post("/detect/ruler")
async def detect_ruler(
    file: UploadFile = File(...),
    x1: float = 0.0,
    y1: float = 0.0,
    x2: float = 0.0,
    y2: float = 0.0,
    mm_per_pixel: float = 0.1170
):
    try:
        image_bytes = await file.read()
        nparr = np.frombuffer(image_bytes, np.uint8)
        img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
        if img is None:
            return Response(content=b"Invalid image format", status_code=400)
            
        h, w = img.shape[:2]
        
        # Convert to gray, blur, and Canny edge detection
        gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
        blurred = cv2.GaussianBlur(gray, (5, 5), 0)
        edged = cv2.Canny(blurred, 50, 150)
        
        # Dilate slightly to make edge lines continuous and easier to snap
        kernel = np.ones((3, 3), np.uint8)
        dilated = cv2.dilate(edged, kernel, iterations=1)
        
        # Snap points to edges
        sx1, sy1 = snap_to_edge(dilated, x1, y1, max_radius=30)
        sx2, sy2 = snap_to_edge(dilated, x2, y2, max_radius=30)
        
        # Calculate pixel distance
        pixel_dist = float(np.sqrt((sx2 - sx1)**2 + (sy2 - sy1)**2))
        
        # Calibration
        if mm_per_pixel <= 0:
            mm_per_pixel = 0.1170
        physical_dist = pixel_dist * mm_per_pixel
        
        # Draw on copy of original image
        annotated_img = img.copy()
        
        # Draw red crosshairs at original user points to show snapped displacement
        # Point 1 crosshair
        cv2.line(annotated_img, (int(x1)-4, int(y1)), (int(x1)+4, int(y1)), (0, 0, 255), 1)
        cv2.line(annotated_img, (int(x1), int(y1)-4), (int(x1), int(y1)+4), (0, 0, 255), 1)
        # Point 2 crosshair
        cv2.line(annotated_img, (int(x2)-4, int(y2)), (int(x2)+4, int(y2)), (0, 0, 255), 1)
        cv2.line(annotated_img, (int(x2), int(y2)-4), (int(x2), int(y2)+4), (0, 0, 255), 1)
        
        # Draw snapped points (green filled circles)
        cv2.circle(annotated_img, (int(sx1), int(sy1)), 5, (34, 197, 94), -1)
        cv2.circle(annotated_img, (int(sx2), int(sy2)), 5, (34, 197, 94), -1)
        
        # Draw green main ruler line
        cv2.line(annotated_img, (int(sx1), int(sy1)), (int(sx2), int(sy2)), (34, 197, 94), 2)
        
        # Draw tick marks (perpendicular lines) at endpoints
        dx = sx2 - sx1
        dy = sy2 - sy1
        L = np.sqrt(dx**2 + dy**2)
        if L > 0:
            nx = -dy / L
            ny = dx / L
            tick_len = 8
            
            # Tick at start point
            p1_start = (int(sx1 - nx * tick_len), int(sy1 - ny * tick_len))
            p1_end = (int(sx1 + nx * tick_len), int(sy1 + ny * tick_len))
            cv2.line(annotated_img, p1_start, p1_end, (34, 197, 94), 2)
            
            # Tick at end point
            p2_start = (int(sx2 - nx * tick_len), int(sy2 - ny * tick_len))
            p2_end = (int(sx2 + nx * tick_len), int(sy2 + ny * tick_len))
            cv2.line(annotated_img, p2_start, p2_end, (34, 197, 94), 2)
            
        # Draw text label in the middle of the line
        cx = int((sx1 + sx2) / 2)
        cy = int((sy1 + sy2) / 2)
        
        val_str = f"{physical_dist:.2f} mm"
        
        # Text settings
        font = cv2.FONT_HERSHEY_SIMPLEX
        font_scale = 0.5
        thickness = 1
        (tw, th), baseline = cv2.getTextSize(val_str, font, font_scale, thickness)
        
        # Draw a dark background rectangle for text readability
        pad = 4
        tx1 = cx - tw // 2 - pad
        ty1 = cy - th // 2 - pad
        tx2 = cx + tw // 2 + pad
        ty2 = cy + th // 2 + pad + baseline
        
        # Fill rectangle (slate/dark background)
        cv2.rectangle(annotated_img, (tx1, ty1), (tx2, ty2), (15, 23, 42), -1)
        # Border
        cv2.rectangle(annotated_img, (tx1, ty1), (tx2, ty2), (34, 197, 94), 1)
        
        # Put text
        cv2.putText(annotated_img, val_str, (cx - tw // 2, cy + th // 2), font, font_scale, (255, 255, 255), thickness, cv2.LINE_AA)
        
        # Encode image
        _, encoded_img = cv2.imencode(".jpg", annotated_img)
        img_bytes = encoded_img.tobytes()
        
        # Construct ruler metadata
        ruler_metadata = {
            "p1": [x1, y1],
            "p2": [x2, y2],
            "sp1": [sx1, sy1],
            "sp2": [sx2, sy2],
            "pixel_distance": round(pixel_dist, 2),
            "value": round(physical_dist, 2),
            "unit": "mm"
        }
        
        headers = {
            "Access-Control-Expose-Headers": "X-Calculated-Value, X-Is-Passed, X-Detections, X-Ruler-Result",
            "X-Calculated-Value": val_str,
            "X-Is-Passed": "true",
            "X-Ruler-Result": json.dumps(ruler_metadata)
        }
        
        return Response(content=img_bytes, media_type="image/jpeg", headers=headers)
        
    except Exception as e:
        return Response(content=str(e).encode(), status_code=500, headers={"X-Error": str(e)})

@app.post("/detect/circle")
async def detect_circle(
    file: UploadFile = File(...),
    mm_per_pixel: float = 0.1170,
    min_radius: int = 10,
    max_radius: int = 200,
    param1: int = 100,
    param2: int = 30
):
    """Detect circles and measure diameter, radius, and area."""
    try:
        image_bytes = await file.read()
        nparr = np.frombuffer(image_bytes, np.uint8)
        img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
        if img is None:
            return Response(content=b"Invalid image format", status_code=400)

        h, w = img.shape[:2]
        annotated_img = img.copy()

        gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
        blurred = cv2.GaussianBlur(gray, (9, 9), 2)

        circles = cv2.HoughCircles(
            blurred,
            cv2.HOUGH_GRADIENT,
            dp=1.2,
            minDist=max(30, min_radius * 2),
            param1=param1,
            param2=param2,
            minRadius=min_radius,
            maxRadius=max_radius
        )

        detections = []
        calculated_val = "No circles detected"
        is_passed = False

        if circles is not None:
            circles = np.round(circles[0, :]).astype("int")
            is_passed = True

            for i, (cx, cy, r) in enumerate(circles):
                diameter_px = r * 2
                radius_mm = r * mm_per_pixel
                diameter_mm = diameter_px * mm_per_pixel
                area_mm2 = np.pi * (radius_mm ** 2)

                # Draw circle outline
                cv2.circle(annotated_img, (cx, cy), r, (34, 197, 94), 2)
                # Draw center crosshair
                cross_len = max(5, r // 4)
                cv2.line(annotated_img, (cx - cross_len, cy), (cx + cross_len, cy), (34, 197, 94), 1)
                cv2.line(annotated_img, (cx, cy - cross_len), (cx, cy + cross_len), (34, 197, 94), 1)
                # Draw center point
                cv2.circle(annotated_img, (cx, cy), 3, (34, 197, 94), -1)

                # Draw diameter line
                cv2.line(annotated_img, (cx - r, cy), (cx + r, cy), (56, 189, 248), 2)
                # Draw radius line (vertical)
                cv2.line(annotated_img, (cx, cy), (cx, cy - r), (245, 158, 11), 1)

                # Diameter label
                label_str = f"D: {diameter_mm:.2f} mm"
                font = cv2.FONT_HERSHEY_SIMPLEX
                font_scale = 0.45
                thickness = 1
                (tw, th), baseline = cv2.getTextSize(label_str, font, font_scale, thickness)
                pad = 4
                lx = cx - tw // 2
                ly = cy + r + 20

                # Clamp label position
                lx = max(pad, min(lx, w - tw - pad))
                ly = max(th + pad, min(ly, h - pad))

                cv2.rectangle(annotated_img, (lx - pad, ly - th - pad), (lx + tw + pad, ly + pad + baseline), (15, 23, 42), -1)
                cv2.rectangle(annotated_img, (lx - pad, ly - th - pad), (lx + tw + pad, ly + pad + baseline), (34, 197, 94), 1)
                cv2.putText(annotated_img, label_str, (lx, ly), font, font_scale, (255, 255, 255), thickness, cv2.LINE_AA)

                # Radius label below diameter
                r_label = f"R: {radius_mm:.2f} mm"
                (rw, rh), _ = cv2.getTextSize(r_label, font, 0.4, 1)
                ry = ly + th + pad + 14
                rx = cx - rw // 2
                rx = max(pad, min(rx, w - rw - pad))
                ry = min(ry, h - pad)
                cv2.putText(annotated_img, r_label, (rx, ry), font, 0.4, (56, 189, 248), 1, cv2.LINE_AA)

                # Area label
                a_label = f"A: {area_mm2:.1f} mm2"
                (aw, ah), _ = cv2.getTextSize(a_label, font, 0.4, 1)
                ay = ry + 14
                ax = cx - aw // 2
                ax = max(pad, min(ax, w - aw - pad))
                ay = min(ay, h - pad)
                cv2.putText(annotated_img, a_label, (ax, ay), font, 0.4, (245, 158, 11), 1, cv2.LINE_AA)

                detections.append({
                    "cx": int(cx), "cy": int(cy), "radius_px": int(r),
                    "diameter_mm": round(diameter_mm, 3),
                    "radius_mm": round(radius_mm, 3),
                    "area_mm2": round(area_mm2, 2),
                    "label": label_str
                })

            calculated_val = detections[0]["label"] if detections else "No circles"

        _, encoded_img = cv2.imencode(".jpg", annotated_img)
        img_bytes = encoded_img.tobytes()

        circle_result = {
            "count": len(circles) if circles is not None else 0,
            "circles": detections
        }

        headers = {
            "Access-Control-Expose-Headers": "X-Calculated-Value, X-Is-Passed, X-Detections, X-Circle-Result",
            "X-Calculated-Value": str(calculated_val),
            "X-Is-Passed": str(is_passed).lower(),
            "X-Detections": json.dumps(detections),
            "X-Circle-Result": json.dumps(circle_result)
        }
        return Response(content=img_bytes, media_type="image/jpeg", headers=headers)

    except Exception as e:
        return Response(content=str(e).encode(), status_code=500, headers={"X-Error": str(e)})


@app.post("/detect/angle")
async def detect_angle(
    file: UploadFile = File(...),
    canny_threshold: int = 50,
    min_line_length: int = 50,
    max_line_gap: int = 10
):
    """Detect two dominant lines and measure the angle between them."""
    try:
        image_bytes = await file.read()
        nparr = np.frombuffer(image_bytes, np.uint8)
        img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
        if img is None:
            return Response(content=b"Invalid image format", status_code=400)

        h, w = img.shape[:2]
        annotated_img = img.copy()

        gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
        blurred = cv2.GaussianBlur(gray, (5, 5), 0)
        edges = cv2.Canny(blurred, canny_threshold, canny_threshold * 2)

        lines = cv2.HoughLinesP(
            edges,
            rho=1,
            theta=np.pi / 180,
            threshold=50,
            minLineLength=min_line_length,
            maxLineGap=max_line_gap
        )

        detections = []
        calculated_val = "No lines detected"
        is_passed = False

        if lines is not None and len(lines) >= 2:
            # Sort lines by length (longest first)
            line_lengths = []
            for line in lines:
                x1, y1, x2, y2 = line[0]
                length = np.sqrt((x2 - x1) ** 2 + (y2 - y1) ** 2)
                line_lengths.append((length, line[0]))
            line_lengths.sort(key=lambda x: x[0], reverse=True)

            # Take two longest lines
            l1 = line_lengths[0][1]
            l2 = line_lengths[1][1]

            # Calculate angle of each line
            def line_angle(x1, y1, x2, y2):
                return np.arctan2(y2 - y1, x2 - x1)

            angle1 = line_angle(l1[0], l1[1], l1[2], l1[3])
            angle2 = line_angle(l2[0], l2[1], l2[2], l2[3])

            # Angle between the two lines
            angle_diff = abs(angle1 - angle2)
            angle_deg = np.degrees(angle_diff)
            # Normalize to 0-180
            if angle_deg > 180:
                angle_deg = 360 - angle_deg

            is_passed = True
            calculated_val = f"{angle_deg:.1f} deg"

            # Draw line 1 (cyan)
            cv2.line(annotated_img, (l1[0], l1[1]), (l1[2], l1[3]), (56, 189, 248), 3)
            cv2.circle(annotated_img, (l1[0], l1[1]), 5, (56, 189, 248), -1)
            cv2.circle(annotated_img, (l1[2], l1[3]), 5, (56, 189, 248), -1)

            # Draw line 2 (yellow)
            cv2.line(annotated_img, (l2[0], l2[1]), (l2[2], l2[3]), (245, 158, 11), 3)
            cv2.circle(annotated_img, (l2[0], l2[1]), 5, (245, 158, 11), -1)
            cv2.circle(annotated_img, (l2[2], l2[3]), 5, (245, 158, 11), -1)

            # Find intersection point (or midpoint approximation)
            def line_intersection(p1, p2, p3, p4):
                x1, y1 = p1
                x2, y2 = p2
                x3, y3 = p3
                x4, y4 = p4
                denom = (x1 - x2) * (y3 - y4) - (y1 - y2) * (x3 - x4)
                if abs(denom) < 1e-10:
                    return None
                t = ((x1 - x3) * (y3 - y4) - (y1 - y3) * (x3 - x4)) / denom
                ix = x1 + t * (x2 - x1)
                iy = y1 + t * (y2 - y1)
                return (int(ix), int(iy))

            intersection = line_intersection(
                (l1[0], l1[1]), (l1[2], l1[3]),
                (l2[0], l2[1]), (l2[2], l2[3])
            )

            # Draw angle arc at intersection
            if intersection and 0 <= intersection[0] < w and 0 <= intersection[1] < h:
                ix, iy = intersection
                arc_radius = 30
                start_angle = np.degrees(angle1)
                end_angle = np.degrees(angle2)
                if start_angle > end_angle:
                    start_angle, end_angle = end_angle, start_angle
                cv2.ellipse(annotated_img, (ix, iy), (arc_radius, arc_radius),
                            0, start_angle, end_angle, (34, 197, 94), 2)
                cv2.circle(annotated_img, (ix, iy), 4, (34, 197, 94), -1)

                # Angle label
                label_str = f"{angle_deg:.1f} deg"
                font = cv2.FONT_HERSHEY_SIMPLEX
                font_scale = 0.55
                thickness = 1
                (tw, th_t), baseline = cv2.getTextSize(label_str, font, font_scale, thickness)
                pad = 5
                tx = ix + arc_radius + 5
                ty = iy + 5
                tx = max(pad, min(tx, w - tw - pad * 2))
                ty = max(th_t + pad, min(ty, h - pad))

                cv2.rectangle(annotated_img, (tx - pad, ty - th_t - pad), (tx + tw + pad, ty + pad + baseline), (15, 23, 42), -1)
                cv2.rectangle(annotated_img, (tx - pad, ty - th_t - pad), (tx + tw + pad, ty + pad + baseline), (34, 197, 94), 1)
                cv2.putText(annotated_img, label_str, (tx, ty), font, font_scale, (255, 255, 255), thickness, cv2.LINE_AA)
            else:
                # If no intersection, draw label at midpoint between lines
                mid_x = (l1[0] + l1[2] + l2[0] + l2[2]) // 4
                mid_y = (l1[1] + l1[3] + l2[1] + l2[3]) // 4
                label_str = f"{angle_deg:.1f} deg"
                font = cv2.FONT_HERSHEY_SIMPLEX
                font_scale = 0.55
                (tw, th_t), baseline = cv2.getTextSize(label_str, font, font_scale, 1)
                pad = 5
                cv2.rectangle(annotated_img, (mid_x - pad, mid_y - th_t - pad), (mid_x + tw + pad, mid_y + pad + baseline), (15, 23, 42), -1)
                cv2.rectangle(annotated_img, (mid_x - pad, mid_y - th_t - pad), (mid_x + tw + pad, mid_y + pad + baseline), (34, 197, 94), 1)
                cv2.putText(annotated_img, label_str, (mid_x, mid_y), font, font_scale, (255, 255, 255), 1, cv2.LINE_AA)

            detections.append({
                "angle_deg": round(angle_deg, 2),
                "line1": {"x1": int(l1[0]), "y1": int(l1[1]), "x2": int(l1[2]), "y2": int(l1[3])},
                "line2": {"x1": int(l2[0]), "y1": int(l2[1]), "x2": int(l2[2]), "y2": int(l2[3])},
                "intersection": list(intersection) if intersection else None,
                "label": calculated_val
            })

        _, encoded_img = cv2.imencode(".jpg", annotated_img)
        img_bytes = encoded_img.tobytes()

        angle_result = {
            "angles": detections
        }

        headers = {
            "Access-Control-Expose-Headers": "X-Calculated-Value, X-Is-Passed, X-Detections, X-Angle-Result",
            "X-Calculated-Value": str(calculated_val),
            "X-Is-Passed": str(is_passed).lower(),
            "X-Detections": json.dumps(detections),
            "X-Angle-Result": json.dumps(angle_result)
        }
        return Response(content=img_bytes, media_type="image/jpeg", headers=headers)

    except Exception as e:
        return Response(content=str(e).encode(), status_code=500, headers={"X-Error": str(e)})


@app.post("/detect/contour_geometry")
async def detect_contour_geometry(
    file: UploadFile = File(...),
    mm_per_pixel: float = 0.1170,
    threshold_value: int = 80,
    min_area_px: int = 500
):
    """Detect contours and measure perimeter and area of each object."""
    try:
        image_bytes = await file.read()
        nparr = np.frombuffer(image_bytes, np.uint8)
        img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
        if img is None:
            return Response(content=b"Invalid image format", status_code=400)

        h, w = img.shape[:2]
        annotated_img = img.copy()

        gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
        blurred = cv2.GaussianBlur(gray, (5, 5), 0)
        edges = cv2.Canny(blurred, threshold_value, threshold_value * 2)

        kernel = np.ones((3, 3), np.uint8)
        dilated = cv2.dilate(edges, kernel, iterations=1)

        contours, _ = cv2.findContours(dilated, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)

        detections = []
        calculated_val = "No contours detected"
        is_passed = False

        # Color palette for multiple contours
        colors = [
            (34, 197, 94),   # green
            (56, 189, 248),  # cyan
            (245, 158, 11),  # amber
            (168, 85, 247),  # purple
            (239, 68, 68),   # red
            (16, 185, 129),  # emerald
        ]

        obj_count = 0
        for cnt in contours:
            area_px = cv2.contourArea(cnt)
            if area_px < min_area_px:
                continue

            obj_count += 1
            color = colors[(obj_count - 1) % len(colors)]

            perimeter_px = cv2.arcLength(cnt, True)
            area_mm2 = area_px * (mm_per_pixel ** 2)
            perimeter_mm = perimeter_px * mm_per_pixel

            # Draw contour
            cv2.drawContours(annotated_img, [cnt], -1, color, 2)

            # Draw filled overlay
            overlay = annotated_img.copy()
            cv2.drawContours(overlay, [cnt], -1, color, -1)
            cv2.addWeighted(overlay, 0.15, annotated_img, 0.85, 0, annotated_img)

            # Centroid
            M = cv2.moments(cnt)
            if M["m00"] > 0:
                cx = int(M["m10"] / M["m00"])
                cy = int(M["m01"] / M["m00"])
            else:
                x, y, cw, ch = cv2.boundingRect(cnt)
                cx, cy = x + cw // 2, y + ch // 2

            # Draw centroid
            cv2.circle(annotated_img, (cx, cy), 4, color, -1)

            # Min enclosing circle (dotted reference)
            (ecx, ecy), ec_radius = cv2.minEnclosingCircle(cnt)
            cv2.circle(annotated_img, (int(ecx), int(ecy)), int(ec_radius), color, 1)

            # Bounding box
            x, y, bw, bh = cv2.boundingRect(cnt)
            cv2.rectangle(annotated_img, (x, y), (x + bw, y + bh), color, 1)

            # Labels
            font = cv2.FONT_HERSHEY_SIMPLEX
            font_scale = 0.42
            thickness = 1
            pad = 4

            p_label = f"P: {perimeter_mm:.2f} mm"
            a_label = f"A: {area_mm2:.1f} mm2"

            # Perimeter label
            (tw1, th1), _ = cv2.getTextSize(p_label, font, font_scale, thickness)
            lx = cx - tw1 // 2
            ly = cy - 10
            lx = max(pad, min(lx, w - tw1 - pad))
            ly = max(th1 + pad, min(ly, h - pad))

            cv2.rectangle(annotated_img, (lx - pad, ly - th1 - pad), (lx + tw1 + pad, ly + pad), (15, 23, 42), -1)
            cv2.rectangle(annotated_img, (lx - pad, ly - th1 - pad), (lx + tw1 + pad, ly + pad), color, 1)
            cv2.putText(annotated_img, p_label, (lx, ly), font, font_scale, (255, 255, 255), thickness, cv2.LINE_AA)

            # Area label
            (tw2, th2), _ = cv2.getTextSize(a_label, font, font_scale, thickness)
            ly2 = ly + th1 + pad * 2 + 4
            lx2 = cx - tw2 // 2
            lx2 = max(pad, min(lx2, w - tw2 - pad))
            ly2 = min(ly2, h - pad)

            cv2.rectangle(annotated_img, (lx2 - pad, ly2 - th2 - pad), (lx2 + tw2 + pad, ly2 + pad), (15, 23, 42), -1)
            cv2.rectangle(annotated_img, (lx2 - pad, ly2 - th2 - pad), (lx2 + tw2 + pad, ly2 + pad), color, 1)
            cv2.putText(annotated_img, a_label, (lx2, ly2), font, font_scale, (255, 255, 255), thickness, cv2.LINE_AA)

            # Object number label
            obj_label = f"#{obj_count}"
            cv2.putText(annotated_img, obj_label, (x + 4, y - 6), font, 0.5, color, 1, cv2.LINE_AA)

            detections.append({
                "object_id": obj_count,
                "cx": int(cx), "cy": int(cy),
                "perimeter_mm": round(perimeter_mm, 3),
                "area_mm2": round(area_mm2, 2),
                "perimeter_px": round(perimeter_px, 2),
                "area_px": round(area_px, 2),
                "bounding_box": {"x": int(x), "y": int(y), "w": int(bw), "h": int(bh)},
                "p_label": p_label,
                "a_label": a_label
            })

        if obj_count > 0:
            is_passed = True
            calculated_val = f"{obj_count} objects | {detections[0]['p_label']}, {detections[0]['a_label']}"

        _, encoded_img = cv2.imencode(".jpg", annotated_img)
        img_bytes = encoded_img.tobytes()

        contour_result = {
            "contours": detections
        }

        headers = {
            "Access-Control-Expose-Headers": "X-Calculated-Value, X-Is-Passed, X-Detections, X-Contour-Result",
            "X-Calculated-Value": str(calculated_val),
            "X-Is-Passed": str(is_passed).lower(),
            "X-Detections": json.dumps(detections),
            "X-Contour-Result": json.dumps(contour_result)
        }
        return Response(content=img_bytes, media_type="image/jpeg", headers=headers)

    except Exception as e:
        return Response(content=str(e).encode(), status_code=500, headers={"X-Error": str(e)})


@app.post("/blueprint/parse")
async def parse_blueprint(file: UploadFile = File(...)):
    """Parse blueprint dimensions from DXF, SVG, or PDF files using Python libraries."""
    filename = file.filename.lower()
    content = await file.read()
    
    import re
    import time
    import io
    
    if filename.endswith(".dxf"):
        # DXF Parsing
        try:
            import ezdxf
        except ImportError:
            return {
                "success": False,
                "error": "ezdxf library is not installed in the python environment. Please run pip install ezdxf",
                "dimensions": []
            }
            
        try:
            dxf_text = content.decode('utf-8', errors='ignore')
            doc = ezdxf.read(io.StringIO(dxf_text))
            msp = doc.modelspace()
            dimensions = []
            
            # 1. Parse DIMENSION entities
            for idx, entity in enumerate(msp.query("DIMENSION")):
                try:
                    text = entity.dxf.text if hasattr(entity.dxf, 'text') else ""
                    spec = "0.0"
                    tol_min = 0.0
                    tol_max = 0.0
                    unit = "mm"
                    
                    if text:
                        match_pm = re.search(r'([\d\.]+)\s*±\s*([\d\.]+)', text)
                        if match_pm:
                            spec = match_pm.group(1)
                            tol_val = float(match_pm.group(2))
                            tol_min = -tol_val
                            tol_max = tol_val
                        else:
                            match_single = re.search(r'([\d\.]+)', text)
                            if match_single:
                                spec = match_single.group(1)
                    
                    # Coordinate extraction
                    x1, y1 = 150, 180
                    x2, y2 = 350, 180
                    
                    if hasattr(entity.dxf, 'defpoint'):
                        x1, y1 = entity.dxf.defpoint.x, entity.dxf.defpoint.y
                    if hasattr(entity.dxf, 'defpoint2'):
                        x2, y2 = entity.dxf.defpoint2.x, entity.dxf.defpoint2.y
                    elif hasattr(entity.dxf, 'defpoint3'):
                        x2, y2 = entity.dxf.defpoint3.x, entity.dxf.defpoint3.y
                    
                    dimensions.append({
                        "id": f"dim_dxf_{idx}_{int(time.time() * 1000)}",
                        "label": f"DXF Dimension {idx + 1}",
                        "spec": spec if spec != "0.0" else "50.0",
                        "tolMin": tol_min if tol_min != 0.0 else -0.5,
                        "tolMax": tol_max if tol_max != 0.0 else 0.5,
                        "variable": "Meas_Length",
                        "unit": unit,
                        "category": "dimension",
                        "measureType": "linear_horizontal",
                        "indicatorType": "horizontal",
                        "gdt_symbol": "",
                        "x1": float(x1), "y1": float(y1),
                        "x2": float(x2), "y2": float(y2),
                        "lx": float((x1 + x2) / 2), "ly": float((y1 + y2) / 2 + 10)
                    })
                except Exception as ex:
                    print(f"Error parsing dxf dimension: {ex}")
            
            # 2. Parse CIRCLE entities (useful as diameter features if no DIMENSION is present)
            if not dimensions:
                for idx, entity in enumerate(msp.query("CIRCLE")):
                    try:
                        center = entity.dxf.center
                        radius = entity.dxf.radius
                        cx, cy = center.x, center.y
                        
                        dimensions.append({
                            "id": f"dim_dxf_circle_{idx}_{int(time.time() * 1000)}",
                            "label": f"Bore Diameter {idx + 1}",
                            "spec": f"{radius * 2:.2f}",
                            "tolMin": -0.05,
                            "tolMax": 0.05,
                            "variable": "Meas_Diameter",
                            "unit": "mm",
                            "category": "diameter",
                            "measureType": "diameter",
                            "indicatorType": "radial",
                            "gdt_symbol": "⌀",
                            "x1": float(cx - radius), "y1": float(cy),
                            "x2": float(cx + radius), "y2": float(cy),
                            "lx": float(cx), "ly": float(cy)
                        })
                    except Exception as ex:
                        print(f"Error parsing dxf circle: {ex}")
                        
            # Normalize coordinates to fit React canvas 500x360
            if dimensions:
                all_x = []
                all_y = []
                for d in dimensions:
                    all_x.extend([d["x1"], d["x2"]])
                    all_y.extend([d["y1"], d["y2"]])
                if all_x and all_y:
                    min_x, max_x = min(all_x), max(all_x)
                    min_y, max_y = min(all_y), max(all_y)
                    span_x = max_x - min_x if max_x != min_x else 1.0
                    span_y = max_y - min_y if max_y != min_y else 1.0
                    
                    for d in dimensions:
                        d["x1"] = 50 + ((d["x1"] - min_x) / span_x) * 400
                        d["x2"] = 50 + ((d["x2"] - min_x) / span_x) * 400
                        d["y1"] = 50 + ((d["y1"] - min_y) / span_y) * 260
                        d["y2"] = 50 + ((d["y2"] - min_y) / span_y) * 260
                        d["lx"] = (d["x1"] + d["x2"]) / 2
                        d["ly"] = (d["y1"] + d["y2"]) / 2 - 15
            
            if not dimensions:
                dimensions = [
                    {
                        "id": f"dim_dxf_def_{int(time.time() * 1000)}",
                        "label": "Auto-detected Dimension",
                        "spec": "100.0",
                        "tolMin": -0.2,
                        "tolMax": 0.2,
                        "variable": "Meas_Length",
                        "unit": "mm",
                        "category": "dimension",
                        "measureType": "linear_horizontal",
                        "indicatorType": "horizontal",
                        "gdt_symbol": "",
                        "x1": 100, "y1": 180, "x2": 400, "y2": 180,
                        "lx": 250, "ly": 170
                    }
                ]
                
            return {"success": True, "dimensions": dimensions}
        except Exception as e:
            return {"success": False, "error": f"Failed to parse DXF file: {str(e)}", "dimensions": []}
            
    elif filename.endswith(".pdf"):
        # PDF Parsing
        try:
            import pypdf
        except ImportError:
            try:
                import PyPDF2 as pypdf
            except ImportError:
                return {
                    "success": False,
                    "error": "pypdf/PyPDF2 library is not installed in the python environment. Please run pip install pypdf",
                    "dimensions": []
                }
                
        try:
            pdf_file = io.BytesIO(content)
            reader = pypdf.PdfReader(pdf_file)
            text_content = ""
            for page in reader.pages:
                text_content += page.extract_text() or ""
                
            dimensions = []
            
            # Find patterns like "80.0 +/- 0.2" or "80.0±0.2"
            matches = re.findall(r'(\d+(?:\.\d+)?)\s*(?:\+/-|±|\+/-\s*|[-+]/)\s*(\d+(?:\.\d+)?)', text_content)
            for idx, (spec_val, tol_val) in enumerate(matches):
                spec = float(spec_val)
                tol = float(tol_val)
                dimensions.append({
                    "id": f"dim_pdf_{idx}_{int(time.time() * 1000)}",
                    "label": f"PDF Spec Dimension {idx + 1}",
                    "spec": str(spec),
                    "tolMin": -tol,
                    "tolMax": tol,
                    "variable": "Meas_Length",
                    "unit": "mm",
                    "category": "dimension",
                    "measureType": "linear_horizontal",
                    "indicatorType": "horizontal",
                    "gdt_symbol": "",
                    "x1": 80, "y1": 100 + idx * 45,
                    "x2": 420, "y2": 100 + idx * 45,
                    "lx": 250, "ly": 90 + idx * 45
                })
                
            # Fallback to plain float dimensions with "mm" unit
            if not dimensions:
                matches_plain = re.findall(r'(\d+(?:\.\d+)?)\s*mm', text_content)
                for idx, spec_val in enumerate(matches_plain[:5]):
                    dimensions.append({
                        "id": f"dim_pdf_plain_{idx}_{int(time.time() * 1000)}",
                        "label": f"PDF Measurement {idx + 1}",
                        "spec": spec_val,
                        "tolMin": -0.1,
                        "tolMax": 0.1,
                        "variable": "Meas_Length",
                        "unit": "mm",
                        "category": "dimension",
                        "measureType": "linear_horizontal",
                        "indicatorType": "horizontal",
                        "gdt_symbol": "",
                        "x1": 80, "y1": 120 + idx * 40,
                        "x2": 420, "y2": 120 + idx * 40,
                        "lx": 250, "ly": 110 + idx * 40
                    })
                    
            if not dimensions:
                # Default dimension
                dimensions = [
                    {
                        "id": f"dim_pdf_def_{int(time.time() * 1000)}",
                        "label": "Extracted PDF Dimension",
                        "spec": "80.0",
                        "tolMin": -0.05,
                        "tolMax": 0.05,
                        "variable": "Cylinder_Bore_Dia",
                        "unit": "mm",
                        "category": "diameter",
                        "measureType": "diameter",
                        "indicatorType": "radial",
                        "gdt_symbol": "⌀",
                        "x1": 50, "y1": 100, "x2": 50, "y2": 220,
                        "lx": 30, "ly": 160
                    }
                ]
                
            # Render first page as PNG if PyMuPDF is available
            rendered_image = None
            try:
                import fitz
                import base64
                doc = fitz.open(stream=content, filetype="pdf")
                if len(doc) > 0:
                    zoom = 2.5
                    mat = fitz.Matrix(zoom, zoom)
                    pix = doc[0].get_pixmap(matrix=mat)
                    png_bytes = pix.tobytes("png")
                    base64_png = base64.b64encode(png_bytes).decode("utf-8")
                    rendered_image = f"data:image/png;base64,{base64_png}"
            except Exception as render_ex:
                print(f"Failed to render PDF page: {render_ex}")

            return {"success": True, "dimensions": dimensions, "rendered_image": rendered_image}
        except Exception as e:
            return {"success": False, "error": f"Failed to parse PDF file: {str(e)}", "dimensions": []}

            
    elif filename.endswith(".svg"):
        # SVG XML Parsing
        try:
            import xml.etree.ElementTree as ET
            root = ET.fromstring(content)
            
            circles = []
            lines = []
            
            for elem in root.iter():
                tag_name = elem.tag.split('}')[-1].lower() if '}' in elem.tag else elem.tag.lower()
                if tag_name == "circle":
                    circles.append(elem)
                elif tag_name == "line":
                    lines.append(elem)
            
            dimensions = []
            
            for idx, circle in enumerate(circles[:3]):
                try:
                    cx = float(circle.attrib.get('cx', 150))
                    cy = float(circle.attrib.get('cy', 150))
                    r = float(circle.attrib.get('r', 25))
                    
                    dimensions.append({
                        "id": f"dim_svg_circle_{idx}_{int(time.time() * 1000)}",
                        "label": f"SVG Circle Diameter {idx + 1}",
                        "spec": f"{r * 2:.1f}",
                        "tolMin": -0.1,
                        "tolMax": 0.1,
                        "variable": "Meas_Diameter",
                        "unit": "mm",
                        "category": "diameter",
                        "measureType": "diameter",
                        "indicatorType": "radial",
                        "gdt_symbol": "⌀",
                        "x1": float(cx - r), "y1": float(cy),
                        "x2": float(cx + r), "y2": float(cy),
                        "lx": float(cx), "ly": float(cy)
                    })
                except Exception as ex:
                    print(f"Error parsing circle element: {ex}")
                    
            for idx, line in enumerate(lines[:3]):
                try:
                    x1 = float(line.attrib.get('x1', 100))
                    y1 = float(line.attrib.get('y1', 100))
                    x2 = float(line.attrib.get('x2', 300))
                    y2 = float(line.attrib.get('y2', 100))
                    
                    length = ((x2 - x1) ** 2 + (y2 - y1) ** 2) ** 0.5
                    if length < 15:
                        continue
                        
                    dimensions.append({
                        "id": f"dim_svg_line_{idx}_{int(time.time() * 1000)}",
                        "label": f"SVG Line Dimension {idx + 1}",
                        "spec": f"{length:.1f}",
                        "tolMin": -0.5,
                        "tolMax": 0.5,
                        "variable": "Meas_Length",
                        "unit": "mm",
                        "category": "dimension",
                        "measureType": "linear_horizontal",
                        "indicatorType": "horizontal",
                        "gdt_symbol": "",
                        "x1": float(x1), "y1": float(y1),
                        "x2": float(x2), "y2": float(y2),
                        "lx": float((x1 + x2) / 2), "ly": float((y1 + y2) / 2 - 10)
                    })
                except Exception as ex:
                    print(f"Error parsing line element: {ex}")
            
            # Normalize SVG coords to React canvas 500x360
            if dimensions:
                all_x = []
                all_y = []
                for d in dimensions:
                    all_x.extend([d["x1"], d["x2"]])
                    all_y.extend([d["y1"], d["y2"]])
                if all_x and all_y:
                    min_x, max_x = min(all_x), max(all_x)
                    min_y, max_y = min(all_y), max(all_y)
                    span_x = max_x - min_x if max_x != min_x else 1.0
                    span_y = max_y - min_y if max_y != min_y else 1.0
                    
                    for d in dimensions:
                        d["x1"] = 50 + ((d["x1"] - min_x) / span_x) * 400
                        d["x2"] = 50 + ((d["x2"] - min_x) / span_x) * 400
                        d["y1"] = 50 + ((d["y1"] - min_y) / span_y) * 260
                        d["y2"] = 50 + ((d["y2"] - min_y) / span_y) * 260
                        d["lx"] = (d["x1"] + d["x2"]) / 2
                        d["ly"] = (d["y1"] + d["y2"]) / 2 - 15
            
            if not dimensions:
                dimensions = [
                    {
                        "id": f"dim_svg_def_{int(time.time() * 1000)}",
                        "label": "SVG Extracted Spec",
                        "spec": "50.0",
                        "tolMin": -0.2,
                        "tolMax": 0.2,
                        "variable": "Meas_Height",
                        "unit": "mm",
                        "category": "dimension",
                        "measureType": "linear_vertical",
                        "indicatorType": "vertical",
                        "gdt_symbol": "",
                        "x1": 150, "y1": 80, "x2": 150, "y2": 280,
                        "lx": 130, "ly": 180
                    }
                ]
                
            return {"success": True, "dimensions": dimensions}
        except Exception as e:
            return {"success": False, "error": f"Failed to parse SVG file: {str(e)}", "dimensions": []}
            
    else:
        return {"success": False, "error": "Unsupported file format. Please upload .dxf, .pdf, or .svg.", "dimensions": []}


class PDFConvertRequest(BaseModel):
    pdf_data_url: str
    page_num: Optional[int] = 0

@app.post("/blueprint/pdf_to_image")
async def convert_pdf_to_image(req: PDFConvertRequest):
    try:
        # pdf_data_url is like "data:application/pdf;base64,JVBERi0xLj..."
        if "," in req.pdf_data_url:
            base64_data = req.pdf_data_url.split(",")[1]
        else:
            base64_data = req.pdf_data_url
            
        import base64
        pdf_bytes = base64.b64decode(base64_data)
        
        try:
            import fitz  # PyMuPDF
        except ImportError:
            return {"success": False, "error": "PyMuPDF (fitz) is not installed on the server. Please run pip install pymupdf"}
            
        doc = fitz.open(stream=pdf_bytes, filetype="pdf")
        if len(doc) == 0:
            return {"success": False, "error": "The PDF file is empty or invalid."}
            
        page_num = min(max(0, req.page_num), len(doc) - 1)
        page = doc[page_num]
        
        zoom = 2.5
        mat = fitz.Matrix(zoom, zoom)
        pix = page.get_pixmap(matrix=mat)
        png_bytes = pix.tobytes("png")
        
        base64_png = base64.b64encode(png_bytes).decode("utf-8")
        image_url = f"data:image/png;base64,{base64_png}"
        
        return {
            "success": True,
            "image_url": image_url,
            "width": pix.width,
            "height": pix.height,
            "page_count": len(doc)
        }
    except Exception as e:
        return {"success": False, "error": str(e)}



# ─── OBD2 MANAGER & ENDPOINTS ──────────────────────────────────────────────────
class OBD2Manager:
    def __init__(self):
        self.connected = False
        self.transport = "NONE"
        self.simulated = True
        self.simulated_dtcs = ["P0300", "P0171", "P0420"]
        self.connect_time = 0
        self.smoothed_values = {}
        self.connection = None

    def connect(self, transport: str, port_or_ip: str = None, baudrate: int = 38400) -> bool:
        self.transport = transport
        self.connect_time = time.time()
        
        if transport == "SIMULATOR":
            self.connected = True
            self.simulated = True
            return True
            
        try:
            import obd
            if transport == "SERIAL":
                if port_or_ip:
                    self.connection = obd.OBD(port_or_ip, baudrate=baudrate)
                else:
                    self.connection = obd.OBD()
            elif transport == "WIFI" or transport == "BLUETOOTH":
                # For network/wifi ELM327 OBD2, pass connection string or IP:Port
                if port_or_ip:
                    self.connection = obd.OBD(port_or_ip)
                else:
                    self.connection = obd.OBD()
                    
            if self.connection and self.connection.is_connected():
                self.connected = True
                self.simulated = False
                return True
            else:
                # Safe fallback to simulator in dev if no hardware
                self.connected = True
                self.simulated = True
                return True
        except Exception as e:
            print(f"Failed to load python-obd or connect to real ELM327 device: {e}. Falling back to Simulation Mode.")
            self.connected = True
            self.simulated = True
            return True

    def disconnect(self):
        if self.connection:
            try:
                self.connection.close()
            except Exception:
                pass
            self.connection = None
        self.connected = False
        self.transport = "NONE"
        self.simulated = True

    def query(self, pid: str):
        if not self.connected:
            raise Exception("OBD2: Not connected")
            
        pid = pid.upper()
        now = time.time()
        
        if pid == "DTC":
            return {
                "value": json.dumps(self.simulated_dtcs),
                "unit": "",
                "label": "Diagnostic Trouble Codes"
            }
            
        if pid == "VIN":
            return {
                "value": "JHM1234567890ABCD" if self.simulated else (self.connection.query(obd.commands.VIN).value or "Unknown"),
                "unit": "",
                "label": "Vehicle Identification Number"
            }

        if self.simulated:
            value = 0
            unit = ""
            label = pid
            
            if pid == "010C":  # RPM
                sec = int(now) % 30
                if 10 < sec < 15:
                    value = int(1800 + random.random() * 200)
                elif 15 <= sec < 18:
                    value = int(2500 + random.random() * 300)
                else:
                    value = int(780 + random.random() * 40)
                unit = "rpm"
                label = "Engine RPM"
            elif pid == "010D":  # Speed
                sec = int(now) % 30
                if 10 < sec < 20:
                    value = int((sec - 10) * 8 + random.random() * 5)
                elif 20 <= sec < 25:
                    value = int(max(0, 80 - (sec - 20) * 15))
                else:
                    value = 0
                unit = "km/h"
                label = "Vehicle Speed"
            elif pid == "0105":  # Coolant Temp
                elapsed = int(now - self.connect_time)
                value = min(92, 70 + int(elapsed / 2))
                if value == 92:
                    value += random.randint(-1, 1)
                unit = "°C"
                label = "Coolant Temp"
            elif pid == "0104":  # Engine Load
                sec = int(now) % 30
                if 10 < sec < 18:
                    value = round(45 + random.random() * 10, 1)
                else:
                    value = round(15 + random.random() * 3, 1)
                unit = "%"
                label = "Engine Load"
            elif pid == "0111":  # Throttle
                sec = int(now) % 30
                if 10 < sec < 18:
                    value = round(35 + random.random() * 15, 1)
                else:
                    value = round(14.5 + random.random() * 1, 1)
                unit = "%"
                label = "Throttle Position"
            elif pid == "0142":  # Battery Voltage
                value = round(13.8 + random.random() * 0.3, 2)
                unit = "V"
                label = "Battery Voltage"
            elif pid == "012F":  # Fuel Level
                value = 65
                unit = "%"
                label = "Fuel Level"
            elif pid == "0101":  # MIL status
                value = "ON" if len(self.simulated_dtcs) > 0 else "OFF"
                unit = ""
                label = "MIL / DTC Count"
            else:
                value = 0
                unit = ""
                
            return {"value": value, "unit": unit, "label": label}
        else:
            try:
                import obd
                cmd_map = {
                    "0104": obd.commands.ENGINE_LOAD,
                    "0105": obd.commands.COOLANT_TEMP,
                    "0106": obd.commands.SHORT_FUEL_TRIM_1,
                    "0107": obd.commands.LONG_FUEL_TRIM_1,
                    "010A": obd.commands.FUEL_PRESSURE,
                    "010B": obd.commands.INTAKE_PRESSURE,
                    "010C": obd.commands.RPM,
                    "010D": obd.commands.SPEED,
                    "010E": obd.commands.TIMING_ADVANCE,
                    "010F": obd.commands.INTAKE_TEMP,
                    "0110": obd.commands.MAF,
                    "0111": obd.commands.THROTTLE_POS,
                    "012F": obd.commands.FUEL_LEVEL,
                    "0133": obd.commands.BAROMETRIC_PRESSURE,
                    "0142": obd.commands.CONTROL_MODULE_VOLTAGE,
                    "015C": obd.commands.AMBIANT_AIR_TEMP,
                }
                
                cmd = cmd_map.get(pid)
                if cmd:
                    response = self.connection.query(cmd)
                    if response and not response.is_null():
                        val = response.value
                        magnitude = getattr(val, "magnitude", val)
                        unit_str = str(getattr(val, "units", ""))
                        
                        if pid == "010C" and isinstance(magnitude, (int, float)):
                            magnitude = round(magnitude / 10) * 10
                            
                        return {
                            "value": magnitude,
                            "unit": unit_str,
                            "label": cmd.name.replace("_", " ").title()
                        }
                return {"value": 0, "unit": "", "label": pid}
            except Exception as e:
                print(f"Error querying real OBD: {e}")
                return {"value": 0, "unit": "", "label": pid}

    def clear_dtcs(self) -> bool:
        if not self.connected:
            raise Exception("OBD2: Not connected")
        if self.simulated:
            self.simulated_dtcs = []
            return True
        else:
            try:
                import obd
                self.connection.query(obd.commands.CLEAR_DTC)
                return True
            except Exception:
                return False


obd_manager = OBD2Manager()


class OBDConnectRequest(BaseModel):
    transport: str
    port_or_ip: Optional[str] = None
    baudrate: Optional[int] = 38400


@app.post("/obd/connect")
async def obd_connect(req: OBDConnectRequest):
    success = obd_manager.connect(req.transport, req.port_or_ip, req.baudrate)
    return {
        "success": success, 
        "transport": obd_manager.transport,
        "simulated": obd_manager.simulated,
        "message": "OBD2 Connected successfully" if success else "OBD2 connection failed"
    }


@app.post("/obd/disconnect")
async def obd_disconnect():
    obd_manager.disconnect()
    return {"success": True, "message": "OBD2 Disconnected"}


@app.get("/obd/status")
async def obd_status():
    return {
        "connected": obd_manager.connected,
        "transport": obd_manager.transport,
        "simulated": obd_manager.simulated,
        "status": "connected" if obd_manager.connected else "disconnected"
    }


@app.get("/obd/query")
async def obd_query(pid: str):
    try:
        res = obd_manager.query(pid)
        return {"success": True, "pid": pid, **res}
    except Exception as e:
        return {"success": False, "error": str(e)}


@app.post("/obd/clear_dtc")
async def obd_clear_dtc():
    try:
        success = obd_manager.clear_dtcs()
        return {"success": success}
    except Exception as e:
        return {"success": False, "error": str(e)}


# ── PLC Connection Manager ──────────────────────────────────────────────
class PLCConnectionManager:
    def __init__(self):
        # Maps controller_id -> { "type": ptype, "ip": ip, "port": port, "params": params, "client": client, "simulated": bool, "connected": bool, "sim_values": dict }
        self.connections = {}

    def connect(self, controller_id: str, plc_type: str, ip: str, port: int, params: dict = None) -> dict:
        ptype = plc_type.upper()
        
        # If already connected, disconnect first
        if controller_id in self.connections:
            try:
                import asyncio
                loop = asyncio.get_event_loop()
                if loop.is_running():
                    loop.create_task(self.disconnect(controller_id))
                else:
                    loop.run_until_complete(self.disconnect(controller_id))
            except Exception:
                pass

        simulated = True
        client = None
        error_msg = None
        
        if ptype == "SIEMENS_S7":
            rack = int(params.get("rack", 0)) if params else 0
            slot = int(params.get("slot", 1)) if params else 1
            try:
                import snap7
                client = snap7.client.Client()
                client.connect(ip, rack, slot, port)
                simulated = False
            except Exception as e:
                error_msg = f"Failed to connect using snap7: {str(e)}. Falling back to simulation."
                client = None
                simulated = True

        elif ptype == "OPC_UA":
            url = params.get("url", f"opc.tcp://{ip}:{port}") if params else f"opc.tcp://{ip}:{port}"
            try:
                from asyncua import Client as UaClient
                client = UaClient(url=url)
                # Since connection requires async await, we register the client. 
                # The actual connection will be established or verified asynchronously inside read/write or connection task
                simulated = False
            except Exception as e:
                error_msg = f"Failed to load asyncua Client: {str(e)}. Falling back to simulation."
                client = None
                simulated = True
                
        elif ptype == "MODBUS_TCP":
            try:
                from pymodbus.client import ModbusTcpClient
                client = ModbusTcpClient(ip, port=port)
                connected = client.connect()
                if connected:
                    simulated = False
                else:
                    error_msg = "Pymodbus connect returned False. Falling back to simulation."
                    simulated = True
            except Exception as e:
                error_msg = f"Failed to connect using pymodbus: {str(e)}. Falling back to simulation."
                client = None
                simulated = True
        else:
            simulated = True
            error_msg = f"Unknown PLC type: {plc_type}. Defaulting to simulation."

        self.connections[controller_id] = {
            "type": ptype,
            "ip": ip,
            "port": port,
            "params": params or {},
            "client": client,
            "simulated": simulated,
            "connected": True,
            "sim_values": {},
            "error": error_msg
        }
        
        return {
            "success": True,
            "simulated": simulated,
            "message": f"Connected to {plc_type} PLC ({ip}:{port})" + (f" (Simulated due to: {error_msg})" if simulated else "")
        }

    async def disconnect(self, controller_id: str) -> bool:
        if controller_id not in self.connections:
            return False
        
        conn = self.connections[controller_id]
        client = conn.get("client")
        ptype = conn.get("type")
        simulated = conn.get("simulated")
        
        if not simulated and client:
            try:
                if ptype == "SIEMENS_S7":
                    client.disconnect()
                elif ptype == "OPC_UA":
                    await client.disconnect()
                elif ptype == "MODBUS_TCP":
                    client.close()
            except Exception as e:
                print(f"Error disconnecting PLC {controller_id}: {e}")
                
        del self.connections[controller_id]
        return True

    async def read_tag(self, controller_id: str, reg_type: str, address: int, data_type: str = "INTEGER", params: dict = None) -> dict:
        if controller_id not in self.connections:
            return {"success": False, "error": f"Controller {controller_id} is not connected."}
        
        conn = self.connections[controller_id]
        simulated = conn.get("simulated")
        ptype = conn.get("type")
        client = conn.get("client")
        sim_values = conn.get("sim_values")
        
        if simulated:
            sim_key = f"{reg_type}_{address}"
            if sim_key not in sim_values:
                if data_type.upper() == "BOOLEAN":
                    sim_values[sim_key] = False
                elif "FLOAT" in data_type.upper() or "REAL" in data_type.upper():
                    sim_values[sim_key] = 20.0 + (address % 10) + np.random.normal(0, 0.1)
                else:
                    sim_values[sim_key] = (100 + address % 50)
            else:
                if data_type.upper() == "BOOLEAN":
                    if np.random.random() < 0.02:
                        sim_values[sim_key] = not sim_values[sim_key]
                elif "FLOAT" in data_type.upper() or "REAL" in data_type.upper():
                    sim_values[sim_key] += np.random.normal(0, 0.05)
                    if sim_values[sim_key] < 0: sim_values[sim_key] = 0.0
                else:
                    sim_values[sim_key] = int(sim_values[sim_key] + int(np.random.choice([-1, 0, 1]))) & 0xFFFF
            
            raw_val = sim_values[sim_key]
            if isinstance(raw_val, bool):
                return {"success": True, "value": 1 if raw_val else 0, "simulated": True}
            return {"success": True, "value": raw_val, "simulated": True}
        
        # Real hardware polling
        try:
            if ptype == "SIEMENS_S7":
                db_num = int(params.get("dbNumber", 1)) if params else 1
                offset = int(address)
                size = 2
                dtype_upper = data_type.upper()
                if dtype_upper == "BOOLEAN": size = 1
                elif dtype_upper == "BYTE": size = 1
                elif dtype_upper in ["DINT", "FLOAT", "REAL"]: size = 4
                
                area = 0x84 # DB
                if reg_type.upper() == "INPUT": area = 0x81
                elif reg_type.upper() == "OUTPUT": area = 0x82
                elif reg_type.upper() == "MERKER": area = 0x83
                
                data = client.read_area(area, db_num, offset, size)
                if dtype_upper == "BOOLEAN":
                    bit_offset = int(params.get("bitOffset", 0)) if params else 0
                    val = (data[0] >> bit_offset) & 1
                    return {"success": True, "value": val, "simulated": False}
                elif dtype_upper in ["FLOAT", "REAL"]:
                    import struct
                    val = struct.unpack(">f", data)[0]
                    return {"success": True, "value": val, "simulated": False}
                elif size == 4:
                    import struct
                    val = struct.unpack(">i", data)[0]
                    return {"success": True, "value": val, "simulated": False}
                else:
                    import struct
                    val = struct.unpack(">h", data)[0]
                    return {"success": True, "value": val, "simulated": False}

            elif ptype == "OPC_UA":
                node_id = params.get("nodeId", f"ns=2;s={address}") if params else f"ns=2;s={address}"
                # OPC UA Async connection helper
                async with client:
                    node = client.get_node(node_id)
                    val = await node.read_value()
                    if isinstance(val, bool):
                        return {"success": True, "value": 1 if val else 0, "simulated": False}
                    return {"success": True, "value": val, "simulated": False}

            elif ptype == "MODBUS_TCP":
                address = int(address)
                qty = int(params.get("quantity", 1)) if params else 1
                reg_type_upper = reg_type.upper()
                
                if reg_type_upper == "COIL":
                    res = client.read_coils(address, count=qty)
                    if res.isError(): raise Exception(str(res))
                    val = [1 if x else 0 for x in res.bits[:qty]]
                elif reg_type_upper == "DISCRETE_INPUT":
                    res = client.read_discrete_inputs(address, count=qty)
                    if res.isError(): raise Exception(str(res))
                    val = [1 if x else 0 for x in res.bits[:qty]]
                elif reg_type_upper == "INPUT_REGISTER":
                    res = client.read_input_registers(address, count=qty)
                    if res.isError(): raise Exception(str(res))
                    val = res.registers[:qty]
                else:
                    res = client.read_holding_registers(address, count=qty)
                    if res.isError(): raise Exception(str(res))
                    val = res.registers[:qty]
                
                return {"success": True, "value": val[0] if qty == 1 else val, "simulated": False}

            else:
                return {"success": False, "error": f"Unsupported real PLC protocol: {ptype}"}

        except Exception as e:
            return {"success": False, "error": f"Real PLC read error: {str(e)}"}

    async def write_tag(self, controller_id: str, reg_type: str, address: int, value, data_type: str = "INTEGER", params: dict = None) -> dict:
        if controller_id not in self.connections:
            return {"success": False, "error": f"Controller {controller_id} is not connected."}
        
        conn = self.connections[controller_id]
        simulated = conn.get("simulated")
        ptype = conn.get("type")
        client = conn.get("client")
        sim_values = conn.get("sim_values")
        dtype_upper = data_type.upper()
        
        if simulated:
            sim_key = f"{reg_type}_{address}"
            if dtype_upper == "BOOLEAN":
                sim_values[sim_key] = str(value).lower() in ["true", "1", "yes"]
            elif "FLOAT" in dtype_upper or "REAL" in dtype_upper:
                sim_values[sim_key] = float(value)
            else:
                sim_values[sim_key] = int(float(value))
            return {"success": True, "value": sim_values[sim_key], "simulated": True}
        
        try:
            if ptype == "SIEMENS_S7":
                db_num = int(params.get("dbNumber", 1)) if params else 1
                offset = int(address)
                size = 2
                if dtype_upper == "BOOLEAN": size = 1
                elif dtype_upper == "BYTE": size = 1
                elif dtype_upper in ["DINT", "FLOAT", "REAL"]: size = 4
                
                area = 0x84
                if reg_type.upper() == "INPUT": area = 0x81
                elif reg_type.upper() == "OUTPUT": area = 0x82
                elif reg_type.upper() == "MERKER": area = 0x83
                
                import struct
                if dtype_upper == "BOOLEAN":
                    bit_offset = int(params.get("bitOffset", 0)) if params else 0
                    current_byte = client.read_area(area, db_num, offset, 1)
                    byte_val = current_byte[0]
                    if str(value).lower() in ["true", "1", "yes"]:
                        byte_val |= (1 << bit_offset)
                    else:
                        byte_val &= ~(1 << bit_offset)
                    data_to_write = bytes([byte_val])
                elif dtype_upper in ["FLOAT", "REAL"]:
                    data_to_write = struct.pack(">f", float(value))
                elif size == 4:
                    data_to_write = struct.pack(">i", int(float(value)))
                else:
                    data_to_write = struct.pack(">h", int(float(value)))
                
                client.write_area(area, db_num, offset, data_to_write)
                return {"success": True, "value": value, "simulated": False}

            elif ptype == "OPC_UA":
                node_id = params.get("nodeId", f"ns=2;s={address}") if params else f"ns=2;s={address}"
                async with client:
                    node = client.get_node(node_id)
                    val_type = await node.read_data_type_as_variant_type()
                    from asyncua import ua
                    
                    if dtype_upper == "BOOLEAN":
                        v = ua.Variant(str(value).lower() in ["true", "1", "yes"], val_type)
                    elif "FLOAT" in dtype_upper or "REAL" in dtype_upper:
                        v = ua.Variant(float(value), val_type)
                    else:
                        v = ua.Variant(int(float(value)), val_type)
                    await node.write_value(v)
                return {"success": True, "value": value, "simulated": False}

            elif ptype == "MODBUS_TCP":
                address = int(address)
                reg_type_upper = reg_type.upper()
                if reg_type_upper == "COIL":
                    val = str(value).lower() in ["true", "1", "yes"]
                    res = client.write_coil(address, val)
                    if res.isError(): raise Exception(str(res))
                else:
                    val = int(float(value))
                    res = client.write_register(address, val)
                    if res.isError(): raise Exception(str(res))
                return {"success": True, "value": value, "simulated": False}
                
            else:
                return {"success": False, "error": f"Unsupported PLC type {ptype}"}

        except Exception as e:
            return {"success": False, "error": f"Real PLC write error: {str(e)}"}


plc_manager = PLCConnectionManager()


class PLCConnectRequest(BaseModel):
    controller_id: str
    plc_type: str
    ip: str
    port: int
    params: Optional[dict] = {}


class PLCReadRequest(BaseModel):
    controller_id: str
    reg_type: str
    address: int
    data_type: Optional[str] = "INTEGER"
    params: Optional[dict] = {}


class PLCWriteRequest(BaseModel):
    controller_id: str
    reg_type: str
    address: int
    value: str
    data_type: Optional[str] = "INTEGER"
    params: Optional[dict] = {}


@app.post("/plc/connect")
async def plc_connect(req: PLCConnectRequest):
    res = plc_manager.connect(
        controller_id=req.controller_id,
        plc_type=req.plc_type,
        ip=req.ip,
        port=req.port,
        params=req.params
    )
    return res


@app.post("/plc/disconnect")
async def plc_disconnect(req: dict):
    controller_id = req.get("controller_id")
    if not controller_id:
        return {"success": False, "error": "controller_id is required"}
    success = await plc_manager.disconnect(controller_id)
    return {"success": success}


@app.post("/plc/read")
async def plc_read(req: PLCReadRequest):
    res = await plc_manager.read_tag(
        controller_id=req.controller_id,
        reg_type=req.reg_type,
        address=req.address,
        data_type=req.data_type,
        params=req.params
    )
    return res


@app.post("/plc/write")
async def plc_write(req: PLCWriteRequest):
    res = await plc_manager.write_tag(
        controller_id=req.controller_id,
        reg_type=req.reg_type,
        address=req.address,
        value=req.value,
        data_type=req.data_type,
        params=req.params
    )
    return res


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
