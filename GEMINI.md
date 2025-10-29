# Project Guidelines

* Compatible with Python 3.8+ and Jupyter Notebook environment.
* **Coding Style:**
  * Use 4 spaces for Python indentation.
  * Function and variable names use snake_case.
  * Classes in PascalCase.
  * Use typing annotations for function signatures.
  * All long-running tasks (training, validation) should include progress bar and logging.
* **Data Pipeline:**
  * Centralize all data loading/preprocessing code in data_loader.py.
  * Use OpenCV + Albumentations for image processing.
  * Annotation parsing must support COCO instance segmentation JSON format.
* **Model Training:**
  * Modular training scripts for EfficientNet-B4 classification and Mask R-CNN segmentation.
  * Use PyTorch Lightning for structured training workflow.
  * Track metrics in TensorBoardX; save best checkpoints automatically.
* **Quick Validation:**
  * Implement notebook/script for quick inference on random or uploaded images.
  * Results include predicted dish name, mask overlay, portion estimation, and calorie calculation.
  * Visualize outputs via matplotlib inline.

# Debugging & Internet Lookup

* Before running/debugging any pipeline step or command, search open sources (papers, GitHub repos, forums) for existing implementations or known issues.
* Automatically parse search results and adapt debugging strategy accordingly.
* Log all search queries and results for reproducibility.
* Enable running all standard commands (data prep, training, validation, export) via CLI with clear flags and environment configs.

# Security Considerations

* Never store API keys or secrets directly; use .env or OS environment variables.
* Logs should avoid leaking sensitive data.
* Code pull requests must include security review for data privacy compliance.

## Summary

This Gemini CLI project blueprint prioritizes:

- **Clean code** following best Python practices (typing, modularity, PEP8).
- **Robust, modular training pipeline** with pretrained models and mixed datasets.
- **Interactive CLI** with Streamlit GUIs for training and validation.
- **Automatic data management** integrating Kaggle demo + personal datasets.
- **Live progress tracking and detailed logging** via TensorBoardX and structured file logs.
- **Security compliance** for API keys and data privacy.

Designed for maximum developer productivity while ensuring high reproducibility and maintainability of your AI food recognition pipeline.


