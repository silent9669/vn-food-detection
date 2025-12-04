# Branch Strategy

## Overview

This project uses a two-branch strategy to separate training and mobile app development:

## Branches

### `main` branch (Training)
**Purpose**: Model training and development

**Contains**:
- Training scripts (src/train.py, src/model.py, src/yolo_model.py)
- Data preparation tools (src/prepare_yolo_dataset.py)
- Evaluation and validation tools (src/evaluate_model.py, src/validate.py)
- Training data (data_master/)
- Trained models (models/)
- Training results (results/)

**Use for**:
- Training new models
- Experimenting with architectures
- Evaluating model performance
- Data preprocessing

### `mobile-app` branch (Mobile Application)
**Purpose**: React Native mobile app and inference API

**Will contain**:
- React Native mobile app (mobile/)
- Backend inference API (server/)
- Deployment configurations
- Mobile app documentation

**Use for**:
- Mobile app development
- Backend API development
- App store deployment
- Production inference service

## Workflow

### Starting Mobile App Development

```bash
# Switch to mobile-app branch
git checkout mobile-app

# Start implementing tasks from .kiro/specs/mobile-app/tasks.md
# Begin with task 1: Initialize React Native project
```

### Sharing Models Between Branches

The trained models need to be available on both branches:

**Option 1: Git LFS (Recommended)**
```bash
# On main branch
git lfs track "models/*.pth"
git lfs track "models/*.pt"
git add .gitattributes
git commit -m "Track models with Git LFS"
git push

# On mobile-app branch
git checkout mobile-app
git merge main  # Get the models
```

**Option 2: Manual Copy**
```bash
# Train on main branch
git checkout main
# ... train models ...

# Copy models to mobile-app branch
git checkout mobile-app
cp ../main-backup/models/*.pth models/
cp ../main-backup/models/*.pt models/
```

**Option 3: VPS Storage**
- Upload trained models directly to VPS
- Mobile app branch only needs the inference API
- Models stay on the server

## Recommended Approach

1. **Keep training on `main` branch**
   - Continue improving models
   - Experiment with new architectures
   - Evaluate performance

2. **Develop mobile app on `mobile-app` branch**
   - Follow the implementation tasks
   - Build React Native app
   - Create inference API

3. **Deploy models to VPS**
   - Upload trained models from `main` branch to VPS
   - Configure API on `mobile-app` branch to use VPS models
   - No need to merge branches frequently

4. **Update models as needed**
   - When you train better models on `main`, upload them to VPS
   - Mobile app automatically uses the new models via API
   - No code changes needed in mobile app

## Next Steps

To start mobile app development:

```bash
# Switch to mobile-app branch
git checkout mobile-app

# Open the tasks file
# .kiro/specs/mobile-app/tasks.md

# Start with task 1
# You can click "Start task" in the Kiro UI or ask me to execute tasks
```
