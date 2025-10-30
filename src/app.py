# app.py
import argparse
import os
import subprocess
import sys

# Ensure the src directory is in the Python path
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

def run_streamlit(script_name, model_type=None):
    """Helper function to run a Streamlit script."""
    command = ["streamlit", "run", f"src/{script_name}.py"]
    if model_type:
        command.extend(["--", f"--model_type={model_type}"])
    
    print(f"Running command: {' '.join(command)}")
    try:
        subprocess.run(command, check=True)
    except FileNotFoundError:
        print(f"Error: 'streamlit' command not found.")
        print("Please make sure Streamlit is installed and in your PATH.")
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

  # Train models
  python app.py train efficientnet
  python app.py train yolo

  # Validate with hybrid mode (recommended)
  python app.py validate
  python app.py validate hybrid

  # Evaluate models
  python app.py evaluate efficientnet
  python app.py evaluate yolo

For more information, see README.md
        """
    )
    subparsers = parser.add_subparsers(dest="command", help="Available commands")

    # --- Training ---
    train_parser = subparsers.add_parser("train", help="Train a model")
    train_parser.add_argument(
        "model", choices=["efficientnet", "yolo"], help="The model to train."
    )

    # --- Validation ---
    validate_parser = subparsers.add_parser("validate", help="Validate models with single image (default: hybrid)")
    validate_parser.add_argument(
        "model", nargs='?', default="hybrid", choices=["efficientnet", "yolo", "hybrid"],
        help="The model/mode to use for validation (default: hybrid - recommended)"
    )
    
    # --- Evaluation ---
    evaluate_parser = subparsers.add_parser("evaluate", help="Evaluate a model on a dataset")
    evaluate_parser.add_argument(
        "model", choices=["efficientnet", "yolo"], help="The model to evaluate."
    )

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
        print(f"Launching Streamlit training dashboard for {args.model}...")
        run_streamlit("train", model_type=args.model)
            
    elif args.command == "validate":
        print(f"Launching Streamlit validation GUI for {args.model}...")
        # Pass the model type to the validation script
        run_streamlit("validate", model_type=args.model)

    elif args.command == "evaluate":
        print(f"Launching Streamlit evaluation dashboard for {args.model}...")
        if args.model == "efficientnet":
             run_streamlit("evaluate_model", model_type=args.model)
        elif args.model == "yolo":
            run_streamlit("evaluate_model", model_type=args.model)

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
