import os
import streamlit as st
from PIL import Image
import torch
import pandas as pd
import argparse
import tempfile
import requests
from io import BytesIO

from src.model import get_model
from src.utils import load_model
from src.data_loader import get_val_transforms
from src.hybrid_inference import HybridFoodDetector
from src.yolo_model import YOLODetector
from src.settings import (
    DEVICE,
    CLASSIFICATION_DATA_DIR,
    DETECTION_DATA_DIR,
    LABELS_CSV_PATH,
    EFFICIENTNET_CHECKPOINT,
    YOLO_CHECKPOINT,
    VALIDATION,
    NUTRITION_DATA
)

# Set page config to wide layout for better display
st.set_page_config(
    page_title="Vietnamese Food Detection",
    page_icon="🍜",
    layout="wide",
    initial_sidebar_state="expanded"
)

def parse_args():
    parser = argparse.ArgumentParser(description="Streamlit Validation GUI - Hybrid Food Detection System")
    parser.add_argument("--model_type", type=str, default="hybrid",
                        choices=["efficientnet", "yolo", "hybrid"],
                        help="Type of model to use for validation (default: hybrid)")
    return parser.parse_args()

args = parse_args()
model_type = args.model_type

st.title("🍜 Vietnamese Food Detection - Hybrid System")
st.markdown(f"**Mode**: {model_type.replace('_', ' ').title()}")
st.markdown("---")

# Add mode selector in sidebar
st.sidebar.header("Detection Mode")
mode_options = {
    "hybrid": "🎯 Hybrid (YOLO + EfficientNet) - Recommended",
    "yolo": "📦 YOLO Only (Multi-dish detection)",
    "efficientnet": "🎨 EfficientNet Only (Single dish)"
}
selected_mode = st.sidebar.radio(
    "Choose detection mode:",
    ["hybrid", "yolo", "efficientnet"],
    format_func=lambda x: mode_options[x],
    index=0  # Default to hybrid
)

# Update model_type based on selection
if selected_mode != model_type:
    st.sidebar.warning("Please restart with: python app.py validate " + selected_mode)

st.sidebar.markdown("---")
st.sidebar.info("**Hybrid Mode** combines YOLOv10 detection with EfficientNet classification for best accuracy!")

# Load the trained model
device = torch.device(DEVICE)

# Load labels and create mappings
labels_df = pd.read_csv(LABELS_CSV_PATH)
class_names = labels_df['class_name'].unique()
num_classes = len(class_names)
idx_to_class = {i: class_name for i, class_name in enumerate(class_names)}
class_to_idx = {class_name: i for i, class_name in enumerate(class_names)}

# Initialize models based on mode
efficientnet_model = None
yolo_detector = None
hybrid_detector = None

try:
    if model_type == "efficientnet":
        st.write(f"Loading EfficientNet model from {EFFICIENTNET_CHECKPOINT}...")
        if not os.path.exists(EFFICIENTNET_CHECKPOINT):
            st.error(f"EfficientNet model not found at {EFFICIENTNET_CHECKPOINT}")
            st.info("Please train the EfficientNet model first using: python app.py train efficientnet")
            st.stop()
        efficientnet_model = get_model(num_classes)
        efficientnet_model = load_model(efficientnet_model, EFFICIENTNET_CHECKPOINT, device=device)
        efficientnet_model.eval()
        st.success("EfficientNet model loaded successfully!")

    elif model_type == "yolo":
        st.write(f"Loading YOLOv10 model from {YOLO_CHECKPOINT}...")
        if not os.path.exists(YOLO_CHECKPOINT):
            st.error(f"YOLOv10 model not found at {YOLO_CHECKPOINT}")
            st.info("Please train the YOLOv10 model first using: python app.py train yolo")
            st.stop()
        yolo_detector = YOLODetector(model_path=YOLO_CHECKPOINT, device=DEVICE)
        st.success("YOLOv10 model loaded successfully!")

    elif model_type == "hybrid":
        st.write("Loading Hybrid Detection System...")
        if not os.path.exists(EFFICIENTNET_CHECKPOINT):
            st.error(f"EfficientNet model not found at {EFFICIENTNET_CHECKPOINT}")
            st.info("Please train the EfficientNet model first.")
            st.stop()
        if not os.path.exists(YOLO_CHECKPOINT):
            st.error(f"YOLOv10 model not found at {YOLO_CHECKPOINT}")
            st.info("Please train the YOLOv10 model first.")
            st.stop()

        hybrid_detector = HybridFoodDetector(
            yolo_checkpoint=YOLO_CHECKPOINT,
            efficientnet_checkpoint=EFFICIENTNET_CHECKPOINT,
            labels_csv=LABELS_CSV_PATH,
            device=DEVICE,
            conf_threshold=VALIDATION["conf_threshold"],
            iou_threshold=VALIDATION["iou_threshold"]
        )
        st.success("Hybrid detection system loaded successfully!")

