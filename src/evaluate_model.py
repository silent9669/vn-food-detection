import streamlit as st
import torch
import torch.nn as nn
import pandas as pd
from sklearn.metrics import confusion_matrix, classification_report, accuracy_score
import os
import sys
import matplotlib.pyplot as plt
import numpy as np
import seaborn as sns

# Add parent directory to path for imports to work in Streamlit Cloud
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from src.data_loader import get_data_loaders
from src.model import get_model
from src.utils import load_model
from src.yolo_model import YOLODetector
from src.settings import (
    DEVICE,
    CLASSIFICATION_DATA_DIR,
    DETECTION_DATA_DIR,
    LABELS_CSV_PATH,
    EFFICIENTNET_CHECKPOINT,
    YOLO_CHECKPOINT,
    EFFICIENTNET_MODEL_NAME,
    YOLO_MODEL_NAME
)

# Main title
st.title("Model Evaluation Dashboard")

# Model selection in the main UI
st.header("1. Select Model to Evaluate")
model_type = st.selectbox(
    "Choose the model you want to evaluate:",
    ["EfficientNet", "YOLOv10"],
    key="eval_model_selector"
)

# Convert display name to internal name
model_type = "efficientnet" if model_type == "EfficientNet" else "yolo"

st.info(f"Evaluating Model: **{model_type.upper()}**")
st.markdown("---")

def load_evaluation_model(model_type, num_classes, model_path, device):
    if model_type == "efficientnet":
        model = get_model(num_classes)
        model = load_model(model, model_path, device=device)
        model.to(device)
        model.eval()
        return model
    elif model_type == "yolo":
        # Placeholder for YOLOv10 model loading (e.g., from ultralytics)
        st.warning("YOLOv10 evaluation model loading is a placeholder.")
        # from ultralytics import YOLO
        # model = YOLO(model_path)
        # return model
        return None # Return None for now as actual loading is not implemented

@st.cache_data
def get_evaluation_data(model_type, data_dir, csv_file, batch_size):
    if model_type == "efficientnet":
        _, val_loader = get_data_loaders(data_dir, csv_file, batch_size=batch_size, shuffle=False)
        labels_df = pd.read_csv(csv_file)
        class_names = sorted(labels_df['class_name'].unique())
        return val_loader, class_names
    elif model_type == "yolo":
        st.warning("YOLOv10 evaluation data loading is a placeholder.")
        # This would typically involve loading a YOLO-formatted dataset
        return None, [] # Return empty for now


device = torch.device(DEVICE)

# Sidebar information
st.sidebar.header("ℹ️ System Information")
st.sidebar.write(f"**Device:** {DEVICE}")
st.sidebar.write(f"**Evaluation Mode:** {model_type.upper()}")

st.sidebar.markdown("---")
st.sidebar.header("📁 Model Checkpoints")
if model_type == "efficientnet":
    st.sidebar.write(f"**Model:** {EFFICIENTNET_MODEL_NAME}")
    st.sidebar.write(f"**Checkpoint:** `{EFFICIENTNET_CHECKPOINT}`")
    st.sidebar.write(f"**Data Dir:** `{CLASSIFICATION_DATA_DIR}`")
    if os.path.exists(EFFICIENTNET_CHECKPOINT):
        st.sidebar.success("✓ Model found")
    else:
        st.sidebar.error("✗ Model not found")
else:  # yolo
    st.sidebar.write(f"**Model:** {YOLO_MODEL_NAME}")
    st.sidebar.write(f"**Checkpoint:** `{YOLO_CHECKPOINT}`")
    st.sidebar.write(f"**Data Dir:** `{DETECTION_DATA_DIR}`")
    if os.path.exists(YOLO_CHECKPOINT):
        st.sidebar.success("✓ Model found")
    else:
        st.sidebar.error("✗ Model not found")

st.sidebar.markdown("---")
st.sidebar.header("💡 Tips")
st.sidebar.info(
    "- Switch models using the dropdown above\n"
    "- Evaluation runs on validation dataset\n"
    "- Results are saved to 'results/' folder\n"
    "- Check confusion matrix for insights"
)

# Configuration options in main UI
st.header("2. Configure Evaluation Settings")

if model_type == "efficientnet":
    col1, col2 = st.columns(2)
    with col1:
        data_directory = st.text_input("Data Directory", value=CLASSIFICATION_DATA_DIR, key="eff_eval_data_dir")
        model_filepath = st.text_input("Model Path", value=EFFICIENTNET_CHECKPOINT, key="eff_eval_model_path")
    with col2:
        csv_filepath = st.text_input("Labels CSV File", value=LABELS_CSV_PATH, key="eff_eval_csv")
        batch_size_eval = st.number_input("Batch Size for Evaluation", value=8, min_value=1, key="eff_eval_batch")
elif model_type == "yolo":
    col1, col2 = st.columns(2)
    with col1:
        data_directory = st.text_input("Data Directory", value=DETECTION_DATA_DIR, key="yolo_eval_data_dir")
        model_filepath = st.text_input("Model Path", value=YOLO_CHECKPOINT, key="yolo_eval_model_path")
    with col2:
        csv_filepath = st.text_input("Labels CSV File", value=LABELS_CSV_PATH, key="yolo_eval_csv")
        batch_size_eval = st.number_input("Batch Size for Evaluation", value=4, min_value=1, key="yolo_eval_batch")

st.markdown("---")
st.header("3. Run Evaluation")

