# Cross-Platform Training Support Design

## Overview

This design implements cross-platform training support for EfficientNetB4 and YOLOv10 models, enabling seamless training on CUDA (NVIDIA GPUs), MPS (Apple Silicon), and CPU devices. The solution introduces a centralized device management system that automatically detects optimal hardware, handles platform-specific optimizations, and ensures consistent behavior across all platforms.

The design prioritizes minimal code changes to existing training logic while maximizing hardware utilization. Key considerations include PyTorch's MPS backend limitations, mixed precision training compatibility, and memory management differences between unified memory (Apple Silicon) and discrete GPU architectures.

## Architecture

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    Training System                          │
│  ┌──────────────────┐         ┌──────────────────┐        │
│  │  EfficientNet    │         │    YOLOv10       │        │
│  │    Training      │         │    Training      │        │
│  └────────┬─────────┘         └────────┬─────────┘        │
│           │                             │                   │
│           └──────────┬──────────────────┘                   │
│                      │                                      │
│           ┌──────────▼──────────┐                          │
│           │   Device Manager    │                          │
│           │  - Auto-detection   │                          │
│           │  - Fallback logic   │                          │
│           │  - Memory estimation│                          │
│           └──────────┬──────────┘                          │
│                      │                                      │
│        ┌─────────────┼─────────────┐                       │
│        │             │             │                       │
│   ┌────▼────┐   ┌───▼────┐   ┌───▼────┐                  │
│   │  CUDA   │   │  MPS   │   │  CPU   │                  │
│   │ Backend │   │Backend │   │Backend │                  │
│   └─────────┘   └────────┘   └────────┘                  │
└─────────────────────────────────────────────────────────────┘
```

### Component Interaction Flow

1. **Initialization**: Device Manager detects available hardware on startup
2. **Configuration**: Training modules query Device Manager for optimal device
3. **Training**: Models and data are moved to selected device
4. **Fallback**: If device fails, Device Manager switches to next available option
5. **Checkpointing**: Models saved in device-agnostic format

## Components and Interfaces

### 1. Device Manager Module (`src/device_manager.py`)

**Purpose**: Centralized device detection, selection, and management

**Key Functions**:

```python
def get_optimal_device(override: Optional[str] = None) -> torch.device:
    """
    Detect and return the optimal compute device.
    Priority: CUDA > MPS > CPU
    
    Args:
        override: Optional device string to force specific device
        
    Returns:
        torch.device: Selected device
        
    Raises:
        ValueError: If override device is invalid or unavailable
    """

def get_device_info() -> Dict[str, Any]:
    """
    Get detailed information about available devices.
    
    Returns:
        Dict containing:
        - available_devices: List of available device types
        - selected_device: Currently selected device
        - cuda_available: bool
        - mps_available: bool
        - cuda_device_count: int
        - cuda_device_name: Optional[str]
        - pytorch_version: str
        - mps_supported: bool (PyTorch >= 1.12)
    """

def supports_mixed_precision(device: torch.device) -> bool:
    """
    Check if device supports mixed precision training.
    
    Args:
        device: Target device
        
    Returns:
        bool: True if GradScaler should be used
    """

def estimate_available_memory(device: torch.device) -> Optional[int]:
    """
    Estimate available memory in bytes for the device.
    
    Args:
        device: Target device
        
    Returns:
        Optional[int]: Available memory in bytes, None if cannot determine
    """

def recommend_batch_size(device: torch.device, model_type: str, 
                        default_batch_size: int) -> int:
    """
    Recommend batch size based on device capabilities.
    
    Args:
        device: Target device
        model_type: "efficientnet" or "yolo"
        default_batch_size: Default batch size from config
        
    Returns:
        int: Recommended batch size
    """

def validate_device_compatibility() -> List[str]:
    """
    Validate system compatibility and return warnings.
    
    Returns:
        List[str]: Warning messages for compatibility issues
    """
```

**Implementation Details**:
- Uses `torch.cuda.is_available()` for CUDA detection
- Uses `torch.backends.mps.is_available()` for MPS detection (PyTorch >= 1.12)
- Implements fallback chain: CUDA → MPS → CPU
- Caches device selection to avoid repeated detection
- Logs all device transitions and warnings

### 2. Updated Settings Module (`src/settings.py`)

**Changes**:
```python
from src.device_manager import get_optimal_device, get_device_info

# Replace hardcoded DEVICE
DEVICE_OVERRIDE = os.getenv("DEVICE_OVERRIDE", None)  # Optional override
DEVICE = get_optimal_device(override=DEVICE_OVERRIDE)

# Add device info for UI display
DEVICE_INFO = get_device_info()

# Platform-specific worker recommendations
if DEVICE.type == "mps":
    NUM_WORKERS = 0  # MPS works best with single-threaded data loading
    PIN_MEMORY = False  # Not beneficial for unified memory
elif DEVICE.type == "cuda":
    NUM_WORKERS = 4  # Can handle more parallel workers
    PIN_MEMORY = True
