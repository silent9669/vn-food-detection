# AI Food Recognition: A Comprehensive Guide

This project develops an AI system for recognizing Vietnamese food dishes from images, designed for robust performance in real-world conditions. It features a user-friendly Command-Line Interface (CLI) and interactive Streamlit Graphical User Interfaces (GUIs) for efficient training, validation, and evaluation.

## Table of Contents

1.  [Project Overview](#1-project-overview)
2.  [Features](#2-features)
3.  [Workflow Diagram](#3-workflow-diagram)
4.  [Setup and Installation](#4-setup-and-installation)
5.  [Data Preparation](#5-data-preparation)
    *   [Directory Structure](#directory-structure)
    *   [`labels.csv` File](#labelscsv-file)
    *   [Data Augmentation for Robustness](#data-augmentation-for-robustness)
6.  [Codebase Structure & Core Components](#6-codebase-structure--core-components)
7.  [Training Your Model](#7-training-your-model)
    *   [Launching the Training Dashboard](#launching-the-training-dashboard)
    *   [Interpreting Training Metrics](#interpreting-training-metrics)
    *   [Hyperparameter Tuning](#hyperparameter-tuning)
8.  [Validating Model Performance](#8-validating-model-performance)
9.  [Evaluating Model on Dataset](#9-evaluating-model-on-dataset)
10. [Advanced Training Techniques](#10-advanced-training-techniques)
    *   [Advanced Data Augmentation](#advanced-data-augmentation)
    *   [Learning Rate Schedulers](#learning-rate-schedulers)
    *   [Early Stopping](#early-stopping)
    *   [Cross-Validation](#cross-validation)
    *   [Transfer Learning Strategies](#transfer-learning-strategies)
    *   [Logging with TensorBoardX](#logging-with-tensorboardx)
11. [Troubleshooting Common Issues](#11-troubleshooting-common-issues)
12. [Project Structure](#12-project-structure)
13. [Contact](#contact)

---

## 1. Project Overview

The AI Food Recognition project aims to accurately identify 31 diverse Vietnamese food dishes from images, even in challenging real-world scenarios. It leverages PyTorch for deep learning model development (specifically EfficientNet-B4 for image classification) and Streamlit for interactive user interfaces. The system provides tools for data loading, model training with advanced techniques, single-image validation, and comprehensive model evaluation.

## 2. Features

*   **Modular Design**: Clear separation of concerns for data handling, model definition, training, and evaluation.
*   **Interactive Streamlit GUIs**: User-friendly dashboards for:
    *   **Training**: Real-time monitoring of loss and accuracy, dynamic hyperparameter adjustment (epochs, batch size, learning rate, unfreeze blocks).
    *   **Single-Image Validation**: Upload an image to get instant dish predictions and associated nutritional information (calories, protein, carbs, fats).
    *   **Dataset Evaluation**: Generate classification reports, overall accuracy, and confusion matrices on a test dataset.
*   **Advanced Training**: Incorporates mixed precision training (AMP), learning rate scheduling (ReduceLROnPlateau), early stopping, and fine-tuning strategies.
*   **Comprehensive Data Handling**: Custom PyTorch `Dataset` and `DataLoader` with extensive data augmentation for robust model generalization.
*   **Pre-trained Model Utilization**: Uses EfficientNet-B4 for transfer learning, allowing efficient training with high accuracy.
*   **Production-Ready Output**: Saves trained model weights and evaluation reports for deployment and analysis.

## 3. Workflow Diagram

The project operates through a central `run.sh` script, providing a menu-driven interface to launch various Streamlit applications:

```
+----------------+       +-------------------+
|    User Input  | ----> |     run.sh        |
|                |       |   (Bash Script)   |
+----------------+       +-------------------+
        |                          |
        |      Select Option       |
        v                          v
+-----------------------------------------------------------------------------------------------------------------------+
|                                                      CLI Menu                                                           |
|-----------------------------------------------------------------------------------------------------------------------|
| 1. Train Model                                 2. Validate Model (Single Image)                 3. Evaluate Model (Dataset)   |
| (Launches src/train.py)                        (Launches src/validate.py)                       (Launches src/evaluate_model.py) |
+-----------------------------------------------------------------------------------------------------------------------+
        |                                                 |                                                  |
        |                                                 |                                                  |
        v                                                 v                                                  v
+-----------------------+              +--------------------------+                         +------------------------------+
| Streamlit Training    |              | Streamlit Validation     |                         | Streamlit Evaluation         |
| Dashboard             |              | Interface                |                         | Dashboard                    |
| - Monitor metrics     |              | - Upload image           |                         | - Overall Accuracy           |
| - Adjust hyperparameters|              | - Get prediction         |                         | - Classification Report      |
| - Save best model     |              | - View nutrition info    |                         | - Confusion Matrix           |
+-----------------------+              +--------------------------+                         +------------------------------+
```

## 4. Setup and Installation

To set up and run the project, follow these steps:

1.  **Clone the repository:**

    ```bash
    git clone <repository_url>
    cd food_detection
    ```

2.  **Create a virtual environment (highly recommended):**

    ```bash
    python -m venv venv
    source venv/bin/activate  # On Windows, use `venv\Scripts\activate`
    ```

3.  **Install dependencies:**

    ```bash
    pip install -r requirements.txt
    ```

4.  **Make the main script executable:**

    ```bash
    chmod +x run.sh
    ```

## 5. Data Preparation

High-quality and well-organized data are paramount for training an effective AI model. This section details how to prepare your dataset.

### Directory Structure

Organize your image data within the `data_master/` directory. Each subfolder within `data_master/` should represent a specific dish variation (class). This hierarchical structure helps the `data_loader` correctly map images to their respective labels.

```
project_root/
└── data_master/
    ├── Banh_beo/          # Images for 'Banh beo'
    │   ├── img_001.jpg
    │   └── img_002.jpg
    ├── Pho/               # Images for 'Pho'
    │   ├── img_003.jpg
    │   └── img_004.jpg
    └── labels.csv         # Central CSV file for all labels and nutrition
```

### `labels.csv` File

This CSV file, located at `data_master/labels.csv`, is the central source for mapping image paths to their class names and associated nutritional information. Ensure that the `image_path` column contains paths relative to the `data_master/` directory.

**Example `data_master/labels.csv` content:**

```csv
image_path,class_name,calories,protein,carbs,fats,portion_gram
Banh_beo/img_001.jpg,Banh_beo,180,8,30,7,150
Pho/img_003.jpg,Pho,400,28,55,12,400
```

*   `image_path`: The path to the image file, relative to the `data_master/` directory.
*   `class_name`: The specific dish name (e.g., `Banh_beo`). This will be the target label for your classification model.
*   `calories`, `protein`, `carbs`, `fats`, `portion_gram`: Nutritional information for the dish. This data is used during validation to provide comprehensive feedback.

### Data Augmentation for Robustness

To make your model more robust and generalize better to unseen data (e.g., images with different lighting, angles, or minor occlusions), it's crucial to apply data augmentation. The `src/data_loader.py` includes a variety of transformations for training data.

**Current Augmentations in `src/data_loader.py`:**
*   `transforms.Resize((224, 224))`
*   `transforms.RandomHorizontalFlip()`
*   `transforms.RandomRotation(degrees=(-30, 30))`
*   `transforms.ColorJitter(brightness=0.2, contrast=0.2, saturation=0.2, hue=0.1)`
*   `transforms.RandomPerspective(distortion_scale=0.3, p=0.5)`
*   `transforms.RandomAffine(degrees=0, translate=(0.1, 0.1), scale=(0.9, 1.1), shear=10)`
*   `transforms.ToTensor()`
*   `transforms.Normalize(mean=[0.485, 0.456, 0.406], std=[0.229, 0.224, 0.225])`

## 6. Codebase Structure & Core Components

The `src/` directory contains all the core Python logic:

*   `src/data_loader.py`: Handles data loading, preprocessing, and augmentation. It defines `FoodDataset` for custom data handling and `get_data_loaders` for creating training and validation data loaders with different transform pipelines. It also manages stratified splitting of the dataset.
*   `src/model.py`: Defines the neural network model. It loads a pre-trained EfficientNet_B4 model, freezes its feature extractor (optionally unfreezing specified blocks), and replaces the classifier head to match the number of food classes.
*   `src/train.py`: The Streamlit application for model training. It sets up the training loop, loss function, optimizer, learning rate scheduler (`ReduceLROnPlateau`), and early stopping. It provides an interactive dashboard to monitor training metrics and adjust hyperparameters. Mixed precision training (`torch.cuda.amp`) is utilized for efficiency.
*   `src/validate.py`: The Streamlit application for real-time model validation. Users can upload a single image to get immediate predictions and associated nutritional details based on the trained model.
*   `src/evaluate_model.py`: The Streamlit application for comprehensive model evaluation on a dataset. It calculates and displays overall accuracy, a detailed classification report, and a confusion matrix, saving these results to the `results/` directory.
*   `src/utils.py`: Contains utility functions, primarily `save_model` and `load_model` for managing model checkpoints.

## 7. Training Your Model

Once your data is prepared, you can begin training your model.

### Launching the Training Dashboard

1.  **Start the CLI:**

    ```bash
    ./run.sh
    ```

2.  **Select "Train Model":** Choose option `1` from the menu.

    ```
    ==================================
      Vietnamese Food Detection CLI   
    ==================================
    Please choose an option:
    1. Train Model
    2. Validate Model (Single Image)
    3. Evaluate Model (Dataset)
    4. Exit
    ==================================
    Enter your choice [1-4]: 1
    ```

    This will launch a Streamlit application in your web browser (usually at `http://localhost:8501`).

### Interpreting Training Metrics

The Streamlit dashboard will display real-time updates for:

*   **Loss**: Indicates how well the model is performing. A decreasing loss value generally means the model is learning.
*   **Accuracy**: Represents the percentage of correctly classified images. An increasing accuracy is desirable.

### Hyperparameter Tuning

On the sidebar of the Streamlit training dashboard, you can dynamically adjust `Learning Rate`, `Epochs`, `Batch Size`, and `Unfreeze Backbone Blocks`. Click "Start Training" to begin or restart training with the new settings.

*   **Learning Rate**: Controls the step size during model optimization.
*   **Epochs**: The number of times the entire dataset is passed through the network.
*   **Batch Size**: The number of samples processed before the model's parameters are updated.
*   **Unfreeze Backbone Blocks**: Determines how many of the EfficientNet backbone layers are unfrozen and fine-tuned, allowing for more specific feature learning.

## 8. Validating Model Performance

After training, it's essential to validate your model's performance on unseen data.

1.  **Launch Validation GUI:**

    ```bash
    ./run.sh
    ```

2.  **Select "Validate Model (Single Image)":** Choose option `2` from the menu.

    This will open a Streamlit application in your browser.

3.  **Upload Image and Get Prediction:** Use the file uploader to select an image. The application will display the uploaded image, the predicted dish name, its confidence, top 5 predictions, and associated nutritional information.

## 9. Evaluating Model on Dataset

For a comprehensive assessment of your model's performance on a full dataset, use the evaluation dashboard.

1.  **Launch Evaluation GUI:**

    ```bash
    ./run.sh
    ```

2.  **Select "Evaluate Model (Dataset)":** Choose option `3` from the menu.

    This will open a Streamlit application in your browser.

3.  **Run Evaluation:** The dashboard allows you to confirm data, CSV, and model paths, then initiate the evaluation. It will display:
    *   Overall Accuracy
    *   A detailed Classification Report (precision, recall, f1-score for each class)
    *   A Confusion Matrix plot

    The classification report and confusion matrix plot will also be saved to the `results/` directory.

## 10. Advanced Training Techniques

To achieve a highly accurate and robust model, consider implementing these advanced techniques:

### Advanced Data Augmentation

Beyond basic flips and rotations, explore:

*   **Random Erasing**: Randomly masks out a rectangular region, forcing the model to learn more robust features.
*   **Mixup/Cutmix**: Combines multiple images and their labels, acting as a strong regularization technique.
*   **Custom Augmentations**: Tailor augmentations to specific challenges in your dataset.

### Learning Rate Schedulers

Dynamically adjust the learning rate during training. `ReduceLROnPlateau` is already implemented. Other common schedulers include:

*   **CosineAnnealingLR**: Decays the learning rate following a cosine curve.
*   **OneCycleLR**: A powerful scheduler that cycles the learning rate and momentum.

### Early Stopping

Monitor a validation metric (e.g., validation loss or accuracy) and stop training when it no longer improves for a certain number of epochs. This prevents overfitting and saves computational resources. (Already implemented in `train.py`)

### Cross-Validation

For smaller datasets, use k-fold cross-validation to get a more reliable estimate of your model's performance and ensure it generalizes well across different subsets of your data.

### Transfer Learning Strategies

*   **Unfreeze More Layers**: Instead of just fine-tuning the classification head, gradually unfreeze more layers of the pre-trained EfficientNet model and train them with a smaller learning rate. (Configurable in `train.py` sidebar)
*   **Different Pre-trained Models**: Experiment with other state-of-the-art pre-trained models (e.g., ResNet, Vision Transformers) available in `torchvision.models`.

### Logging with TensorBoardX

Integrate `TensorBoardX` (or PyTorch Lightning's built-in loggers) to visualize training metrics, model graphs, and even image predictions over time. This provides a powerful way to debug and compare different training runs.

## 11. Troubleshooting Common Issues

*   **`ModuleNotFoundError`**: Ensure your virtual environment is activated and `PYTHONPATH` is correctly set (as handled by `run.sh`).
*   **`FileNotFoundError` (for images)**: Double-check that all image paths in `labels.csv` are correct and that the image files physically exist in the specified `data_master/` subdirectories.
*   **Low Accuracy/High Loss**:
    *   **Data Issues**: Verify data quality, correct labels, and sufficient data quantity.
    *   **Hyperparameters**: Experiment with learning rate, batch size, and number of epochs.
    *   **Model Complexity**: Consider if the model is too simple or too complex for your task.
    *   **Overfitting**: If training loss is low but validation accuracy is poor, the model might be overfitting. Implement more data augmentation, regularization (e.g., dropout), or early stopping.
*   **Streamlit Not Launching**: Check if Streamlit is installed (`pip install streamlit`) and if the port (default 8501) is not blocked or in use.

## 12. Project Structure

```
project_root/
│
├── data_master/               # Stores raw image data in class-specific subdirectories and labels.csv
│   ├── Banh_beo/
│   ├── Pho/
│   └── labels.csv             # Main labels and nutritional information for all images
│
├── models/                    # Stores trained model checkpoints (e.g., food_classifier.pth)
│
├── results/                   # Stores evaluation outputs like classification reports and confusion matrices
│
├── src/                       # Contains all source code for the application
│   ├── data_loader.py         # Handles data loading, preprocessing, and dataset creation
│   ├── evaluate_model.py      # Streamlit script for dataset-wide model evaluation
│   ├── model.py               # Defines the fine-tuned classification model architecture
│   ├── train.py               # Streamlit script for model training with an interactive dashboard
│   ├── utils.py               # Utility functions (e.g., model save/load)
│   └── validate.py            # Streamlit script for single-image upload and prediction
│
├── logs/                      # Placeholder for training logs (e.g., TensorBoard logs)
├── requirements.txt           # List of Python packages required for the project
├── run.sh                     # Main bash script providing the CLI menu to interact with Streamlit apps
└── README.md                  # Project documentation and instructions
```

## Contact
phuc.dangcs2007@hcmut.edu.vn
