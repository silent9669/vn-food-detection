import streamlit as st
import torch
import torch.nn as nn
import pandas as pd
from sklearn.metrics import confusion_matrix, classification_report, accuracy_score
import os
import matplotlib.pyplot as plt
import numpy as np
import seaborn as sns
import argparse

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

def parse_args():
    parser = argparse.ArgumentParser(description="Streamlit Model Evaluation Dashboard")
    parser.add_argument("--model_type", type=str, default="efficientnet",
                        choices=["efficientnet", "yolo"],
                        help="Type of model to evaluate: efficientnet or yolo")
    return parser.parse_args()

args = parse_args()
model_type = args.model_type

st.title(f"{model_type.replace('_', ' ').title()} Model Evaluation")

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
st.write(f"Using device for evaluation: {device}")

# Configuration options
st.sidebar.header("Evaluation Settings")

if model_type == "efficientnet":
    data_directory = st.sidebar.text_input("Data Directory", value=CLASSIFICATION_DATA_DIR)
    csv_filepath = st.sidebar.text_input("Labels CSV File", value=LABELS_CSV_PATH)
    model_filepath = st.sidebar.text_input("Model Path", value=EFFICIENTNET_CHECKPOINT)
    batch_size_eval = st.sidebar.number_input("Batch Size for Evaluation", value=8, min_value=1)
elif model_type == "yolo":
    data_directory = st.sidebar.text_input("Data Directory", value=DETECTION_DATA_DIR)
    csv_filepath = st.sidebar.text_input("Labels CSV File", value=LABELS_CSV_PATH) # YOLO needs class names from here
    model_filepath = st.sidebar.text_input("Model Path", value=YOLO_CHECKPOINT)
    batch_size_eval = st.sidebar.number_input("Batch Size for Evaluation", value=4, min_value=1)


if st.sidebar.button("Run Evaluation"):
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
                return

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
