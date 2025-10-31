import os
import sys
import streamlit as st
import pandas as pd
import torch
import torch.nn as nn
import torch.optim as optim
from torch.cuda.amp import GradScaler, autocast
from torch.optim.lr_scheduler import ReduceLROnPlateau
import argparse

# Add parent directory to path for imports to work in Streamlit Cloud
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from src.data_loader import get_data_loaders
from src.model import get_model
from src.utils import save_model
from src.settings import (
    DEVICE,
    NUM_WORKERS,
    PIN_MEMORY,
    CLASSIFICATION_DATA_DIR,
    LABELS_CSV_PATH,
    EFFICIENTNET_MODEL_NAME,
    EFFICIENTNET_CHECKPOINT,
    EFFICIENTNET_TRAIN,
    YOLO_MODEL_NAME,
    YOLO_CHECKPOINT,
    YOLO_TRAIN,
    DETECTION_DATA_DIR
)

def parse_args():
    parser = argparse.ArgumentParser(description="Streamlit Training Dashboard")
    parser.add_argument("--model_type", type=str, default="efficientnet",
                        choices=["efficientnet", "yolo"],
                        help="Type of model to train: efficientnet or yolo")
    return parser.parse_args()

args = parse_args()
model_type = args.model_type

st.title(f"Train {model_type.replace('_', ' ').title()} Model")
print(f"Streamlit app started for {model_type} training.")

# Sidebar for settings
st.sidebar.header(f"{model_type.replace('_', ' ').title()} Training Settings")

if model_type == "efficientnet":
    config = EFFICIENTNET_TRAIN
    learning_rate_classifier = st.sidebar.number_input("Learning Rate (Classifier)", value=config["learning_rate_classifier"], format="%.6f")
    learning_rate_backbone = st.sidebar.number_input("Learning Rate (Backbone)", value=config["learning_rate_backbone"], format="%.6f")
    epochs = st.sidebar.number_input("Epochs", value=config["epochs"])
    batch_size = st.sidebar.number_input("Batch Size", value=config["batch_size"])
    unfreeze_blocks = st.sidebar.number_input("Unfreeze Backbone Blocks (0 for classifier only)", value=config["unfreeze_blocks"])
    patience = st.sidebar.number_input("Early Stopping Patience", value=config["patience"])
    limit_data = st.sidebar.number_input("Limit Data (for debugging, 0 for full dataset)", value=0)

    if st.sidebar.button("Start Training"):
        st.write("Starting EfficientNet training...")
        print("Starting EfficientNet training process...")

        device = torch.device(DEVICE)
        st.write(f"Using device: {device}")
        print(f"Using device: {device}")

        scaler = GradScaler()

        # Load data
        print("Loading data...")
        train_loader, val_loader = get_data_loaders(CLASSIFICATION_DATA_DIR, LABELS_CSV_PATH, batch_size=batch_size, num_workers=NUM_WORKERS, pin_memory=PIN_MEMORY, limit_data=limit_data if limit_data > 0 else None)
        print("Data loaded. Number of training batches:", len(train_loader), "Number of validation batches:", len(val_loader))

        # Get number of classes from the data_loader's dataset
        # train_loader.dataset is a Subset, so we need to access the underlying dataset
        if hasattr(train_loader.dataset, 'dataset'):
            # It's a Subset, access the underlying dataset
            num_classes = len(train_loader.dataset.dataset.classes)
        else:
            # It's the original dataset
            num_classes = len(train_loader.dataset.classes)
        st.write(f"Number of classes: {num_classes}")
        print(f"Number of classes: {num_classes}")

        # Create model, loss function, and optimizer
        print("Creating model...")
        model = get_model(num_classes, unfreeze_blocks=unfreeze_blocks)
        model.to(device)
        
        if os.path.exists(EFFICIENTNET_CHECKPOINT):
            model.load_state_dict(torch.load(EFFICIENTNET_CHECKPOINT, map_location=device))
            st.write("Resuming training from previously saved EfficientNet model.")
            print("Resuming training from previously saved EfficientNet model.")
        
        print("Model created.")
        criterion = nn.CrossEntropyLoss()

        # Define parameter groups for differential learning rates
        optimizer_params = [
            {'params': model.classifier.parameters(), 'lr': learning_rate_classifier}
        ]
        if unfreeze_blocks > 0:
            # Only add feature parameters if they are unfrozen (requires_grad=True)
            optimizer_params.append({'params': model.features.parameters(), 'lr': learning_rate_backbone})

        optimizer = optim.Adam(optimizer_params)
        scheduler = ReduceLROnPlateau(optimizer, mode='min', factor=0.1, patience=config["patience"])

        # Training loop placeholder
        progress_bar = st.progress(0)
        train_loss_chart = st.line_chart()
        val_loss_chart = st.line_chart()
        train_accuracy_chart = st.line_chart()
        val_accuracy_chart = st.line_chart()

        best_val_loss = float('inf')
        epochs_no_improve = 0

        for epoch in range(epochs):
            # Training
            model.train()
            running_loss = 0.0
            correct_train_predictions = 0
            total_train_predictions = 0
            for i, data in enumerate(train_loader, 0):
                inputs, labels = data
                inputs, labels = inputs.to(device), labels.to(device)

                optimizer.zero_grad()
                with autocast():
                    outputs = model(inputs)
                    loss = criterion(outputs, labels)

                scaler.scale(loss).backward()
                scaler.step(optimizer)
                scaler.update()

                running_loss += loss.item()

                _, predicted = torch.max(outputs.data, 1)
                total_train_predictions += labels.size(0)
                correct_train_predictions += (predicted == labels).sum().item()

            epoch_train_loss = running_loss / len(train_loader)
            epoch_train_accuracy = 100 * correct_train_predictions / total_train_predictions

            # Validation
            model.eval()
            val_running_loss = 0.0
            correct_val_predictions = 0
            total_val_predictions = 0
            with torch.no_grad():
                for i, data in enumerate(val_loader, 0):
                    inputs, labels = data
                    inputs, labels = inputs.to(device), labels.to(device)
                    with autocast():
                        outputs = model(inputs)
                        loss = criterion(outputs, labels)
                    val_running_loss += loss.item()

                    _, predicted = torch.max(outputs.data, 1)
                    total_val_predictions += labels.size(0)
                    correct_val_predictions += (predicted == labels).sum().item()

            epoch_val_loss = val_running_loss / len(val_loader)
            epoch_val_accuracy = 100 * correct_val_predictions / total_val_predictions

            scheduler.step(epoch_val_loss)

            st.write(f"Epoch {epoch + 1}, Train Loss: {epoch_train_loss:.4f}, Train Accuracy: {epoch_train_accuracy:.2f}%, Val Loss: {epoch_val_loss:.4f}, Val Accuracy: {epoch_val_accuracy:.2f}%")
            
            train_loss_chart.add_rows([epoch_train_loss])
            val_loss_chart.add_rows([epoch_val_loss])
            train_accuracy_chart.add_rows([epoch_train_accuracy])
            val_accuracy_chart.add_rows([epoch_val_accuracy])
            progress_bar.progress((epoch + 1) / epochs)

            # Early stopping
            if epoch_val_loss < best_val_loss:
                best_val_loss = epoch_val_loss
                epochs_no_improve = 0
                save_model(model, EFFICIENTNET_CHECKPOINT) # Save best model
                st.write(f"Model saved to {EFFICIENTNET_CHECKPOINT}")
            else:
                epochs_no_improve += 1
                if epochs_no_improve == patience:
                    st.write(f"Early stopping triggered after {epoch + 1} epochs due to no improvement in validation loss.")
                    break

        st.write("EfficientNet training finished!")