else:  # CPU
    NUM_WORKERS = 2
    PIN_MEMORY = False
```

### 3. Updated EfficientNet Training (`src/train.py`)

**Key Changes**:

```python
from src.device_manager import supports_mixed_precision, recommend_batch_size

# Device-aware mixed precision
device = torch.device(DEVICE)
use_amp = supports_mixed_precision(device)

if use_amp:
    scaler = GradScaler()
    st.info("Using mixed precision training (AMP)")
else:
    scaler = None
    st.info("Using standard float32 training")

# Recommend batch size
recommended_batch = recommend_batch_size(device, "efficientnet", batch_size)
if recommended_batch != batch_size:
    st.warning(f"Recommended batch size for {device.type}: {recommended_batch}")

# Training loop with conditional AMP
for inputs, labels in train_loader:
    inputs, labels = inputs.to(device), labels.to(device)
    optimizer.zero_grad()
    
    if use_amp:
        with autocast():
            outputs = model(inputs)
            loss = criterion(outputs, labels)
        scaler.scale(loss).backward()
        scaler.step(optimizer)
        scaler.update()
    else:
        outputs = model(inputs)
        loss = criterion(outputs, labels)
        loss.backward()
        optimizer.step()
```

**Rationale**: MPS backend doesn't fully support `torch.cuda.amp.autocast()`, so we conditionally use mixed precision only on CUDA devices.

### 4. Updated YOLO Training (`src/yolo_model.py`)

**Key Changes**:

```python
class YOLODetector:
    def __init__(self, model_path=None, model_name='yolov10n.pt', device='auto'):
        """
        Args:
            device: 'auto', 'cuda', 'mps', 'cpu', or specific device like 'cuda:0'
        """
        if device == 'auto':
            from src.device_manager import get_optimal_device
            self.device = str(get_optimal_device())
        else:
            self.device = device
            
        # Validate Ultralytics MPS support
        if 'mps' in self.device:
            import ultralytics
            version = tuple(map(int, ultralytics.__version__.split('.')[:2]))
            if version < (8, 0):
                print(f"Warning: Ultralytics {ultralytics.__version__} may not fully support MPS. Recommend >= 8.0.0")
        
        self.model = YOLO(model_path if model_path and os.path.exists(model_path) else model_name)
        self.model.to(self.device)

    def train(self, data_yaml, epochs=50, batch_size=16, **kwargs):
        """
        Train with device-aware settings.
        """
        # Device-specific batch size adjustment
        if 'mps' in self.device:
            # MPS may need smaller batches due to unified memory
            from src.device_manager import recommend_batch_size
            recommended = recommend_batch_size(torch.device(self.device), "yolo", batch_size)
            if recommended != batch_size:
                print(f"Adjusting batch size for MPS: {batch_size} → {recommended}")
                batch_size = recommended
        
        results = self.model.train(
            data=data_yaml,
            epochs=epochs,
            batch=batch_size,
            device=self.device,
            **kwargs
        )
        return results
```

**Rationale**: Ultralytics YOLO handles device-specific optimizations internally, but we provide guidance on batch sizes and validate library versions.

### 5. Updated Model Utilities (`src/utils.py`)

**Key Changes**:

```python
def save_model(model, path):
    """Save model in device-agnostic format."""
    # Move to CPU before saving for maximum compatibility
    model_cpu = model.cpu()
    torch.save(model_cpu.state_dict(), path)
    # Move back to original device
    model.to(next(model.parameters()).device)

def load_model(model, path, device=None):
    """
    Load model with explicit device handling.
    """
    if device is None:
        from src.device_manager import get_optimal_device
        device = get_optimal_device()
    
    if isinstance(device, str):
        device = torch.device(device)
    
    # Load with map_location for cross-device compatibility
    checkpoint = torch.load(path, map_location=device)
    model.load_state_dict(checkpoint)
    model = model.to(device)
    model.eval()
    
    return model
```

## Data Models

### Device Information Schema

```python
DeviceInfo = {
    "available_devices": List[str],  # ["cuda", "mps", "cpu"]
    "selected_device": str,           # "cuda"
    "cuda_available": bool,
    "mps_available": bool,
    "cuda_device_count": int,
    "cuda_device_name": Optional[str],
    "pytorch_version": str,
    "mps_supported": bool,
    "warnings": List[str]             # Compatibility warnings
}
```

### Device Configuration

```python
DeviceConfig = {
    "device": torch.device,
    "use_amp": bool,                  # Mixed precision enabled
    "recommended_batch_size": int,
    "num_workers": int,
    "pin_memory": bool
}
```

## Error Handling

### Device Detection Failures

```python
try:
    device = get_optimal_device(override="cuda")
except ValueError as e:
    logger.error(f"Device selection failed: {e}")
    logger.info("Falling back to CPU")
    device = torch.device("cpu")
```

### Training Failures

```python
try:
    outputs = model(inputs)
