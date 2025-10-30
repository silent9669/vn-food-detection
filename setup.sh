#!/bin/bash

# Vietnamese Food Detection System - Setup Script
# This script downloads and installs everything needed for training

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
echo "║         Vietnamese Food Detection - Setup Script             ║"
echo "╚═══════════════════════════════════════════════════════════════╝"
echo -e "${NC}\n"

# Check Python
echo -e "${BOLD}[1/5] Checking Python...${NC}"
if ! command -v python &> /dev/null; then
    echo -e "${RED}✗ Python not found! Please install Python 3.8+${NC}"
    exit 1
fi

PYTHON_VERSION=$(python -c 'import sys; print(".".join(map(str, sys.version_info[:2])))')
echo -e "${GREEN}✓ Python $PYTHON_VERSION found${NC}\n"

# Check pip
echo -e "${BOLD}[2/5] Checking pip...${NC}"
if ! command -v pip &> /dev/null; then
    echo -e "${RED}✗ pip not found! Installing...${NC}"
    python -m ensurepip --upgrade
fi
echo -e "${GREEN}✓ pip found${NC}\n"

# Upgrade pip
echo -e "${BOLD}Upgrading pip...${NC}"
python -m pip install --upgrade pip
echo ""

# Install requirements
echo -e "${BOLD}[3/5] Installing Python packages...${NC}"
echo -e "${YELLOW}This may take a few minutes...${NC}\n"

if [ -f "requirements.txt" ]; then
    echo "Installing from requirements.txt..."
    pip install -r requirements.txt

    # Make sure ultralytics is installed
    echo ""
    echo "Installing ultralytics (YOLOv10)..."
    pip install ultralytics

    echo -e "\n${GREEN}✓ All Python packages installed${NC}\n"
else
    echo -e "${RED}✗ requirements.txt not found!${NC}"
    exit 1
fi

# Verify CUDA
echo -e "${BOLD}[4/5] Checking CUDA/GPU...${NC}"
CUDA_AVAILABLE=$(python -c 'import torch; print(torch.cuda.is_available())' 2>/dev/null)

if [ "$CUDA_AVAILABLE" = "True" ]; then
    GPU_NAME=$(python -c 'import torch; print(torch.cuda.get_device_name(0))' 2>/dev/null)
    echo -e "${GREEN}✓ CUDA available${NC}"
    echo -e "  GPU: ${CYAN}$GPU_NAME${NC}\n"
else
    echo -e "${YELLOW}⚠ CUDA not available - will use CPU (slower)${NC}\n"
fi

# Create necessary directories
echo -e "${BOLD}[5/5] Setting up directories...${NC}"

DIRS=(
    "data_master/detection_dataset/images/train"
    "data_master/detection_dataset/images/val"
    "data_master/detection_dataset/labels/train"
    "data_master/detection_dataset/labels/val"
    "data_master/detection_dataset/annotations"
    "models"
    "results"
    "logs"
)

for dir in "${DIRS[@]}"; do
    if [ ! -d "$dir" ]; then
        mkdir -p "$dir"
        echo -e "${GREEN}✓ Created: $dir${NC}"
    else
        echo -e "${CYAN}  Exists: $dir${NC}"
    fi
done

echo ""

# Make scripts executable
echo -e "${BOLD}Making scripts executable...${NC}"
chmod +x run.sh menu.sh verify_setup.py 2>/dev/null
echo -e "${GREEN}✓ Scripts are executable${NC}\n"

# Run verification
echo -e "${BOLD}Running system verification...${NC}"
echo -e "${YELLOW}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}\n"

python src/verify_setup.py

echo ""
echo -e "${YELLOW}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"

# Summary
echo ""
echo -e "${BOLD}${GREEN}Setup Complete!${NC}\n"

echo -e "${BOLD}What's Next:${NC}"
echo ""
echo -e "1️⃣  ${CYAN}Prepare your YOLO annotations${NC}"
echo "   Place your annotated images and labels in:"
echo "   - data_master/detection_dataset/images/train/"
echo "   - data_master/detection_dataset/images/val/"
echo "   - data_master/detection_dataset/labels/train/"
echo "   - data_master/detection_dataset/labels/val/"
echo ""

echo -e "2️⃣  ${CYAN}Verify annotations${NC}"
echo "   python app.py prepare-dataset yolo"
echo ""

echo -e "3️⃣  ${CYAN}Start training${NC}"
echo "   Interactive menu: ./menu.sh"
echo "   Command line:     python app.py train efficientnet"
echo "   Bash wrapper:     ./run.sh train yolo"
echo ""

echo -e "${BOLD}Quick Commands:${NC}"
echo "  ./menu.sh              - Interactive menu (recommended)"
echo "  python src/verify_setup.py - Verify system status"
echo "  python app.py -h       - Show all commands"
echo ""

echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BOLD}Ready to train! 🚀${NC}"
echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""