except Exception as e:
    st.error(f"Error loading models: {str(e)}")
    import traceback
    st.code(traceback.format_exc())
    st.stop()


# Create tabs for different input methods
st.subheader("📸 Select Image Input Method")
input_tab1, input_tab2, input_tab3 = st.tabs(["📁 Upload Image", "🔗 Image URL", "📷 Camera Capture"])

image = None
input_source = None

# Tab 1: Upload Image
with input_tab1:
    uploaded_file = st.file_uploader("Choose an image...", type=["jpg", "jpeg", "png"])
    if uploaded_file is not None:
        image = Image.open(uploaded_file).convert("RGB")
        input_source = "upload"

# Tab 2: Image URL
with input_tab2:
    image_url = st.text_input("Enter image URL:", placeholder="https://example.com/food-image.jpg")
    if image_url:
        try:
            with st.spinner("Fetching image from URL..."):
                response = requests.get(image_url, timeout=10)
                response.raise_for_status()
                image = Image.open(BytesIO(response.content)).convert("RGB")
                input_source = "url"
                st.success("Image loaded successfully!")
        except requests.exceptions.RequestException as e:
            st.error(f"Failed to fetch image from URL: {str(e)}")
        except Exception as e:
            st.error(f"Failed to load image: {str(e)}")

# Tab 3: Camera Capture
with input_tab3:
    camera_photo = st.camera_input("Take a picture")
    if camera_photo is not None:
        image = Image.open(camera_photo).convert("RGB")
        input_source = "camera"

