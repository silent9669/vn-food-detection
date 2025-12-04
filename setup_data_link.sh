#!/bin/bash
# Setup data symlink for training branch

echo "🔗 Setting up data symlink..."

# Check if we're on training branch
BRANCH=$(git branch --show-current)
if [ "$BRANCH" != "training" ]; then
    echo "⚠️  Warning: You're on '$BRANCH' branch, not 'training'"
    echo "   Switch to training branch first: git checkout training"
    exit 1
fi

# Check if external data folder exists
DATA_FOLDER=~/Documents/food_data
if [ ! -d "$DATA_FOLDER" ]; then
    echo "❌ Error: Data folder not found at $DATA_FOLDER"
    echo "   Please create it and add your food images there"
    exit 1
fi

# Remove old symlink if exists
if [ -L "data_master/raw_images" ]; then
    echo "🗑️  Removing old symlink..."
    rm data_master/raw_images
fi

# Create new symlink
echo "✨ Creating symlink: data_master/raw_images -> $DATA_FOLDER"
ln -s "$DATA_FOLDER" data_master/raw_images

# Verify
if [ -L "data_master/raw_images" ]; then
    CLASS_COUNT=$(ls -1 data_master/raw_images | wc -l | tr -d ' ')
    echo "✅ Symlink created successfully!"
    echo "📊 Found $CLASS_COUNT food classes"
    echo ""
    echo "Sample classes:"
    ls data_master/raw_images | head -5
else
    echo "❌ Failed to create symlink"
    exit 1
fi
