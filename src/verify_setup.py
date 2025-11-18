#!/usr/bin/env python3
"""
Verification script to ensure all components are properly installed and configured.
Run this before starting training to check if everything is ready.
"""

import sys
import os
from pathlib import Path

def print_header(text):
    """Print formatted header."""
    print(f"\n{'='*60}")
    print(f"  {text}")
    print(f"{'='*60}")

def check_python_version():
    """Check Python version."""
    print_header("Checking Python Version")
    version = sys.version_info
    print(f"Python version: {version.major}.{version.minor}.{version.micro}")

    if version.major < 3 or (version.major == 3 and version.minor < 8):
        print("❌ ERROR: Python 3.8+ is required")
        return False
    print("✅ Python version OK")
    return True

def check_imports():
    """Check if all required packages are installed."""
    print_header("Checking Required Packages")

    packages = {
        "torch": "PyTorch",
        "torchvision": "TorchVision",
        "pandas": "Pandas",
        "streamlit": "Streamlit",
        "PIL": "Pillow",
        "ultralytics": "Ultralytics (YOLOv10)",
        "matplotlib": "Matplotlib",
        "seaborn": "Seaborn",
        "sklearn": "scikit-learn",
        "tqdm": "tqdm",
        "yaml": "PyYAML",
        "cv2": "OpenCV",
        "numpy": "NumPy"
    }

    all_ok = True
    for package, name in packages.items():
        try:
            if package == "PIL":
                from PIL import Image
            elif package == "yaml":
                import yaml
            elif package == "sklearn":
                import sklearn
            elif package == "cv2":
                import cv2
            else:
                __import__(package)
            print(f"✅ {name}")
        except ImportError:
            print(f"❌ {name} - NOT INSTALLED")
            all_ok = False

    return all_ok

def check_cuda():
    """Check GPU acceleration availability (CUDA or MPS)."""
    print_header("Checking GPU Acceleration Support")
    try:
        import torch
        
        # Check CUDA
        if torch.cuda.is_available():
            print(f"✅ CUDA available")
            print(f"   GPU Device: {torch.cuda.get_device_name(0)}")
            print(f"   CUDA Version: {torch.version.cuda}")
            print(f"   Device Count: {torch.cuda.device_count()}")
            return True
        
        # Check MPS (Apple Silicon)
        if hasattr(torch.backends, 'mps') and torch.backends.mps.is_available():
            print(f"✅ Metal Performance Shaders (MPS) available")
            print(f"   Device: Apple Silicon GPU")
            print(f"   PyTorch Version: {torch.__version__}")
            print(f"   Note: MPS provides GPU acceleration on macOS")
            return True
        
        # No GPU acceleration
        print("⚠️  No GPU acceleration available - will use CPU (slower)")
        print("   For faster training:")
        print("   • macOS: Requires Apple Silicon (M1/M2/M3) and PyTorch 1.12+")
        print("   • Linux/Windows: Requires NVIDIA GPU with CUDA support")
        return True
        
    except Exception as e:
        print(f"❌ Error checking GPU: {e}")
        return False

def check_project_structure():
    """Check if project structure is correct."""
    print_header("Checking Project Structure")

    required_dirs = [
        "src",
        "data_master",
        "models",
        "results"
    ]

    required_files = [
        "src/app.py",
        "src/verify_setup.py",
        "menu.sh",
        "setup.sh",
        "requirements.txt",
        "README.md",
        "src/model.py",
        "src/yolo_model.py",
        "src/hybrid_inference.py",
        "src/train.py",
        "src/validate.py",
        "src/evaluate_model.py",
        "src/data_loader.py",
        "src/prepare_yolo_dataset.py",
        "src/settings.py",
        "src/utils.py"
    ]

    all_ok = True

    # Check directories
    for dir_path in required_dirs:
        if os.path.isdir(dir_path):
            print(f"✅ Directory: {dir_path}")
        else:
            print(f"⚠️  Directory missing (will be created): {dir_path}")
            try:
                os.makedirs(dir_path, exist_ok=True)
                print(f"   Created: {dir_path}")
            except Exception as e:
                print(f"   ❌ Could not create: {e}")

    # Check files
    for file_path in required_files:
        if os.path.isfile(file_path):
            print(f"✅ File: {file_path}")
        else:
            print(f"❌ File missing: {file_path}")
            all_ok = False

    return all_ok