if image is not None:

    # Create two columns for better layout (1:2 ratio for upload:result)
    col_upload, col_result = st.columns([1, 2])

    with col_upload:
        st.subheader("📤 Input Image")
        caption_map = {
            "upload": "Uploaded Image",
            "url": "Image from URL",
            "camera": "Camera Capture"
        }
        st.image(image, caption=caption_map.get(input_source, "Input Image"), use_container_width=True)

    # Save uploaded file to temp location for processing
    with tempfile.NamedTemporaryFile(delete=False, suffix='.jpg') as tmp_file:
        image.save(tmp_file.name)
        temp_image_path = tmp_file.name

    try:
        if model_type == "efficientnet":
            with col_result:
                st.subheader("🎯 Detection Results")
                st.write("Classifying with EfficientNet...")

                # Preprocess the image and make a prediction
                transform = get_val_transforms()
                preprocessed_image = transform(image).unsqueeze(0).to(device)

                with torch.no_grad():
                    outputs = efficientnet_model(preprocessed_image)
                    probabilities = torch.nn.functional.softmax(outputs, dim=1)
                    top_p, top_class = probabilities.topk(5, dim=1)

                _, predicted_idx = torch.max(outputs, 1)
                class_name = idx_to_class[predicted_idx.item()]
                confidence = probabilities[0][predicted_idx.item()].item()

                st.success(f"Prediction: **{class_name}** (Confidence: {confidence:.2%})")

                # Show top 5 predictions
                with st.expander("View Top 5 Predictions"):
                    for i in range(top_p.size(1)):
                        pred_class = idx_to_class[top_class.detach().cpu().numpy()[0][i]]
                        pred_conf = top_p.detach().cpu().numpy()[0][i]
                        st.write(f"{i+1}. {pred_class}: {pred_conf:.2%}")

                # Get nutrition info
                nutrition_info = labels_df[labels_df['class_name'] == class_name]
                if len(nutrition_info) > 0:
                    nutrition_info = nutrition_info.iloc[0]
                    st.subheader("Nutrition Information (per serving)")
                    col1, col2, col3, col4 = st.columns(4)
                    with col1:
                        st.metric("Calories", f"{nutrition_info[NUTRITION_DATA['calories']]}")
                    with col2:
                        st.metric("Protein", f"{nutrition_info[NUTRITION_DATA['protein']]} g")
                    with col3:
                        st.metric("Carbs", f"{nutrition_info[NUTRITION_DATA['carbs']]} g")
                    with col4:
                        st.metric("Fat", f"{nutrition_info[NUTRITION_DATA['fat']]} g")

        elif model_type == "yolo":
            with col_result:
                st.subheader("🎯 Detection Results")
                st.write("Detecting with YOLOv10...")

                # Run YOLO detection
                detections, yolo_result = yolo_detector.predict(
                    temp_image_path,
                    conf_threshold=VALIDATION["conf_threshold"],
                    iou_threshold=VALIDATION["iou_threshold"]
                )

                if len(detections) == 0:
                    st.warning("No food items detected in the image.")
                else:
                    st.success(f"Detected {len(detections)} food item(s)!")

                    # Get annotated image from YOLO
                    annotated_image = yolo_result.plot()
                    st.image(annotated_image, caption='Detection Results', use_container_width=True)

                    # Count servings per dish
                    dish_counts = {}
                    for det in detections:
                        class_name = det['class_name']
                        dish_counts[class_name] = dish_counts.get(class_name, 0) + 1

                    # Display detected items
                    st.subheader("Detected Items")
                    for class_name, count in dish_counts.items():
                        st.write(f"- **{class_name}**: {count} serving(s)")

                    # Calculate total nutrition
                    total_nutrition = {col: 0.0 for col in NUTRITION_DATA.values()}
                    for det in detections:
                        class_name = det['class_name']
                        dish_nutrition = labels_df[labels_df['class_name'] == class_name]
                        if len(dish_nutrition) > 0:
                            dish_nutrition = dish_nutrition.iloc[0]
                            for nutrient_key, col_name in NUTRITION_DATA.items():
                                if col_name in dish_nutrition:
                                    total_nutrition[col_name] += float(dish_nutrition[col_name])

                    # Display nutrition
                    st.subheader("Total Nutrition Information")
                    col1, col2, col3, col4 = st.columns(4)
                    with col1:
                        st.metric("Total Calories", f"{total_nutrition[NUTRITION_DATA['calories']]:.0f}")
                    with col2:
                        st.metric("Total Protein", f"{total_nutrition[NUTRITION_DATA['protein']]:.1f} g")
                    with col3:
                        st.metric("Total Carbs", f"{total_nutrition[NUTRITION_DATA['carbs']]:.1f} g")
                    with col4:
                        st.metric("Total Fat", f"{total_nutrition[NUTRITION_DATA['fat']]:.1f} g")

        elif model_type == "hybrid":
            with col_result:
                st.subheader("🎯 Detection Results")
                st.write("Running Hybrid Detection (YOLO + EfficientNet)...")

                # Run hybrid detection
                detections, annotated_image = hybrid_detector.detect_and_classify(
                    temp_image_path,
                    use_hybrid=True
                )

                if len(detections) == 0:
                    st.warning("No food items detected in the image.")
                else:
                    st.success(f"Detected {len(detections)} food item(s)!")

                    # Display annotated image
                    st.image(annotated_image, caption='Hybrid Detection Results', use_container_width=True)

                    # Show detection details
                    st.subheader("Detection Details")
                    refined_count = sum(1 for d in detections if d.get('refined_by_efficientnet', False))
                    st.info(f"{refined_count} out of {len(detections)} detections were refined by EfficientNet")

                    # Display each detection
                    with st.expander("View Detailed Detections"):
                        for i, det in enumerate(detections, 1):
                            refined_marker = " ✓ (Refined)" if det.get('refined_by_efficientnet', False) else ""
                            st.write(f"{i}. **{det['class_name']}** - Confidence: {det['confidence']:.2%}{refined_marker}")
                            if det.get('refined_by_efficientnet', False):
                                st.write(f"   - Original YOLO prediction: {det['yolo_class']}")

                    # Calculate nutrition
                    total_nutrition, dish_counts = hybrid_detector.calculate_nutrition(
                        detections,
                        NUTRITION_DATA
                    )

                    # Display detected items
                    st.subheader("Detected Items Summary")
                    for class_name, count in dish_counts.items():
                        st.write(f"- **{class_name}**: {count} serving(s)")

                    # Display nutrition
                    st.subheader("Total Nutrition Information")
                    col1, col2, col3, col4 = st.columns(4)
                    with col1:
                        st.metric("Total Calories", f"{total_nutrition[NUTRITION_DATA['calories']]:.0f}")
                    with col2:
                        st.metric("Total Protein", f"{total_nutrition[NUTRITION_DATA['protein']]:.1f} g")
                    with col3:
                        st.metric("Total Carbs", f"{total_nutrition[NUTRITION_DATA['carbs']]:.1f} g")
                    with col4:
                        st.metric("Total Fat", f"{total_nutrition[NUTRITION_DATA['fat']]:.1f} g")

    except Exception as e:
        st.error(f"Error during inference: {str(e)}")
        import traceback
        st.code(traceback.format_exc())
    finally:
        # Clean up temp file
        if os.path.exists(temp_image_path):
            os.unlink(temp_image_path)
