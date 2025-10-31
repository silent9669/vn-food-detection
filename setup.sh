#!/bin/bash

# Vietnamese Food Detection System - Setup Script
# This script installs all dependencies and sets up the project

set -e  # Exit on error

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
NC='\033[0m'
BOLD='\033[1m'

echo -e "${CYAN}"
echo "╔═══════════════════════════════════════════════════════════════╗"
echo "║   🍜 Vietnamese Food Detection - Setup Script 🍜             ║"
echo "╚═══════════════════════════════════════════════════════════════╝"
echo -e "${NC}\n"

# Check Python
echo -e "${BOLD}[1/6] Checking Python...${NC}"
if ! command -v python &> /dev/null; then
    echo -e "${RED}✗ Python not found! Please install Python 3.8+${NC}"
    exit 1
fi

PYTHON_VERSION=$(python -c 'import sys; print(".".join(map(str, sys.version_info[:2])))')
echo -e "${GREEN}✓ Python $PYTHON_VERSION found${NC}"

# Check minimum version
PYTHON_MAJOR=$(python -c 'import sys; print(sys.version_info[0])')
PYTHON_MINOR=$(python -c 'import sys; print(sys.version_info[1])')

if [ "$PYTHON_MAJOR" -lt 3 ] || { [ "$PYTHON_MAJOR" -eq 3 ] && [ "$PYTHON_MINOR" -lt 8 ]; }; then
    echo -e "${RED}✗ Python 3.8+ required. Found: $PYTHON_VERSION${NC}"
    exit 1
fi
echo ""

# Check pip
echo -e "${BOLD}[2/6] Checking pip...${NC}"
if ! command -v pip &> /dev/null; then
    echo -e "${YELLOW}⚠ pip not found! Installing...${NC}"
    python -m ensurepip --upgrade
fi
echo -e "${GREEN}✓ pip found${NC}"
echo ""

# Upgrade pip
echo -e "${BOLD}Upgrading pip...${NC}"
python -m pip install --upgrade pip
echo ""

# Install requirements
echo -e "${BOLD}[3/6] Installing Python packages...${NC}"
echo -e "${YELLOW}This may take 5-10 minutes depending on your connection...${NC}\n"

if [ -f "requirements.txt" ]; then
    echo "Installing packages from requirements.txt..."
    pip install -r requirements.txt

    echo ""
    echo "Installing ultralytics (for YOLOv10)..."
    pip install ultralytics

    echo -e "\n${GREEN}✓ All Python packages installed successfully${NC}\n"
else
    echo -e "${RED}✗ requirements.txt not found!${NC}"
    echo "Please ensure requirements.txt exists in the project root."
    exit 1
fi

# Verify PyTorch and CUDA
echo -e "${BOLD}[4/6] Checking PyTorch and GPU...${NC}"
TORCH_INSTALLED=$(python -c 'import torch; print("True")' 2>/dev/null || echo "False")

if [ "$TORCH_INSTALLED" = "True" ]; then
    echo -e "${GREEN}✓ PyTorch installed${NC}"

    CUDA_AVAILABLE=$(python -c 'import torch; print(torch.cuda.is_available())' 2>/dev/null)

    if [ "$CUDA_AVAILABLE" = "True" ]; then
        GPU_NAME=$(python -c 'import torch; print(torch.cuda.get_device_name(0))' 2>/dev/null)
        GPU_COUNT=$(python -c 'import torch; print(torch.cuda.device_count())' 2>/dev/null)
        echo -e "${GREEN}✓ CUDA available${NC}"
        echo -e "  GPU: ${CYAN}$GPU_NAME${NC}"
        echo -e "  GPU Count: ${CYAN}$GPU_COUNT${NC}"
    else
        echo -e "${YELLOW}⚠ CUDA not available - training will use CPU (much slower)${NC}"
        echo -e "${YELLOW}  Consider using a GPU for faster training${NC}"
    fi
else
    echo -e "${RED}✗ PyTorch not installed correctly${NC}"
    exit 1
