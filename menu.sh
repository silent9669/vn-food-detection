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
    echo -e "${GREEN}1)${NC} Train Model"
    echo -e "${GREEN}2)${NC} Validate Model (Test with Images)"
    echo -e "${GREEN}3)${NC} Evaluate Model (Full Dataset Metrics)"
    echo -e "${CYAN}4)${NC} Verify Setup"
    echo -e "${RED}0)${NC} Exit"
    echo ""
    echo -e "${BOLD}Enter your choice:${NC} "
}

# Function to show training submenu
show_train_menu() {
    clear
    display_banner
    echo -e "\n${BOLD}Training Menu:${NC}"
    echo -e "${GREEN}1)${NC} Train EfficientNet (Classification)"
    echo -e "${GREEN}2)${NC} Train YOLOv10 (Detection)"
    echo -e "${GREEN}3)${NC} Train Both Models (Sequential)"
    echo -e "${YELLOW}0)${NC} Back to Main Menu"
    echo ""
    echo -e "${BOLD}Enter your choice:${NC} "
}

# Function to show validation submenu
show_validate_menu() {
    clear
    display_banner
    echo -e "\n${BOLD}Validation Menu:${NC}"
    echo -e "${GREEN}1)${NC} Hybrid Mode (YOLO + EfficientNet) ${CYAN}[Recommended]${NC}"
    echo -e "${GREEN}2)${NC} YOLOv10 Only (Detection)"
    echo -e "${GREEN}3)${NC} EfficientNet Only (Classification)"
    echo -e "${YELLOW}0)${NC} Back to Main Menu"
    echo ""
    echo -e "${BOLD}Enter your choice:${NC} "
}

# Function to show evaluation submenu
show_evaluate_menu() {
    clear
    display_banner
    echo -e "\n${BOLD}Evaluation Menu:${NC}"
    echo -e "${GREEN}1)${NC} Evaluate EfficientNet"
    echo -e "${GREEN}2)${NC} Evaluate YOLOv10"
    echo -e "${GREEN}3)${NC} Evaluate Both Models"
    echo -e "${YELLOW}0)${NC} Back to Main Menu"
    echo ""
    echo -e "${BOLD}Enter your choice:${NC} "
}

# Function to pause and wait for user
pause() {
    echo ""
    echo -e "${YELLOW}Press Enter to continue...${NC}"
    read
}

# Function to train EfficientNet
train_efficientnet() {
    echo -e "\n${CYAN}Starting EfficientNet Training...${NC}"

    # Check if model already exists
    if [ -f "models/food_classifier.pth" ] || [ -f "models/efficientnet_b4_classifier.pth" ]; then
        echo -e "${YELLOW}⚠️  Existing EfficientNet model found!${NC}"
        echo ""
        read -p "Continue training (will resume from checkpoint)? (y/n): " choice
        if [[ ! "$choice" =~ ^[Yy]$ ]]; then
            echo "Training cancelled."
            pause
            return
        fi
    fi

    echo -e "${YELLOW}This will open a Streamlit dashboard in your browser${NC}"
    echo ""
    python src/app.py train efficientnet
    pause
}

# Function to train YOLO
train_yolo() {
    echo -e "\n${CYAN}Starting YOLOv10 Training...${NC}"

    # Check if model already exists
    if [ -f "models/yolov10_detector.pt" ]; then
        echo -e "${YELLOW}⚠️  Existing YOLOv10 model found!${NC}"
        echo ""
        read -p "Continue training (will resume from checkpoint)? (y/n): " choice
        if [[ ! "$choice" =~ ^[Yy]$ ]]; then
            echo "Training cancelled."
            pause
            return
        fi
    fi

    echo -e "${YELLOW}This will open a Streamlit dashboard in your browser${NC}"
    echo ""
    python src/app.py train yolo
    pause
}

# Function to train both models
train_both() {
    echo -e "\n${CYAN}Training Both Models Sequentially...${NC}"
    echo ""

    echo -e "${BOLD}Step 1/2: Training EfficientNet${NC}"
    echo -e "${YELLOW}This will take approximately 2-3 hours${NC}"
    read -p "Press Enter to start EfficientNet training..."
    python src/app.py train efficientnet

    echo ""
    echo -e "${GREEN}✓ EfficientNet training completed${NC}"
    echo ""

    echo -e "${BOLD}Step 2/2: Training YOLOv10${NC}"
    echo -e "${YELLOW}This will take approximately 8-12 hours${NC}"
    read -p "Press Enter to start YOLOv10 training..."
    python src/app.py train yolo

    echo ""
    echo -e "${GREEN}✓ Both models trained successfully!${NC}"
    pause
}