except RuntimeError as e:
    if "MPS" in str(e) or "CUDA" in str(e):
        logger.error(f"Device-specific error on {device}: {e}")
        logger.info("Try reducing batch size or switching to CPU")
        raise
    else:
        raise
```

### Memory Errors

```python
try:
    loss.backward()
except RuntimeError as e:
    if "out of memory" in str(e).lower():
        logger.error(f"OOM on {device} with batch_size={batch_size}")
        logger.info(f"Recommended: Reduce batch size to {batch_size // 2}")
        raise
    else:
        raise
```

## Testing Strategy

### Unit Tests

1. **Device Detection Tests** (`tests/test_device_manager.py`)
   - Test CUDA detection on CUDA systems
   - Test MPS detection on macOS
   - Test CPU fallback
   - Test device override functionality
   - Test invalid device handling

2. **Mixed Precision Tests** (`tests/test_mixed_precision.py`)
   - Verify GradScaler usage on CUDA
   - Verify standard training on MPS
   - Test precision consistency

3. **Model Loading Tests** (`tests/test_model_loading.py`)
   - Test cross-device checkpoint loading
   - Test device migration
   - Test backward compatibility

### Integration Tests

1. **EfficientNet Training** (`tests/test_efficientnet_training.py`)
   - Train for 2 epochs on each available device
   - Verify loss decreases
   - Verify checkpoint compatibility

2. **YOLO Training** (`tests/test_yolo_training.py`)
   - Train for 2 epochs on each available device
   - Verify Ultralytics device handling
   - Verify checkpoint format

### Manual Testing Checklist

- [ ] Train EfficientNet on CUDA system (Linux/Windows with NVIDIA GPU)
- [ ] Train EfficientNet on macOS with Apple Silicon
- [ ] Train EfficientNet on CPU-only system
- [ ] Train YOLOv10 on CUDA system
- [ ] Train YOLOv10 on macOS with Apple Silicon
- [ ] Train YOLOv10 on CPU-only system
- [ ] Load CUDA-trained model on MPS device
- [ ] Load MPS-trained model on CUDA device
- [ ] Verify UI displays correct device information
- [ ] Test device override via environment variable
- [ ] Verify batch size recommendations
- [ ] Test OOM error handling

## Platform-Specific Considerations

### macOS with Apple Silicon (MPS)

**Limitations**:
- MPS backend is newer and may have edge cases
- Some PyTorch operations fall back to CPU
- Unified memory architecture requires different optimization strategies
- `torch.cuda.amp` not supported, use standard float32

**Optimizations**:
- Set `num_workers=0` for data loading (avoids multiprocessing overhead)
- Disable `pin_memory` (not beneficial for unified memory)
- Use smaller batch sizes to account for shared memory with system

**Minimum Requirements**:
- macOS 12.3+
- PyTorch 1.12+ (for MPS support)
- Ultralytics 8.0+ (for YOLO MPS support)

### CUDA (NVIDIA GPUs)

**Optimizations**:
- Enable mixed precision training with GradScaler
- Use `pin_memory=True` for faster host-to-device transfers
- Increase `num_workers` for parallel data loading
- Larger batch sizes possible with dedicated VRAM

**Minimum Requirements**:
- CUDA 11.0+
- PyTorch with CUDA support
- NVIDIA GPU with compute capability 3.5+

### CPU Fallback

**Behavior**:
- Standard float32 training
- Reduced batch sizes
- Minimal workers to avoid overhead
- Significantly slower but guaranteed compatibility

## Performance Expectations

### EfficientNetB4 Training Speed (relative to CUDA baseline)

- CUDA (RTX 3090): 1.0x (baseline)
- MPS (M1 Max): ~0.6-0.8x
- CPU (Intel i9): ~0.1-0.15x

### YOLOv10 Training Speed (relative to CUDA baseline)

- CUDA (RTX 3090): 1.0x (baseline)
- MPS (M1 Max): ~0.5-0.7x
- CPU (Intel i9): ~0.05-0.1x

**Note**: Actual performance varies based on specific hardware, batch size, and model configuration.

## Migration Path

### Phase 1: Device Manager Implementation
- Create `device_manager.py` module
- Implement detection and selection logic
- Add comprehensive logging

### Phase 2: Settings Update
- Update `settings.py` to use Device Manager
- Add device info export for UI

### Phase 3: EfficientNet Integration
- Update `train.py` with conditional AMP
- Add device-aware batch size recommendations
- Update UI to display device info

### Phase 4: YOLO Integration
- Update `yolo_model.py` with device handling
- Add Ultralytics version validation
- Update training parameters

### Phase 5: Testing & Validation
- Run integration tests on all platforms
- Validate checkpoint compatibility
- Performance benchmarking

## Backward Compatibility

- Existing checkpoints remain compatible (device-agnostic format)
- Default behavior unchanged (auto-detection)
- No breaking changes to public APIs
- Environment variable override is optional
