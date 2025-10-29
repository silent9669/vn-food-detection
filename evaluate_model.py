import torch
import torch.nn as nn
import pandas as pd
from sklearn.metrics import confusion_matrix, classification_report, accuracy_score
from src.data_loader import get_data_loaders, get_transforms
from src.model import get_model
from src.utils import load_model
import os
import matplotlib.pyplot as plt
import numpy as np

def evaluate_model(data_dir, csv_file, model_path, batch_size=32):
    device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
    print(f"Using device for evaluation: {device}")

    # Load data
    # We need the full dataset to get the class names for the report
    labels_df = pd.read_csv(csv_file)
    num_classes = len(labels_df['class_name'].unique())
    class_names = sorted(labels_df['class_name'].unique())
    idx_to_class = {i: class_name for i, class_name in enumerate(class_names)}

    # Get data loaders, specifically the validation loader
    # We pass limit_data=0 to ensure the full dataset is considered for splitting
    # and then we only use the val_loader for evaluation.
    _, val_loader = get_data_loaders(data_dir, csv_file, batch_size=batch_size, shuffle=False, limit_data=0)

    # Load model
    model = get_model(num_classes)
    model = load_model(model, model_path)
    model.to(device)
    model.eval() # Set model to evaluation mode

    all_labels = []
    all_predictions = []

    print("Starting evaluation...")
    with torch.no_grad():
        for i, data in enumerate(val_loader):
            inputs, labels = data
            inputs, labels = inputs.to(device), labels.to(device)

            outputs = model(inputs)
            _, predicted = torch.max(outputs, 1)

            all_labels.extend(labels.cpu().numpy())
            all_predictions.extend(predicted.cpu().numpy())

    # Calculate metrics
    accuracy = accuracy_score(all_labels, all_predictions)
    print(f"\nOverall Accuracy: {accuracy:.4f}")

    print("\nClassification Report:")
    print(classification_report(all_labels, all_predictions, target_names=class_names))

    cm = confusion_matrix(all_labels, all_predictions)
    print("\nConfusion Matrix:")
    print(cm)

    # Optional: Visualize Confusion Matrix
    fig, ax = plt.subplots(figsize=(10, 10))
    im = ax.imshow(cm, interpolation='nearest', cmap=plt.cm.Blues)
    ax.figure.colorbar(im, ax=ax)
    ax.set(xticks=np.arange(cm.shape[1]),
           yticks=np.arange(cm.shape[0]),
           xticklabels=class_names, yticklabels=class_names,
           title='Confusion Matrix',
           ylabel='True label',
           xlabel='Predicted label')

    plt.setp(ax.get_xticklabels(), rotation=45, ha="right",
             rotation_mode="anchor")

    fmt = 'd'
    thresh = cm.max() / 2.
    for i in range(cm.shape[0]):
        for j in range(cm.shape[1]):
            ax.text(j, i, format(cm[i, j], fmt),
                    ha="center", va="center",
                    color="white" if cm[i, j] > thresh else "black")
    fig.tight_layout()
    plt.savefig("confusion_matrix.png")
    print("Confusion matrix saved to confusion_matrix.png")

if __name__ == "__main__":
    data_directory = "/home/dangphuc/Documents/Project/moimoimoi/data_master"
    csv_filepath = "/home/dangphuc/Documents/Project/moimoimoi/data_master/labels.csv"
    model_filepath = "/home/dangphuc/Documents/Project/moimoimoi/models/food_classifier.pth"
    
    # Use the batch size from settings, or a default if settings not available
    try:
        from src.settings import get_settings
        settings = get_settings()
        batch_size_eval = settings["batch_size"]
    except ImportError:
        batch_size_eval = 32 # Default if settings can't be loaded

    evaluate_model(data_directory, csv_filepath, model_filepath, batch_size=batch_size_eval)