fi
echo ""

# Create necessary directories
echo -e "${BOLD}[5/6] Setting up project directories...${NC}"

DIRS=(
    "data_master/raw_images"
    "data_master/detection_dataset/images/train"
    "data_master/detection_dataset/images/val"
    "data_master/detection_dataset/labels/train"
    "data_master/detection_dataset/labels/val"
    "models"
    "results"
)

for dir in "${DIRS[@]}"; do
    if [ ! -d "$dir" ]; then
        mkdir -p "$dir"
        echo -e "${GREEN}  ✓ Created: $dir${NC}"
    else
        echo -e "${CYAN}  → Exists: $dir${NC}"
    fi
done

echo ""

# Make scripts executable
echo -e "${BOLD}[6/6] Configuring scripts...${NC}"

# Make menu.sh and setup.sh executable
if [ -f "menu.sh" ]; then
    chmod +x menu.sh
    echo -e "${GREEN}✓ menu.sh is executable${NC}"
fi

if [ -f "setup.sh" ]; then
    chmod +x setup.sh
    echo -e "${GREEN}✓ setup.sh is executable${NC}"
fi

echo ""

# Run verification
echo -e "${BOLD}Running system verification...${NC}"
echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}\n"

if [ -f "src/verify_setup.py" ]; then
    python src/verify_setup.py
else
    echo -e "${YELLOW}⚠ verify_setup.py not found, skipping verification${NC}"
fi

echo ""
echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"

# Success Summary
echo ""
echo -e "${BOLD}${GREEN}✓ Setup Complete!${NC}\n"

echo -e "${BOLD}📋 Quick Start Guide:${NC}"
echo ""
echo -e "${BOLD}1️⃣  Launch the Interactive Menu${NC}"
echo -e "   ${CYAN}./menu.sh${NC}"
echo ""
echo -e "   ${YELLOW}Main Menu Options:${NC}"
echo -e "   • ${GREEN}1${NC} - Launch Training GUI (select model in GUI)"
echo -e "   • ${GREEN}2${NC} - Launch Validation GUI (select mode in GUI)"
echo -e "   • ${GREEN}3${NC} - Launch Evaluation GUI (select model in GUI)"
echo ""

echo -e "${BOLD}2️⃣  Or use Command Line${NC}"
echo -e "   ${CYAN}python src/app.py train${NC}      - Open training GUI"
echo -e "   ${CYAN}python src/app.py validate${NC}   - Open validation GUI"
echo -e "   ${CYAN}python src/app.py evaluate${NC}   - Open evaluation GUI"
echo ""

echo -e "${BOLD}3️⃣  Prepare Your Data${NC}"
echo -e "   For ${YELLOW}EfficientNet${NC} (classification):"
echo -e "   • Place images in: ${CYAN}data_master/raw_images/${NC}"
echo -e "   • Update labels in: ${CYAN}data_master/labels.csv${NC}"
echo ""
echo -e "   For ${YELLOW}YOLOv10${NC} (detection):"
echo -e "   • Run: ${CYAN}python src/app.py prepare-dataset yolo${NC}"
echo -e "   • Or prepare manually in: ${CYAN}data_master/detection_dataset/${NC}"
echo ""

echo -e "${BOLD}💡 Key Features:${NC}"
echo -e "   • ${GREEN}No restarts needed${NC} - switch models in the GUI"
echo -e "   • ${GREEN}Model caching${NC} - instant switching after first load"
echo -e "   • ${GREEN}Adjustable parameters${NC} - tune everything in real-time"
echo -e "   • ${GREEN}Three detection modes${NC} - Hybrid, YOLO, EfficientNet"
echo ""

echo -e "${BOLD}📚 Additional Commands:${NC}"
echo -e "   ${CYAN}python src/verify_setup.py${NC}   - Check system status"
echo -e "   ${CYAN}python src/app.py -h${NC}         - Show all CLI options"
echo ""

echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BOLD}${CYAN}Ready to start! Run: ./menu.sh 🚀${NC}"
echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""
