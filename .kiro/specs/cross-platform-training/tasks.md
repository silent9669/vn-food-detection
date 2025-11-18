# Implementation Plan

- [ ] 1. Create Device Manager module
  - Create `src/device_manager.py` with device detection and management functions
  - Implement `get_optimal_device()` with priority: CUDA > MPS > CPU
  - Implement `get_device_info()` to return detailed device information dictionary
  - Implement `supports_mixed_precision()` to check if device supports AMP
  - Implement `recommend_batch_size()` with device-specific recommendations
  - Implement `estimate_available_memory()` for memory estimation
  - Implement `validate_device_compatibility()` for system validation
  - Add comprehensive logging for device selection and transitions
  - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 5.1, 5.2, 5.3, 5.4, 7.3_

- [ ] 2. Update settings module for cross-platform support
  - Import device manager functions in `src/settings.py`
  - Replace hardcoded `DEVICE` with `get_optimal_device()` call
  - Add `DEVICE_OVERRIDE` from environment variable support
  - Add `DEVICE_INFO` dictionary for UI display
  - Implement platform-specific `NUM_WORKERS` configuration (0 for MPS, 4 for CUDA, 2 for CPU)
  - Implement platform-specific `PIN_MEMORY` configuration (False for MPS/CPU, True for CUDA)
  - _Requirements: 1.5, 5.1, 5.2, 5.5, 7.1_

- [ ] 3. Update EfficientNet training for cross-platform support
  - Import device manager functions in `src/train.py`
  - Add conditional mixed precision logic using `supports_mixed_precision()`
  - Wrap training loop with conditional AMP (use GradScaler only on CUDA)
  - Add batch size recommendation display in UI using `recommend_batch_size()`
  - Update device info display in sidebar with detailed device information
  - Add platform-specific warnings for memory constraints
  - Update validation loop with conditional AMP
  - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 4.3, 7.1, 7.4_

- [ ] 4. Update YOLO training for cross-platform support
  - Modify `YOLODetector.__init__()` in `src/yolo_model.py` to accept 'auto' device parameter
  - Implement automatic device detection when device='auto'
  - Add Ultralytics version validation for MPS support (>= 8.0.0)
  - Add device-specific batch size adjustment in `train()` method
  - Update device parameter passing to Ultralytics YOLO framework
  - Add logging for device selection and batch size adjustments
  - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 7.1_

- [ ] 5. Update model utilities for device-agnostic checkpoints
  - Modify `save_model()` in `src/utils.py` to save on CPU for compatibility
  - Update `load_model()` to use device manager for automatic device selection
  - Add explicit `map_location` parameter in `torch.load()` for cross-device loading
  - Ensure model is moved to target device after loading
  - Maintain backward compatibility with existing checkpoints
  - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5_

- [ ] 6. Update Streamlit UI for device information display
  - Update sidebar in `src/train.py` to display detailed device info from `DEVICE_INFO`
  - Add device type, availability status, and capabilities display
  - Add warning messages for compatibility issues
  - Display recommended vs actual batch size when different
  - Add device override status indicator if enabled
  - Show platform-specific optimization settings (workers, pin_memory)
  - _Requirements: 4.3, 4.5, 5.5, 7.4_

- [ ] 7. Add error handling and logging
  - Add try-except blocks for device initialization failures in device manager
  - Implement fallback logic with detailed logging when device unavailable
  - Add device-specific error messages for OOM errors
  - Add error handling for unsupported device overrides
  - Implement actionable error messages with platform-specific guidance
  - Add validation error messages for incompatible PyTorch/Ultralytics versions
  - _Requirements: 1.4, 4.1, 4.2, 4.4, 7.2_

- [ ] 8. Update requirements.txt for cross-platform compatibility
  - Verify PyTorch version supports MPS (>= 1.12.0)
  - Verify Ultralytics version supports MPS (>= 8.0.0)
  - Add version constraints for cross-platform compatibility
  - Add comments documenting platform-specific requirements
  - _Requirements: 3.2, 4.2_

- [ ] 9. Create documentation for cross-platform setup
  - Document device detection behavior and priority order
  - Document platform-specific requirements (macOS 12.3+, CUDA 11.0+)
  - Document environment variable override usage (`DEVICE_OVERRIDE`)
  - Document batch size recommendations per platform
  - Document troubleshooting steps for common device issues
  - Add performance expectations for each platform
  - _Requirements: 4.1, 4.2, 4.3, 4.4_

- [ ]* 10. Write unit tests for device manager
  - Write tests for `get_optimal_device()` with different hardware configurations
  - Write tests for device override functionality
  - Write tests for invalid device handling
  - Write tests for `supports_mixed_precision()` on different devices
  - Write tests for `recommend_batch_size()` logic
  - Write tests for fallback mechanism
  - _Requirements: 1.1, 1.2, 1.4, 5.1, 5.2, 5.3_

- [ ]* 11. Write integration tests for cross-platform training
  - Write test for EfficientNet training on available device (2 epochs)
  - Write test for YOLO training on available device (2 epochs)
  - Write test for checkpoint saving and loading across devices
  - Write test for device migration (if multiple devices available)
  - Write test for batch size adjustment on different devices
  - _Requirements: 2.5, 3.5, 6.1, 6.2, 6.4_
