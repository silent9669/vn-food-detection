#!/bin/bash

# Set PYTHONPATH to include the project root
export PYTHONPATH="$(pwd):$PYTHONPATH"

# Colors for better UI
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color
BOLD='\033[1m'

# Function to display banner
display_banner() {
    clear
    echo -e "${CYAN}"
    echo "╔═══════════════════════════════════════════════════════════════╗"
    echo "║   🍜 Hybrid Vietnamese Food Detection & Classification 🍜    ║"
    echo "║                                                               ║"
    echo "║   Combining YOLOv10 + EfficientNet for Maximum Accuracy     ║"
    echo "╚═══════════════════════════════════════════════════════════════╝"
    echo -e "${NC}"
}

# Function to display main menu
show_menu() {
    echo -e "\n${BOLD}Main Menu:${NC}"
    echo -e "${GREEN}1)${NC} Launch Training GUI ${CYAN}(Select model in GUI)${NC}"
    echo -e "${GREEN}2)${NC} Launch Validation GUI ${CYAN}(Select mode in GUI)${NC}"
    echo -e "${GREEN}3)${NC} Launch Evaluation GUI ${CYAN}(Select model in GUI)${NC}"
    echo -e "${YELLOW}4)${NC} Verify Setup"
    echo -e "${RED}0)${NC} Exit"
    echo ""
    echo -e "${BOLD}Enter your choice:${NC} "
}

# Function to pause and wait for user
pause() {
    echo ""
    echo -e "${YELLOW}Press Enter to continue...${NC}"
    read
}

# Function to launch training GUI
launch_training_gui() {
    echo -e "\n${CYAN}Launching Training GUI...${NC}"
    echo ""

    # Display model status
    echo -e "${BOLD}Current Model Status:${NC}"
    if [ -f "models/efficientnet_b4_classifier.pth" ]; then
        echo -e "${GREEN}✓${NC} EfficientNet model found (will resume if selected)"
    else
        echo -e "${YELLOW}○${NC} EfficientNet model not found (will train from scratch)"
    fi

    if [ -f "models/yolov10_detector.pt" ]; then
        echo -e "${GREEN}✓${NC} YOLOv10 model found (will resume if selected)"
    else
        echo -e "${YELLOW}○${NC} YOLOv10 model not found (will train from scratch)"
    fi

    echo ""
    echo -e "${BOLD}In the GUI you can:${NC}"
    echo -e "  • Select which model to train (EfficientNet or YOLOv10)"
    echo -e "  • Adjust training parameters (learning rate, epochs, etc.)"
    echo -e "  • Switch between models without restarting"
    echo -e "  • Monitor training progress in real-time"
    echo ""
    echo -e "${YELLOW}Opening Streamlit dashboard in your browser...${NC}"
    echo ""

    python src/app.py train
    pause
}

# Function to launch validation GUI
launch_validation_gui() {
    echo -e "\n${CYAN}Launching Validation GUI...${NC}"
    echo ""

    # Check model status
    efficientnet_exists=false
    yolo_exists=false

    if [ -f "models/efficientnet_b4_classifier.pth" ]; then
        efficientnet_exists=true
    fi

    if [ -f "models/yolov10_detector.pt" ]; then
        yolo_exists=true
    fi

    # Display model status
    echo -e "${BOLD}Available Models:${NC}"
    if [ "$efficientnet_exists" = true ]; then
        echo -e "${GREEN}✓${NC} EfficientNet model found"
    else
        echo -e "${RED}✗${NC} EfficientNet model not found"
    fi

    if [ "$yolo_exists" = true ]; then
        echo -e "${GREEN}✓${NC} YOLOv10 model found"
    else
        echo -e "${RED}✗${NC} YOLOv10 model not found"
    fi

    # Display available modes
    echo ""
    echo -e "${BOLD}Available Detection Modes in GUI:${NC}"
    if [ "$efficientnet_exists" = true ] && [ "$yolo_exists" = true ]; then
        echo -e "  ${GREEN}✓${NC} Hybrid Mode (YOLO + EfficientNet) ${CYAN}[Recommended]${NC}"
    else
        echo -e "  ${YELLOW}○${NC} Hybrid Mode (requires both models)"
    fi

    if [ "$yolo_exists" = true ]; then
        echo -e "  ${GREEN}✓${NC} YOLO Only (Multi-dish detection)"
    else
        echo -e "  ${YELLOW}○${NC} YOLO Only (model not found)"
    fi

    if [ "$efficientnet_exists" = true ]; then
        echo -e "  ${GREEN}✓${NC} EfficientNet Only (Single dish classification)"
    else
        echo -e "  ${YELLOW}○${NC} EfficientNet Only (model not found)"
    fi

    # Warn if no models found
    if [ "$efficientnet_exists" = false ] && [ "$yolo_exists" = false ]; then
        echo ""
        echo -e "${RED}⚠️  Warning: No trained models found!${NC}"
        echo -e "Please train at least one model first:"
        echo -e "  ${CYAN}./menu.sh${NC} → 1. Train Model"
        echo ""
        read -p "Continue anyway? (y/n): " choice
        if [[ ! "$choice" =~ ^[Yy]$ ]]; then
            return
        fi
    fi

    echo ""
    echo -e "${BOLD}In the GUI you can:${NC}"
    echo -e "  • Select detection mode (Hybrid/YOLO/EfficientNet)"
    echo -e "  • Upload images, use URLs, or capture from camera"
    echo -e "  • Adjust confidence and IoU thresholds"
    echo -e "  • View nutrition information"
    echo -e "  • Switch modes without restarting"
    echo ""
    echo -e "${YELLOW}Opening Streamlit interface in your browser...${NC}"
    echo ""

    python src/app.py validate
    pause
}