elif model_type == "yolo":
    from src.yolo_model import YOLODetector, create_yolo_data_yaml

    config = YOLO_TRAIN

    learning_rate = st.sidebar.number_input("Learning Rate", value=config["learning_rate"], format="%.6f")
    epochs = st.sidebar.number_input("Epochs", value=config["epochs"], min_value=1)
    batch_size = st.sidebar.number_input("Batch Size", value=config["batch_size"], min_value=1)
    img_size = st.sidebar.number_input("Image Size", value=config["img_size"], min_value=320)
    patience = st.sidebar.number_input("Early Stopping Patience", value=config["patience"], min_value=1)
    workers = st.sidebar.number_input("Data Loading Workers", value=NUM_WORKERS, min_value=0)

    if st.sidebar.button("Start YOLOv10 Training"):
        st.write("Starting YOLOv10 training...")
        print("Starting YOLOv10 training process...")

        try:
            # Load class names from labels CSV
            labels_df = pd.read_csv(LABELS_CSV_PATH)
            class_names = sorted(labels_df['class_name'].unique().tolist())
            num_classes = len(class_names)

            # Check if detection dataset exists, auto-create if not
            dataset_yaml = os.path.join(DETECTION_DATA_DIR, 'dataset.yaml')

            if not os.path.exists(dataset_yaml):
                st.warning(f"Dataset configuration not found at {dataset_yaml}")
                st.info("Auto-generating dataset.yaml from your annotations...")
                from src.prepare_yolo_dataset import create_yolo_yaml
                create_yolo_yaml(DETECTION_DATA_DIR, class_names)
                st.success("✓ dataset.yaml created successfully!")

            st.write(f"Number of classes: {num_classes}")
            st.write(f"Classes: {', '.join(class_names[:5])}{'...' if len(class_names) > 5 else ''}")
            print(f"Training YOLO with {num_classes} classes")

            # Initialize YOLO detector
            yolo_detector = YOLODetector(
                model_name=YOLO_MODEL_NAME,
                device=DEVICE
            )

            st.write(f"Using device: {DEVICE}")
            st.write(f"Model: {YOLO_MODEL_NAME}")

            # Display training progress
            progress_placeholder = st.empty()
            metrics_placeholder = st.empty()

            # Start training
            progress_placeholder.info(f"Training in progress... This may take a while ({epochs} epochs)")

            results = yolo_detector.train(
                data_yaml=dataset_yaml,
                epochs=epochs,
                batch_size=batch_size,
                img_size=img_size,
                learning_rate=learning_rate,
                patience=patience,
                workers=workers,
                project='models',
                name='yolov10_detector'
            )

            progress_placeholder.success("Training complete!")

            # Display training metrics
            st.subheader("Training Results")

            # Check if best weights exist and copy to checkpoint location
            best_weights = 'models/yolov10_detector/weights/best.pt'
            if os.path.exists(best_weights):
                import shutil
                os.makedirs(os.path.dirname(YOLO_CHECKPOINT), exist_ok=True)
                shutil.copy(best_weights, YOLO_CHECKPOINT)
                st.success(f"Best model saved to {YOLO_CHECKPOINT}")
                print(f"Best model saved to {YOLO_CHECKPOINT}")

            # Display final metrics
            metrics_placeholder.write("Training completed successfully!")
            st.write("Check the 'models/yolov10_detector' directory for detailed results and plots.")

        except Exception as e:
            st.error(f"Error during YOLOv10 training: {str(e)}")
            print(f"Error during YOLOv10 training: {str(e)}")
            import traceback
            st.code(traceback.format_exc())

        st.write("YOLOv10 training finished!") 
