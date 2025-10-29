import streamlit as st
import torch
import torch.nn as nn
import pandas as pd
from sklearn.metrics import confusion_matrix, classification_report, accuracy_score
from src.data_loader import get_data_loaders
from src.model import get_model
from src.utils import load_model
import os
import matplotlib.pyplot as plt
import numpy as np
import seaborn as sns

st.title("Model Evaluation")

@st.cache_resource
def load_evaluation_model(num_classes, model_path, device):
    model = get_model(num_classes)
    model = load_model(model, model_path)
    model.to(device)
    model.eval()
    return model

@st.cache_data
def get_evaluation_data(data_dir, csv_file, batch_size):
    _, val_loader = get_data_loaders(data_dir, csv_file, batch_size=batch_size, shuffle=False, limit_data=0)
    labels_df = pd.read_csv(csv_file)
    class_names = sorted(labels_df['class_name'].unique())
    return val_loader, class_names


device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
st.write(f"Using device for evaluation: {device}")

# Configuration options
st.sidebar.header("Evaluation Settings")
data_directory = st.sidebar.text_input("Data Directory", value=os.path.join(os.getcwd(), "data_master"))
csv_filepath = st.sidebar.text_input("Labels CSV File", value=os.path.join(os.getcwd(), "data_master", "labels.csv"))
model_filepath = st.sidebar.text_input("Model Path", value="models/food_classifier.pth")
batch_size_eval = st.sidebar.number_input("Batch Size for Evaluation", value=8, min_value=1)

if st.sidebar.button("Run Evaluation"):
    if not os.path.exists(model_filepath):
        st.error(f"Model file not found at {model_filepath}. Please train a model first.")
    elif not os.path.exists(os.path.join(data_directory, csv_filepath)):
        st.error(f"CSV file not found at {os.path.join(data_directory, csv_filepath)}. Please check the path.")
    else:
        st.write("Starting evaluation...")
        
        val_loader, class_names = get_evaluation_data(data_directory, csv_filepath, batch_size_eval)
        num_classes = len(class_names)

        model = load_evaluation_model(num_classes, model_filepath, device)

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

        st.write("Evaluation finished!")

        # Calculate metrics
        accuracy = accuracy_score(all_labels, all_predictions)
        st.subheader(f"Overall Accuracy: {accuracy:.4f}")

        st.subheader("Classification Report:")
        report_dict = classification_report(all_labels, all_predictions, target_names=class_names, output_dict=True)
        report_df = pd.DataFrame(report_dict).transpose()
        st.dataframe(report_df)

        # Save classification report to file
        report_filepath = os.path.join(os.getcwd(), "results", "classification_report.txt")
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
        cm_filepath = os.path.join(os.getcwd(), "results", "confusion_matrix.png")
        fig.savefig(cm_filepath)
        st.write(f"Confusion matrix plot saved to {cm_filepath}")

        st.success("Evaluation complete!")
