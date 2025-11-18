# app.py
import argparse
import os
import subprocess
import sys

# Ensure the src directory is in the Python path
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

def run_streamlit(script_name):
    """Helper function to run a Streamlit script."""
    # Use python3 -m streamlit for better compatibility on macOS
    python_cmd = sys.executable  # Use the same Python interpreter that's running this script
    command = [python_cmd, "-m", "streamlit", "run", f"src/{script_name}.py"]

    print(f"Running command: {' '.join(command)}")
    try:
        subprocess.run(command, check=True)
    except FileNotFoundError:
        print(f"Error: Could not run streamlit.")
        print(f"Please make sure Streamlit is installed: {python_cmd} -m pip install streamlit")
        sys.exit(1)
    except subprocess.CalledProcessError as e:
        print(f"Error running {script_name}.py: {e}")
        sys.exit(1)

def print_banner():
    """Print application banner."""
    banner = """
╔═══════════════════════════════════════════════════════════════╗
║   🍜 Hybrid Vietnamese Food Detection & Classification 🍜    ║
║                                                               ║
║   Combining YOLOv10 + EfficientNet for Maximum Accuracy     ║
╚═══════════════════════════════════════════════════════════════╝
    """
    print(banner)

def main():
    print_banner()

    parser = argparse.ArgumentParser(
        description="Hybrid Vietnamese Food Variation Detection & Classification System CLI",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Examples:
  # Prepare dataset for YOLO training
  python app.py prepare-dataset yolo

  # Launch training GUI (select model in UI)
  python app.py train

  # Launch validation GUI (select model in UI)
  python app.py validate

  # Launch evaluation GUI (select model in UI)
  python app.py evaluate

For more information, see README.md
        """
    )
    subparsers = parser.add_subparsers(dest="command", help="Available commands")

    # --- Training ---
    train_parser = subparsers.add_parser("train", help="Launch training GUI")

    # --- Validation ---
    validate_parser = subparsers.add_parser("validate", help="Launch validation GUI")

    # --- Evaluation ---
    evaluate_parser = subparsers.add_parser("evaluate", help="Launch evaluation GUI")

    # --- Dataset Preparation ---
    prepare_parser = subparsers.add_parser("prepare-dataset", help="Prepare datasets for training (e.g., YOLO format)")
    prepare_parser.add_argument(
        "dataset", choices=["yolo"], help="The dataset format to prepare."
    )

    # If no arguments, show help
    if len(sys.argv) == 1:
        parser.print_help()
        sys.exit(0)

    args = parser.parse_args()

    if args.command == "train":
        print("Launching Streamlit training GUI...")
        print("Select your model and configure parameters in the GUI.")
        run_streamlit("train")

    elif args.command == "validate":
        print("Launching Streamlit validation GUI...")
        print("Select your model (EfficientNet/YOLO/Hybrid) in the GUI.")
        run_streamlit("validate")

    elif args.command == "evaluate":
        print("Launching Streamlit evaluation GUI...")
        print("Select your model and configure parameters in the GUI.")
        run_streamlit("evaluate_model")

    elif args.command == "prepare-dataset":
        if args.dataset == "yolo":
            print("Preparing YOLO dataset...")
            try:
                # Directly call the function from the module
                from src.prepare_yolo_dataset import prepare_yolo_dataset
                prepare_yolo_dataset()
                print("YOLO dataset preparation complete.")
            except Exception as e:
                print(f"Error preparing YOLO dataset: {e}")
                sys.exit(1)
    
if __name__ == "__main__":
    main()