if st.button("🚀 Start Evaluation", type="primary", use_container_width=True):
    if model_type == "efficientnet":
        if not os.path.exists(model_filepath):
            st.error(f"Model file not found at {model_filepath}. Please train an EfficientNet model first.")
        # The data_loader expects full path to labels.csv, so csv_filepath needs to be absolute or relative from project root
        elif not os.path.exists(csv_filepath):
            st.error(f"CSV file not found at {csv_filepath}. Please check the path.")
        else:
            st.write("Starting EfficientNet evaluation...")
            
            # get_evaluation_data takes data_dir and csv_file, data_dir is now CLASSIFICATION_DATA_DIR
            # get_data_loaders within get_evaluation_data uses data_dir and csv_file
            val_loader, class_names = get_evaluation_data(model_type, data_directory, csv_filepath, batch_size_eval)
            num_classes = len(class_names)

            model = load_evaluation_model(model_type, num_classes, model_filepath, device)

            if model is None:
                st.error("EfficientNet model could not be loaded for evaluation.")
                st.stop()

            all_labels = []
            all_predictions = []

            progress_bar = st.progress(0)
            total_batches = len(val_loader)

            with torch.no_grad():
                for i, data in enumerate(val_loader):
                    inputs, labels = data
                    inputs, labels = inputs.to(device), labels.to(device)

                    outputs = model(inputs)
                    _, predicted = torch.max(outputs, 1)

                    all_labels.extend(labels.cpu().numpy())
                    all_predictions.extend(predicted.cpu().numpy())
                    progress_bar.progress((i + 1) / total_batches)

            st.write("EfficientNet Evaluation finished!")

            # Calculate metrics
            accuracy = accuracy_score(all_labels, all_predictions)
            st.subheader(f"Overall Accuracy: {accuracy:.4f}")

            st.subheader("Classification Report:")
            report_dict = classification_report(all_labels, all_predictions, target_names=class_names, output_dict=True)
            report_df = pd.DataFrame(report_dict).transpose()
            st.dataframe(report_df)

            # Save classification report to file
            report_filepath = os.path.join(os.getcwd(), "results", f"{model_type}_classification_report.txt")
            with open(report_filepath, "w") as f:
                f.write(classification_report(all_labels, all_predictions, target_names=class_names))
            st.write(f"Classification report saved to {report_filepath}")

            st.subheader("Confusion Matrix:")
            cm = confusion_matrix(all_labels, all_predictions)
            
            fig, ax = plt.subplots(figsize=(12, 10))
            sns.heatmap(cm, annot=True, fmt='d', cmap='Blues', xticklabels=class_names, yticklabels=class_names, ax=ax)
            ax.set_title('Confusion Matrix')
            ax.set_ylabel('True label')
            ax.set_xlabel('Predicted label')
            st.pyplot(fig)

            # Save confusion matrix plot to file
            cm_filepath = os.path.join(os.getcwd(), "results", f"{model_type}_confusion_matrix.png")
            fig.savefig(cm_filepath)
            st.write(f"Confusion matrix plot saved to {cm_filepath}")

            st.success("EfficientNet Evaluation complete!")

    elif model_type == "yolo":
        if not os.path.exists(model_filepath):
            st.error(f"Model file not found at {model_filepath}. Please train a YOLOv10 model first.")
        else:
            # Check for dataset.yaml
            dataset_yaml = os.path.join(data_directory, 'dataset.yaml')
            if not os.path.exists(dataset_yaml):
                st.error(f"Dataset configuration not found at {dataset_yaml}")
                st.info("Please run: python app.py prepare-dataset yolo")
            else:
                st.write("Starting YOLOv10 evaluation...")

                try:
                    # Load YOLO model
                    yolo_detector = YOLODetector(model_path=model_filepath, device=DEVICE)
                    st.write(f"YOLOv10 Model loaded from: {model_filepath}")
                    st.write(f"Dataset config: {dataset_yaml}")

                    # Run evaluation
                    progress_placeholder = st.empty()
                    progress_placeholder.info("Running evaluation on validation set...")

                    metrics = yolo_detector.evaluate(dataset_yaml)

                    progress_placeholder.success("Evaluation complete!")

                    # Display metrics
                    st.subheader("YOLOv10 Evaluation Metrics")

                    col1, col2, col3 = st.columns(3)
                    with col1:
                        st.metric("mAP@0.5", f"{metrics['mAP50']:.4f}")
                    with col2:
                        st.metric("mAP@0.5:0.95", f"{metrics['mAP50-95']:.4f}")
                    with col3:
                        st.metric("Fitness", f"{metrics['fitness']:.4f}")

                    col4, col5 = st.columns(2)
                    with col4:
                        st.metric("Precision", f"{metrics['precision']:.4f}")
                    with col5:
                        st.metric("Recall", f"{metrics['recall']:.4f}")

                    # Create metrics dataframe
                    metrics_df = pd.DataFrame({
                        'Metric': ['mAP@0.5', 'mAP@0.5:0.95', 'Precision', 'Recall', 'Fitness'],
                        'Value': [
                            metrics['mAP50'],
                            metrics['mAP50-95'],
                            metrics['precision'],
                            metrics['recall'],
                            metrics['fitness']
                        ]
                    })

                    st.subheader("Detailed Metrics")
                    st.dataframe(metrics_df)

                    # Save metrics to file
                    os.makedirs("results", exist_ok=True)
                    metrics_filepath = os.path.join("results", f"{model_type}_evaluation_metrics.csv")
                    metrics_df.to_csv(metrics_filepath, index=False)
                    st.write(f"Metrics saved to {metrics_filepath}")

                    # Display visualization info
                    st.info("Check the 'runs/detect/' directory for detailed evaluation plots and confusion matrices generated by YOLOv10.")

                    st.success("YOLOv10 Evaluation complete!")

                except Exception as e:
                    st.error(f"Error during YOLOv10 evaluation: {str(e)}")
                    import traceback
                    st.code(traceback.format_exc())
