import os
import streamlit as st
import pandas as pd
import torch
import torch.nn as nn
import torch.optim as optim
from torch.cuda.amp import GradScaler, autocast
from torch.optim.lr_scheduler import ReduceLROnPlateau
from src.data_loader import get_data_loaders
from src.model import get_model
from src.utils import save_model

st.title("Train AI Model")
print("Streamlit app started.")

# Sidebar for settings
st.sidebar.header("Training Settings")
learning_rate = st.sidebar.number_input("Learning Rate", value=0.001, format="%.4f")
epochs = st.sidebar.number_input("Epochs", value=20)
batch_size = st.sidebar.number_input("Batch Size", value=8)
unfreeze_blocks = st.sidebar.number_input("Unfreeze Backbone Blocks (0 for classifier only)", value=0)
limit_data = st.sidebar.number_input("Limit Data (for debugging, 0 for full dataset)", value=0)

if st.sidebar.button("Start Training"):
    st.write("Starting training...")
    print("Starting training process...")

    device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
    st.write(f"Using device: {device}")
    print(f"Using device: {device}")

    scaler = GradScaler()

    # Load data
    print("Loading data...")
    train_loader, val_loader = get_data_loaders("data_master", "data_master/labels.csv", batch_size=batch_size, limit_data=limit_data if limit_data > 0 else None)
    print("Data loaded. Number of training batches:", len(train_loader), "Number of validation batches:", len(val_loader))
    num_classes = len(pd.read_csv("data_master/labels.csv")['class_name'].unique())
    print(f"Number of classes: {num_classes}")

    # Create model, loss function, and optimizer
    print("Creating model...")
    model = get_model(num_classes, unfreeze_blocks=unfreeze_blocks) # Pass unfreeze_blocks
    model.to(device)
    model_path = "models/food_classifier.pth"
    if os.path.exists(model_path):
        model.load_state_dict(torch.load(model_path))
        st.write("Resuming training from previously saved model.")
        print("Resuming training from previously saved model.")
    print("Model created.")
    criterion = nn.CrossEntropyLoss()

    # Define parameter groups for differential learning rates
    optimizer_params = [
        {'params': model.classifier.parameters(), 'lr': learning_rate}
    ]
    if unfreeze_blocks > 0:
        # Only add feature parameters if they are unfrozen (requires_grad=True)
        # Use a much smaller learning rate for backbone layers
        backbone_lr = learning_rate / 100.0 # Example: 1/100th of classifier LR
        optimizer_params.append({'params': model.features.parameters(), 'lr': backbone_lr})

    optimizer = optim.Adam(optimizer_params)
    scheduler = ReduceLROnPlateau(optimizer, mode='min', factor=0.1, patience=5)

    # Training loop placeholder
    progress_bar = st.progress(0)
    train_loss_chart = st.line_chart()
    val_loss_chart = st.line_chart()
    train_accuracy_chart = st.line_chart()
    val_accuracy_chart = st.line_chart()

    best_val_loss = float('inf')
    patience = 10 # Number of epochs to wait for improvement
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

        scheduler.step(epoch_val_loss) # Step the learning rate scheduler

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
            save_model(model, "models/food_classifier.pth") # Save best model
            st.write("Model saved to models/food_classifier.pth")
        else:
            epochs_no_improve += 1
            if epochs_no_improve == patience:
                st.write(f"Early stopping triggered after {epoch + 1} epochs due to no improvement in validation loss.")
                break

    st.write("Training finished!")
