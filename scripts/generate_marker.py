# Save this temporarily as generate_marker.py in your scripts folder
import cv2

# Select the dictionary
dictionary = cv2.aruco.getPredefinedDictionary(cv2.aruco.DICT_4X4_50)

# Generate marker ID 0 with 400x400 resolution
marker_image = cv2.aruco.generateImageMarker(dictionary, id=0, sidePixels=400)

# Save to disk
cv2.imwrite("aruco_marker_id0.png", marker_image)
print("Marker generated: aruco_marker_id0.png")