def check_dataset():
    """Check if dataset is present."""
    print_header("Checking Dataset")

    data_dir = "data_master"
    raw_images = os.path.join(data_dir, "raw_images")
    labels_csv = os.path.join(data_dir, "labels.csv")

    if not os.path.exists(raw_images):
        print(f"⚠️  Raw images directory not found: {raw_images}")
        print("   Please organize your images according to README.md structure")
        return False

    if not os.path.exists(labels_csv):
        print(f"⚠️  Labels CSV not found: {labels_csv}")
        print("   Please create labels.csv with nutrition data")
        return False

    # Count classes
    try:
        class_dirs = [d for d in os.listdir(raw_images) if os.path.isdir(os.path.join(raw_images, d))]
        print(f"✅ Found {len(class_dirs)} food classes in {raw_images}")

        # Count images
        total_images = 0
        for class_dir in class_dirs:
            class_path = os.path.join(raw_images, class_dir)
            images = [f for f in os.listdir(class_path) if f.lower().endswith(('.jpg', '.jpeg', '.png'))]
            total_images += len(images)

        print(f"✅ Total images: {total_images}")

        if total_images < 100:
            print("⚠️  Warning: Less than 100 images found. Consider adding more data for better training.")

    except Exception as e:
        print(f"❌ Error checking dataset: {e}")
        return False

    return True

def check_models():
    """Check if trained models exist."""
    print_header("Checking Trained Models")

    # Check for EfficientNet model (multiple possible names)
    efficientnet_models = [
        "models/food_classifier.pth",
        "models/efficientnet_b4_classifier.pth"
    ]
    yolo_model = "models/yolov10_detector.pt"

    has_efficientnet = False
    found_efficientnet_path = None
    for model_path in efficientnet_models:
        if os.path.exists(model_path):
            has_efficientnet = True
            found_efficientnet_path = model_path
            break

    has_yolo = os.path.exists(yolo_model)

    if has_efficientnet:
        print(f"✅ EfficientNet model found: {found_efficientnet_path}")
    else:
        print(f"⚠️  EfficientNet model not found")
        print("   Train with: ./menu.sh → 1. Train Model")

    if has_yolo:
        print(f"✅ YOLO model found: {yolo_model}")
    else:
        print(f"⚠️  YOLO model not found: {yolo_model}")
        print("   Train with: ./menu.sh → 1. Train Model")

    if not has_efficientnet and not has_yolo:
        print("\n⚠️  No trained models found. You need to train models before validation.")

    return True

def test_imports():
    """Test importing project modules."""
    print_header("Testing Project Imports")

    # Add parent directory to path to import src modules
    import sys
    sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

    all_ok = True
    modules = [
        "src.model",
        "src.yolo_model",
        "src.hybrid_inference",
        "src.data_loader",
        "src.prepare_yolo_dataset",
        "src.settings",
        "src.utils"
    ]

    for module in modules:
        try:
            __import__(module)
            print(f"✅ {module}")
        except Exception as e:
            print(f"❌ {module} - ERROR: {e}")
            all_ok = False

    return all_ok

def main():
    """Run all verification checks."""
    print("""
╔═══════════════════════════════════════════════════════════════╗
║   🍜 Vietnamese Food Detection - Setup Verification 🍜       ║
╚═══════════════════════════════════════════════════════════════╝
    """)

    checks = [
        ("Python Version", check_python_version),
        ("Required Packages", check_imports),
        ("CUDA/GPU Support", check_cuda),
        ("Project Structure", check_project_structure),
        ("Project Imports", test_imports),
        ("Dataset", check_dataset),
        ("Trained Models", check_models),
    ]

    results = []
    for name, check_func in checks:
        try:
            result = check_func()
            results.append((name, result))
        except Exception as e:
            print(f"\n❌ Error during {name} check: {e}")
            results.append((name, False))

    # Summary
    print_header("Verification Summary")
    all_passed = all(result for _, result in results)

    for name, result in results:
        status = "✅ PASS" if result else "❌ FAIL"
        print(f"{status:12} {name}")

    print("\n" + "="*60)
    if all_passed:
        print("✅ All checks passed! Your environment is ready for training.")
        print("\nNext steps:")
        print("  Run the interactive menu: ./menu.sh")
    else:
        print("⚠️  Some checks failed. Please fix the issues above.")
        print("\nTo install missing packages:")
        print("  ./setup.sh")

    return 0 if all_passed else 1

if __name__ == "__main__":
    sys.exit(main())
