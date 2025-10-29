# Vietnamese Food Detection

This project uses AI to recognize Vietnamese food dishes from images, offering a CLI and interactive Streamlit GUIs for training, validation, and evaluation.

## 1. Tech Stack

| Category         | Technology                 | Description                                      |
| :--------------- | :------------------------- | :----------------------------------------------- |
| **Language**     | Python                     | Core programming language                        |
| **Deep Learning**| PyTorch                    | Model development, training, and evaluation      |
| **Model**        | EfficientNet_B4 (pre-trained)| Image classification backbone                  |
| **UI/Dashboard** | Streamlit                  | Interactive web applications/dashboards          |
| **Data Handling**| torchvision.transforms     | Image preprocessing and augmentation             |
| **Optimization** | torch.cuda.amp, ReduceLROnPlateau| Mixed precision training, learning rate scheduling |
| **CLI**          | Bash (`run.sh`)            | Menu-driven interface for Streamlit apps         |

## 2. Workflow Overview

The `run.sh` script provides a central CLI menu to access different functionalities:

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

## 3. Project Structure

```
project_root/
├── data_master/               # Raw image data, class-specific subdirectories, and labels.csv
│   ├── Banh_beo/
│   ├── Pho/
│   └── labels.csv             # Main labels and nutritional information
│
├── models/                    # Trained model checkpoints (e.g., food_classifier.pth)
├── results/                   # Evaluation outputs (classification reports, confusion matrices)
├── src/                       # All source code for the application
│   ├── data_loader.py         # Data loading, preprocessing, and dataset creation
│   ├── evaluate_model.py      # Streamlit script for dataset-wide model evaluation
│   ├── model.py               # Fine-tuned classification model architecture
│   ├── train.py               # Streamlit script for model training with an interactive dashboard
│   ├── utils.py               # Utility functions (e.g., model save/load)
│   └── validate.py            # Streamlit script for single-image upload and prediction
│
├── logs/                      # Placeholder for training logs
├── requirements.txt           # Python package dependencies
└── run.sh                     # Main bash script for CLI menu
```

## 4. Contact

phuc.dangcs2007@hcmut.edu.vn