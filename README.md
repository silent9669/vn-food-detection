# AI Food Recognition: A Comprehensive Guide to Training Robust Models

This project provides a complete AI system for recognizing various Vietnamese food dishes from images. It's designed with a user-friendly Command-Line Interface (CLI) and interactive Streamlit Graphical User Interfaces (GUIs) for efficient training, validation, and hyperparameter management.

## Table of Contents

1.  [Project Overview](#1-project-overview)
2.  [Features](#2-features)
3.  [Setup and Installation](#3-setup-and-installation)
4.  [Data Preparation: The Foundation of a Strong Model](#4-data-preparation-the-foundation-of-a-strong-model)
    *   [Directory Structure](#directory-structure)
    *   [`labels.csv` File](#labelscsv-file)
    *   [Data Augmentation for Robustness](#data-augmentation-for-robustness)
5.  [Understanding the Codebase](#5-understanding-the-codebase)
6.  [Training Your First Model: Basic Steps](#6-training-your-first-model-basic-steps)
    *   [Launching the Training Dashboard](#launching-the-training-dashboard)
    *   [Interpreting Training Metrics](#interpreting-training-metrics)
7.  [Hyperparameter Tuning: Optimizing Your Model](#7-hyperparameter-tuning-optimizing-your-model)
    *   [Adjusting Settings via CLI](#adjusting-settings-via-cli)
    *   [Impact of Hyperparameters](#impact-of-hyperparameters)
8.  [Validating Model Performance](#8-validating-model-performance)
9.  [Advanced Training Techniques (Towards a Perfect Model)](#9-advanced-training-techniques-towards-a-perfect-model)
    *   [Advanced Data Augmentation](#advanced-data-augmentation)
    *   [Learning Rate Schedulers](#learning-rate-schedulers)
    *   [Early Stopping](#early-stopping)
    *   [Cross-Validation](#cross-validation)
    *   [Transfer Learning Strategies](#transfer-learning-strategies)
    *   [Logging with TensorBoardX](#logging-with-tensorboardx)
10. [Troubleshooting Common Issues](#10-troubleshooting-common-issues)
11. [Project Structure](#11-project-structure)

---

## 1. Project Overview

The primary objective of this project is to develop an AI system capable of accurately identifying diverse variations of Vietnamese dishes (e.g., "phở bò tái", "phở bò nạm", "phở bò gân") from images. The system is designed to be resilient to real-world conditions, such as noisy backgrounds or the presence of extraneous objects in the images. By integrating a fine-tuned classification model with intuitive CLI and Streamlit GUIs, researchers can efficiently manage and iterate on the AI development pipeline.

## 2. Features

*   **General CLI (`run.sh` & `src/app.py`):** A central command-line interface to seamlessly switch between training, validation, and settings modes.
*   **Interactive GUI Training (Streamlit):** A real-time dashboard for monitoring training progress (loss, accuracy), and dynamically adjusting key hyperparameters like epochs, batch size, and learning rate.
*   **Interactive GUI Validation (Streamlit):** An intuitive interface allowing users to upload images, receive instant dish predictions, and view associated nutritional information (calories, protein, carbs, fats).
*   **Configurable Settings:** Easily modify training hyperparameters either through a simple CLI prompt or directly within the Streamlit training GUI.
*   **Modular and Extensible Design:** The codebase is structured with clear separation of concerns for data loading, model definition, training logic, and utility functions, promoting maintainability and future enhancements.

## 3. Setup and Installation

To set up and run the project, follow these steps:

1.  **Clone the repository:**

    ```bash
    git clone <repository_url>
    cd moimoimoi
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

## 4. Data Preparation: The Foundation of a Strong Model

High-quality and well-organized data are paramount for training an effective AI model. This section details how to prepare your dataset.

### Directory Structure

Organize your image data within the `data_master/` directory. Each subfolder within `data_master/` should represent a specific dish variation (class). This hierarchical structure helps the `data_loader` correctly map images to their respective labels.

```
project_root/
└── data_master/
    ├── pho_bo/
    │   ├── pho_bo_tai/      # Images for 'phở bò tái'
    │   │   ├── img_001.jpg
    │   │   └── img_002.jpg
    │   ├── pho_bo_nam/      # Images for 'phở bò nạm'
    │   │   ├── img_003.jpg
    │   │   └── img_004.jpg
    │   └── pho_bo_gan/      # Images for 'phở bò gân'
    │       ├── img_005.jpg
    │       └── img_006.jpg
    ├── com_tam/
    │   ├── com_tam_suon/    # Images for 'cơm tấm sườn'
    │   │   ├── img_007.jpg
    │   │   └── img_008.jpg
    │   └── com_tam_bi/      # Images for 'cơm tấm bì'
    │       ├── img_009.jpg
    │       └── img_010.jpg
    └── labels.csv           # Central CSV file for all labels and nutrition
```

### `labels.csv` File

This CSV file, located at `data_master/labels.csv`, is the central source for mapping image paths to their class names and associated nutritional information. Ensure that the `image_path` column contains paths relative to the `data_master/` directory.

**Example `data_master/labels.csv` content:**

```csv
image_path,class_name,calories,protein,carbs,fats,portion_gram
pho_bo/pho_bo_tai/img_001.jpg,pho_bo_tai,350,25,50,10,350
pho_bo/pho_bo_nam/img_003.jpg,pho_bo_nam,400,28,55,12,400
pho_bo/pho_bo_gan/img_005.jpg,pho_bo_gan,380,27,52,11,370
com_tam/com_tam_suon/img_007.jpg,com_tam_suon,600,35,70,20,500
com_tam/com_tam_bi/img_009.jpg,com_tam_bi,550,32,65,18,480
```

*   `image_path`: The path to the image file, relative to the `data_master/` directory.
*   `class_name`: The specific variation of the dish (e.g., `pho_bo_tai`). This will be the target label for your classification model.
*   `calories`, `protein`, `carbs`, `fats`, `portion_gram`: Nutritional information for the dish. This data is used during validation to provide comprehensive feedback.

### Data Augmentation for Robustness

To make your model more robust and generalize better to unseen data (e.g., images with different lighting, angles, or minor occlusions), it's crucial to apply data augmentation. The `src/data_loader.py` currently includes basic transformations (`Resize`, `ToTensor`, `Normalize`).

**To enhance data augmentation:**

*   **Explore `torchvision.transforms`:** Add transformations like `RandomResizedCrop`, `RandomHorizontalFlip`, `ColorJitter`, `RandomRotation`, etc.
*   **Consider `Albumentations`:** For more advanced and diverse augmentation techniques, especially for image segmentation tasks (if you expand the project), `Albumentations` is a powerful library.

## 5. Understanding the Codebase

*   `run.sh`: The main bash script that provides a menu-driven CLI for the application.
*   `src/app.py`: The Python entry point for the CLI, which dispatches commands to the Streamlit applications or handles settings adjustments.
*   `src/data_loader.py`: Centralizes all data loading and preprocessing logic. It reads `labels.csv`, creates a PyTorch `Dataset`, and applies image transformations.
*   `src/model.py`: Defines the neural network architecture. It uses a pre-trained EfficientNet-B4 model and fine-tunes its classification head for your specific number of food classes.
*   `src/train.py`: The Streamlit application for training the model. It provides a real-time dashboard to monitor training progress and adjust hyperparameters.
*   `src/validate.py`: The Streamlit application for validating the trained model. Users can upload images to get predictions and nutritional information.
*   `src/settings.py`: Manages default and user-adjustable hyperparameters for training.
*   `src/utils.py`: Contains helper functions, such as saving and loading model checkpoints.

## 6. Training Your First Model: Basic Steps

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
    2. Validate Model
    3. Adjust Settings
    4. Exit
    ==================================
    Enter your choice [1-4]: 1
    ```

    This will launch a Streamlit application in your web browser (usually at `http://localhost:8501`).

### Interpreting Training Metrics

The Streamlit dashboard will display real-time updates:

*   **Loss:** Indicates how well the model is performing. A decreasing loss value generally means the model is learning.
*   **Accuracy:** Represents the percentage of correctly classified images. An increasing accuracy is desirable.

On the sidebar, you can adjust `Learning Rate`, `Epochs`, and `Batch Size`. Click "Start Training" to begin.

## 7. Hyperparameter Tuning: Optimizing Your Model

Hyperparameters significantly influence your model's performance. Experimenting with them is a crucial part of the training process.

### Adjusting Settings via CLI

1.  **Access Settings:**

    ```bash
    ./run.sh
    ```

2.  **Select "Adjust Settings":** Choose option `3` from the menu.

    ```
    ==================================
      Vietnamese Food Detection CLI   
    ==================================
    Please choose an option:
    1. Train Model
    2. Validate Model
    3. Adjust Settings
    4. Exit
    ==================================
    Enter your choice [1-4]: 3
    ```

3.  **Input New Values:** The CLI will prompt you to enter new values for `Learning Rate`, `Epochs`, and `Batch Size`. Press Enter to keep the default values.

    ```
    Learning rate (default 0.001): 0.0005
    Epochs (default 20): 30
    Batch size (default 16): 
    Settings saved: {'learning_rate': 0.0005, 'epochs': 30, 'batch_size': 16}
    ```

    These updated settings will be used in subsequent training sessions.

### Impact of Hyperparameters

*   **Learning Rate:** Controls the step size during model optimization. A high learning rate can lead to instability, while a very low one can make training slow.
*   **Epochs:** The number of times the entire dataset is passed forward and backward through the neural network. More epochs can lead to better learning but also to overfitting.
*   **Batch Size:** The number of samples processed before the model's internal parameters are updated. Larger batch sizes can provide a more stable gradient but require more memory.

## 8. Validating Model Performance

After training, it's essential to validate your model's performance on unseen data.

1.  **Launch Validation GUI:**

    ```bash
    ./run.sh
    ```

2.  **Select "Validate Model":** Choose option `2` from the menu.

    ```
    ==================================
      Vietnamese Food Detection CLI   
    ==================================
    Please choose an option:
    1. Train Model
    2. Validate Model
    3. Adjust Settings
    4. Exit
    ==================================
    Enter your choice [1-4]: 2
    ```

    This will open a Streamlit application in your browser.

3.  **Upload Image and Get Prediction:** Use the file uploader to select an image. The application will display the uploaded image, the predicted dish name, and its associated nutritional information.

## 9. Advanced Training Techniques (Towards a Perfect Model)

To achieve a highly accurate and robust model, consider implementing these advanced techniques:

### Advanced Data Augmentation

Beyond basic flips and rotations, explore:

*   **Random Erasing:** Randomly masks out a rectangular region, forcing the model to learn more robust features.
*   **Mixup/Cutmix:** Combines multiple images and their labels, acting as a strong regularization technique.
*   **Custom Augmentations:** Tailor augmentations to specific challenges in your dataset (e.g., specific lighting conditions).

### Learning Rate Schedulers

Dynamically adjust the learning rate during training. Common schedulers include:

*   **ReduceLROnPlateau:** Reduces learning rate when a metric (e.g., validation loss) has stopped improving.
*   **CosineAnnealingLR:** Decays the learning rate following a cosine curve.
*   **OneCycleLR:** A powerful scheduler that cycles the learning rate and momentum.

### Early Stopping

Monitor a validation metric (e.g., validation loss or accuracy) and stop training when it no longer improves for a certain number of epochs. This prevents overfitting and saves computational resources.

### Cross-Validation

For smaller datasets, use k-fold cross-validation to get a more reliable estimate of your model's performance and ensure it generalizes well across different subsets of your data.

### Transfer Learning Strategies

*   **Unfreeze More Layers:** Instead of just fine-tuning the classification head, gradually unfreeze more layers of the pre-trained EfficientNet model and train them with a smaller learning rate.
*   **Different Pre-trained Models:** Experiment with other state-of-the-art pre-trained models (e.g., ResNet, Vision Transformers) available in `torchvision.models`.

### Logging with TensorBoardX

Integrate `TensorBoardX` (or PyTorch Lightning's built-in loggers) to visualize training metrics, model graphs, and even image predictions over time. This provides a powerful way to debug and compare different training runs.

## 10. Troubleshooting Common Issues

*   **`ModuleNotFoundError`:** Ensure your virtual environment is activated and `PYTHONPATH` is correctly set (as handled by `run.sh`). If running individual Python files, ensure your current directory allows Python to find the `src` package.
*   **`FileNotFoundError` (for images):** Double-check that all image paths in `labels.csv` are correct and that the image files physically exist in the specified `data_master/` subdirectories.
*   **Low Accuracy/High Loss:**
    *   **Data Issues:** Verify data quality, correct labels, and sufficient data quantity.
    *   **Hyperparameters:** Experiment with learning rate, batch size, and number of epochs.
    *   **Model Complexity:** Consider if the model is too simple or too complex for your task.
    *   **Overfitting:** If training loss is low but validation accuracy is poor, the model might be overfitting. Implement more data augmentation, regularization (e.g., dropout), or early stopping.
*   **Streamlit Not Launching:** Check if Streamlit is installed (`pip install streamlit`) and if the port (default 8501) is not blocked or in use.

## 11. Project Structure

```
project_root/
│
├── data_master/               # Folder for raw data (images and labels.csv)
│   ├── pho_bo/pho_bo_tai/
│   ├── pho_bo/pho_bo_nam/
│   ├── bun_cha/
│   └── labels.csv             # Main labels and nutritional information
│
├── models/                    # Stores trained model checkpoints
│
├── src/
│   ├── app.py                 # Main CLI for train/validate/setting
│   ├── train.py               # Streamlit script for training with dashboard
│   ├── validate.py            # Streamlit script for image upload and prediction
│   ├── data_loader.py         # Handles data loading, preprocessing, and dataset creation
│   ├── model.py               # Defines the fine-tuned classification model
│   ├── utils.py               # Utility functions (e.g., model save/load)
│   └── settings.py            # Manages default and adjustable hyperparameters
│
├── logs/                      # Optional: For TensorBoard logs
├── requirements.txt           # List of Python packages required
├── Dockerfile                 # Optional: For containerizing the application
├── run.sh                     # Main bash script for CLI operations
└── README.md                  # Project documentation and instructions
```
## Contact
phuc.dangcs2007@hcmut.edu.vn