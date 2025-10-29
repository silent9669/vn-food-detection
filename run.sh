#!/bin/bash

# Set PYTHONPATH to include the project root
export PYTHONPATH="$(pwd):$PYTHONPATH"

# Main CLI for AI Food Recognition application

# Function to display the menu and get user choice
show_menu() {
    echo ""
    echo "=================================="
    echo "  Vietnamese Food Detection CLI   "
    echo "=================================="
    echo "Please choose an option:"
    echo "1. Train Model"
    echo "2. Validate Model (Single Image)"
    echo "3. Evaluate Model (Dataset)"
    echo "4. Exit"
    echo "=================================="
    read -p "Enter your choice [1-4]: " choice
    echo ""
}

# Main loop
while true; do
    show_menu

    case $choice in
        1)
            echo "Starting training dashboard..."
            streamlit run src/train.py
            ;;
        2)
            echo "Starting single image validation interface..."
            streamlit run src/validate.py
            ;;
        3)
            echo "Starting model evaluation dashboard..."
            streamlit run src/evaluate_model.py
            ;;
        4)
            echo "Exiting CLI. Goodbye!"
            exit 0
            ;;
        *)
            echo "Invalid choice. Please enter a number between 1 and 4."
            ;;
    esac
    echo ""
    read -p "Press Enter to continue..." # Pause after each action
done