# Function to validate with hybrid mode
validate_hybrid() {
    echo -e "\n${CYAN}Starting Hybrid Validation...${NC}"

    # Check if both models exist
    efficientnet_exists=false
    yolo_exists=false

    if [ -f "models/food_classifier.pth" ] || [ -f "models/efficientnet_b4_classifier.pth" ]; then
        efficientnet_exists=true
    fi

    if [ -f "models/yolov10_detector.pt" ]; then
        yolo_exists=true
    fi

    if [ "$efficientnet_exists" = false ] || [ "$yolo_exists" = false ]; then
        echo -e "${RED}✗ Error: Models not found!${NC}"
        echo ""
        [ "$efficientnet_exists" = false ] && echo -e "${YELLOW}  Missing: EfficientNet model${NC}"
        [ "$yolo_exists" = false ] && echo -e "${YELLOW}  Missing: YOLOv10 model${NC}"
        echo ""
        echo -e "Please train the models first:"
        echo -e "  ${CYAN}./menu.sh${NC} → 1. Train Model"
        pause
        return
    fi

    echo -e "${GREEN}✓ Both models found${NC}"
    echo -e "${YELLOW}This will open a Streamlit interface in your browser${NC}"
    echo ""
    python src/app.py validate hybrid
    pause
}

# Function to validate with YOLO only
validate_yolo() {
    echo -e "\n${CYAN}Starting YOLO Validation...${NC}"

    if [ ! -f "models/yolov10_detector.pt" ]; then
        echo -e "${RED}✗ YOLOv10 model not found!${NC}"
        echo -e "Please train first: ${CYAN}./menu.sh${NC} → 1. Train Model → 2. Train YOLOv10"
        pause
        return
    fi

    echo -e "${GREEN}✓ Model found${NC}"
    echo -e "${YELLOW}This will open a Streamlit interface in your browser${NC}"
    echo ""
    python src/app.py validate yolo
    pause
}

# Function to validate with EfficientNet only
validate_efficientnet() {
    echo -e "\n${CYAN}Starting EfficientNet Validation...${NC}"

    if [ ! -f "models/food_classifier.pth" ] && [ ! -f "models/efficientnet_b4_classifier.pth" ]; then
        echo -e "${RED}✗ EfficientNet model not found!${NC}"
        echo -e "Please train first: ${CYAN}./menu.sh${NC} → 1. Train Model → 1. Train EfficientNet"
        pause
        return
    fi

    echo -e "${GREEN}✓ Model found${NC}"
    echo -e "${YELLOW}This will open a Streamlit interface in your browser${NC}"
    echo ""
    python src/app.py validate efficientnet
    pause
}

# Function to evaluate EfficientNet
evaluate_efficientnet() {
    echo -e "\n${CYAN}Evaluating EfficientNet...${NC}"
    echo -e "${YELLOW}This will calculate metrics on the validation dataset${NC}"
    echo ""
    python src/app.py evaluate efficientnet
    pause
}

# Function to evaluate YOLO
evaluate_yolo() {
    echo -e "\n${CYAN}Evaluating YOLOv10...${NC}"
    echo -e "${YELLOW}This will calculate mAP and other detection metrics${NC}"
    echo ""
    python src/app.py evaluate yolo
    pause
}

# Function to evaluate both
evaluate_both() {
    echo -e "\n${CYAN}Evaluating Both Models...${NC}"
    echo ""

    echo -e "${BOLD}Evaluating EfficientNet...${NC}"
    python src/app.py evaluate efficientnet

    echo ""
    echo -e "${BOLD}Evaluating YOLOv10...${NC}"
    python src/app.py evaluate yolo

    echo ""
    echo -e "${GREEN}✓ Evaluation complete! Check results/ directory${NC}"
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
                while true; do
                    show_train_menu
                    read -r train_choice
                    case $train_choice in
                        1) train_efficientnet ;;
                        2) train_yolo ;;
                        3) train_both ;;
                        0) break ;;
                        *) echo -e "${RED}Invalid option. Please try again.${NC}"; sleep 1 ;;
                    esac
                done
                ;;
            2)
                while true; do
                    show_validate_menu
                    read -r validate_choice
                    case $validate_choice in
                        1) validate_hybrid ;;
                        2) validate_yolo ;;
                        3) validate_efficientnet ;;
                        0) break ;;
                        *) echo -e "${RED}Invalid option. Please try again.${NC}"; sleep 1 ;;
                    esac
                done
                ;;
            3)
                while true; do
                    show_evaluate_menu
                    read -r evaluate_choice
                    case $evaluate_choice in
                        1) evaluate_efficientnet ;;
                        2) evaluate_yolo ;;
                        3) evaluate_both ;;
                        0) break ;;
                        *) echo -e "${RED}Invalid option. Please try again.${NC}"; sleep 1 ;;
                    esac
                done
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
