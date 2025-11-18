# Requirements Document

## Introduction

This feature adds cross-platform training support for both EfficientNetB4 and YOLOv10 models, enabling training on CUDA-enabled GPUs and macOS devices with Metal Performance Shaders (MPS) acceleration. The system will automatically detect available hardware and optimize training accordingly, ensuring consistent behavior across platforms while maximizing performance.

## Glossary

- **Training System**: The hybrid Vietnamese food detection and classification system that trains both EfficientNetB4 and YOLOv10 models
- **Device Manager**: Component responsible for detecting and selecting the optimal compute device (CUDA, MPS, or CPU)
- **MPS**: Metal Performance Shaders, Apple's GPU acceleration framework for PyTorch on macOS
- **CUDA**: NVIDIA's parallel computing platform for GPU acceleration
- **Mixed Precision Training**: Training technique using both float16 and float32 data types to improve performance
- **Fallback Mechanism**: System behavior when preferred hardware acceleration is unavailable

## Requirements

### Requirement 1

**User Story:** As a developer, I want the system to automatically detect and use the best available hardware acceleration, so that I can train models efficiently on both CUDA and macOS Metal devices without manual configuration

#### Acceptance Criteria

1. WHEN the Training System initializes, THE Device Manager SHALL detect available compute devices in priority order: CUDA, MPS, then CPU
2. WHEN multiple acceleration options are available, THE Device Manager SHALL select CUDA over MPS and MPS over CPU
3. THE Device Manager SHALL log the selected device and its capabilities to the console
4. WHEN the selected device is unavailable during runtime, THE Device Manager SHALL fall back to the next available device and log a warning
5. THE Training System SHALL expose the selected device through a configuration interface accessible to all training modules

### Requirement 2

**User Story:** As a machine learning engineer, I want EfficientNetB4 training to work seamlessly on both CUDA and MPS devices, so that I can train classification models on any available hardware

#### Acceptance Criteria

1. WHEN training EfficientNetB4 on CUDA devices, THE Training System SHALL use mixed precision training with GradScaler
2. WHEN training EfficientNetB4 on MPS devices, THE Training System SHALL use standard float32 precision without GradScaler
3. THE Training System SHALL move model parameters, inputs, and labels to the selected device before each training step
4. WHEN device-specific errors occur during training, THE Training System SHALL log detailed error messages including device type and operation
5. THE Training System SHALL maintain identical training logic and hyperparameters across all device types

### Requirement 3

**User Story:** As a machine learning engineer, I want YOLOv10 training to support both CUDA and MPS acceleration, so that I can train object detection models on macOS and Linux systems

#### Acceptance Criteria

1. WHEN initializing YOLOv10 training, THE Training System SHALL pass the detected device identifier to the Ultralytics YOLO framework
2. THE Training System SHALL verify that the Ultralytics library version supports MPS acceleration (version 8.0.0 or higher)
3. WHEN training on MPS devices, THE Training System SHALL configure batch size and worker count to avoid MPS-specific memory issues
4. THE Training System SHALL validate that the dataset YAML configuration is compatible with the selected device
5. WHEN YOLOv10 training completes, THE Training System SHALL save model checkpoints in a device-agnostic format

### Requirement 4

**User Story:** As a developer, I want clear documentation and error messages for device compatibility issues, so that I can quickly troubleshoot platform-specific problems

#### Acceptance Criteria

1. WHEN an unsupported device is requested, THE Device Manager SHALL raise an exception with a message listing supported devices
2. WHEN MPS is selected but PyTorch version is incompatible, THE Device Manager SHALL log a warning and fall back to CPU
3. THE Training System SHALL display device information in the Streamlit UI including device type, name, and availability status
4. WHEN training fails due to device-specific issues, THE Training System SHALL provide actionable error messages with platform-specific guidance
5. THE Training System SHALL include device compatibility information in the system information sidebar

### Requirement 5

**User Story:** As a data scientist, I want to optionally override automatic device selection, so that I can test models on specific hardware or troubleshoot device-specific issues

#### Acceptance Criteria

1. WHERE a device override is specified in settings, THE Device Manager SHALL attempt to use the specified device
2. WHEN the specified device is unavailable, THE Device Manager SHALL log an error and fall back to automatic detection
3. THE Training System SHALL validate the override device string against supported values: "cuda", "mps", "cpu"
4. THE Device Manager SHALL provide a function to list all available devices with their current status
5. WHERE device override is enabled, THE Training System SHALL display the override status in the UI

### Requirement 6

**User Story:** As a machine learning engineer, I want consistent model checkpoint formats across platforms, so that I can train on one platform and deploy on another without compatibility issues

#### Acceptance Criteria

1. THE Training System SHALL save model checkpoints using device-agnostic state dictionaries
2. WHEN loading checkpoints, THE Training System SHALL use map_location parameter to handle cross-device compatibility
3. THE Training System SHALL verify checkpoint integrity after saving on each device type
4. WHEN transferring models between devices, THE Training System SHALL explicitly move all model parameters to the target device
5. THE Training System SHALL maintain backward compatibility with existing checkpoint files

### Requirement 7

**User Story:** As a developer, I want the system to handle device-specific memory constraints, so that training doesn't fail due to out-of-memory errors on different hardware

#### Acceptance Criteria

1. WHEN training on MPS devices, THE Training System SHALL recommend batch sizes that account for unified memory architecture
2. WHEN out-of-memory errors occur, THE Training System SHALL log the current batch size and suggest a reduced value
3. THE Device Manager SHALL provide a function to estimate available memory on the selected device
4. WHERE memory constraints are detected, THE Training System SHALL display a warning in the UI before training starts
5. THE Training System SHALL allow dynamic batch size adjustment without requiring code changes