# Function to launch evaluation GUI
launch_evaluation_gui() {
    echo -e "\n${CYAN}Launching Evaluation GUI...${NC}"
    echo ""

    # Check model status
    efficientnet_exists=false
    yolo_exists=false

    if [ -f "models/efficientnet_b4_classifier.pth" ]; then
        efficientnet_exists=true
    fi

    if [ -f "models/yolov10_detector.pt" ]; then
        yolo_exists=true
    fi

    # Display model status
    echo -e "${BOLD}Available Models for Evaluation:${NC}"
    if [ "$efficientnet_exists" = true ]; then
        echo -e "${GREEN}✓${NC} EfficientNet model found"
    else
        echo -e "${RED}✗${NC} EfficientNet model not found"
    fi

    if [ "$yolo_exists" = true ]; then
        echo -e "${GREEN}✓${NC} YOLOv10 model found"
    else
        echo -e "${RED}✗${NC} YOLOv10 model not found"
    fi

    # Warn if no models found
    if [ "$efficientnet_exists" = false ] && [ "$yolo_exists" = false ]; then
        echo ""
        echo -e "${RED}⚠️  Warning: No trained models found!${NC}"
        echo -e "Please train at least one model first:"
        echo -e "  ${CYAN}./menu.sh${NC} → 1. Train Model"
        echo ""
        read -p "Continue anyway? (y/n): " choice
        if [[ ! "$choice" =~ ^[Yy]$ ]]; then
            return
        fi
    fi

    echo ""
    echo -e "${BOLD}In the GUI you can:${NC}"
    echo -e "  • Select which model to evaluate (EfficientNet or YOLOv10)"
    echo -e "  • Configure evaluation settings (batch size, data paths)"
    echo -e "  • View detailed metrics and confusion matrices"
    echo -e "  • Results are saved to 'results/' directory"
    echo -e "  • Switch between models without restarting"
    echo ""
    echo -e "${YELLOW}Opening Streamlit evaluation dashboard in your browser...${NC}"
    echo ""

    python src/app.py evaluate
    pause
}

# Function to verify setup
verify_setup() {
    echo -e "\n${CYAN}Verifying System Setup...${NC}"
    echo ""
    python src/verify_setup.py
    pause
}

# Main program loop
main() {
    while true; do
        display_banner
        show_menu
        read -r choice

        case $choice in
            1)
                launch_training_gui
                ;;
            2)
                launch_validation_gui
                ;;
            3)
                launch_evaluation_gui
                ;;
            4)
                verify_setup
                ;;
            0)
                echo -e "\n${GREEN}Thank you for using Vietnamese Food Detection System!${NC}"
                echo -e "${CYAN}Happy training! 🍜${NC}\n"
                exit 0
                ;;
            *)
                echo -e "${RED}Invalid option. Please try again.${NC}"
                sleep 1
                ;;
        esac
    done
}

# Check if Python is available
if ! command -v python &> /dev/null; then
    echo -e "${RED}Error: Python is not installed or not in PATH${NC}"
    exit 1
fi

# Run main program
main
