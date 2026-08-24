import os
import cv2
import numpy as np
from typing import Tuple, Optional, Union

# Standard dictionary for small clinical markers
DEFAULT_ARUCO_DICT = cv2.aruco.DICT_4X4_50


def get_detector(dictionary_id: int = DEFAULT_ARUCO_DICT) -> cv2.aruco.ArucoDetector:
    """Initializes and returns the ArUco detector object."""
    aruco_dict = cv2.aruco.getPredefinedDictionary(dictionary_id)
    detector_params = cv2.aruco.DetectorParameters()

    # Adaptive thresholding parameters for varying room lighting conditions
    detector_params.adaptiveThreshWinSizeMin = 3
    detector_params.adaptiveThreshWinSizeMax = 23
    detector_params.adaptiveThreshWinSizeStep = 10

    return cv2.aruco.ArucoDetector(aruco_dict, detector_params)


def detect_marker_and_calculate_ratio(
        image_input: Union[str, np.ndarray],
        marker_real_size_cm: float = 2.0,
        dictionary_id: int = DEFAULT_ARUCO_DICT
) -> Tuple[Optional[float], Optional[np.ndarray], Optional[dict]]:
    """
    Detects an ArUco marker in the image and calculates the pixels-per-centimeter ratio.

    Args:
        image_input: File path (str) OR an OpenCV image array (np.ndarray).
        marker_real_size_cm: Real physical width of the marker in centimeters.
        dictionary_id: ArUco predefined dictionary identifier.

    Returns:
        Tuple containing:
        - pixels_per_cm (float or None): Calculated calibration factor.
        - annotated_image (np.ndarray or None): Image with detected marker drawn for visual debugging.
        - marker_info (dict or None): Detailed metrics (id, corner coordinates, detected side lengths).
    """
    # 1. Load image if path string is provided
    if isinstance(image_input, str):
        image = cv2.imread(image_input)
        if image is None:
            raise FileNotFoundError(f"Could not load image from path: {image_input}")
    elif isinstance(image_input, np.ndarray):
        image = image_input.copy()
    else:
        raise TypeError("image_input must be a file path string or a numpy ndarray")

    # 2. Convert to grayscale for thresholding
    if len(image.shape) == 3:
        gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
    else:
        gray = image

    # 3. Detect markers
    detector = get_detector(dictionary_id)
    corners, ids, _ = detector.detectMarkers(gray)

    # Edge Case: Marker missing or corrupted
    if corners is None or len(corners) == 0 or ids is None or len(ids) == 0:
        return None, None, None

    # 4. Extract the primary detected marker corners safely (shape: 4, 2)
    primary_corners = np.squeeze(corners[0])
    if primary_corners.shape != (4, 2):
        primary_corners = primary_corners.reshape(4, 2)

    top_left = primary_corners[0]
    top_right = primary_corners[1]
    bottom_right = primary_corners[2]
    bottom_left = primary_corners[3]

    # Calculate all 4 edge lengths using Euclidean distance
    top_edge = np.linalg.norm(top_right - top_left)
    right_edge = np.linalg.norm(bottom_right - top_right)
    bottom_edge = np.linalg.norm(bottom_left - bottom_right)
    left_edge = np.linalg.norm(top_left - bottom_left)

    # Average all 4 sides to compensate for perspective skew
    average_marker_pixel_width = (top_edge + right_edge + bottom_edge + left_edge) / 4.0
    pixels_per_cm = average_marker_pixel_width / marker_real_size_cm

    # 5. Draw detection markers on the frame for visual confirmation
    annotated_image = image.copy()
    cv2.aruco.drawDetectedMarkers(annotated_image, corners, ids)

    # Safely extract marker ID regardless of 1D or 2D array shape
    marker_id = int(np.array(ids).ravel()[0])

    marker_info = {
        "marker_id": marker_id,
        "corners": primary_corners.tolist(),
        "avg_pixel_width": round(float(average_marker_pixel_width), 2),
        "pixels_per_cm": round(float(pixels_per_cm), 2),
    }

    return pixels_per_cm, annotated_image, marker_info


def calculate_real_world_area(segmented_pixel_count: int, pixels_per_cm: float) -> float:
    """
    Converts total segmented pixel area into physical square centimeters.

    Formula:
        Area (cm^2) = Pixel Count / (pixels_per_cm ^ 2)
    """
    if pixels_per_cm <= 0:
        raise ValueError("pixels_per_cm must be greater than zero.")

    area_cm2 = segmented_pixel_count / (pixels_per_cm ** 2)
    return round(float(area_cm2), 3)


if __name__ == "__main__":
    script_dir = os.path.dirname(os.path.abspath(__file__))

    # Try finding the sample image with common extensions
    possible_names = [
        "sample_foot_with_marker_2.jpg",
        "sample_foot_with_marker.jpeg",
        "sample_foot_with_marker.jpg"
    ]

    test_image_path = None
    for name in possible_names:
        candidate = os.path.join(script_dir, name)
        if os.path.exists(candidate):
            test_image_path = candidate
            break

    if not test_image_path:
        # Fallback to root test marker if no photo is in ml_engine
        root_dir = os.path.abspath(os.path.join(script_dir, "../../../"))
        test_image_path = os.path.join(root_dir, "aruco_marker_id0.png")

    print(f"Testing on: {test_image_path}")

    try:
        ratio, annotated_img, metadata = detect_marker_and_calculate_ratio(
            image_input=test_image_path,
            marker_real_size_cm=2.0
        )

        if ratio is not None:
            print(f"✅ Calibration Successful: {ratio:.2f} px/cm")
            print(f"Marker Metadata: {metadata}")

            # Simulate a 12,500 pixel mask from your upcoming segmentation model
            simulated_mask_pixels = 12500
            real_area = calculate_real_world_area(simulated_mask_pixels, ratio)
            print(f"Computed Wound Area: {real_area} cm²")
        else:
            print("⚠️ No marker found. Prompting user to retake photo with marker visible.")

    except Exception as err:
        print(f"Execution Error: {err}")