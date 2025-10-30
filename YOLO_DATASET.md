# 📦 YOLO Dataset Preparation Guide

This guide explains how to manually prepare your YOLO detection dataset for training the hybrid Vietnamese food detection system.

---

## 📁 Required Directory Structure

Your YOLO dataset must follow this exact structure:

```
data_master/detection_dataset/
├── images/
│   ├── train/          # Training images (.jpg, .png)
│   └── val/            # Validation images (.jpg, .png)
└── labels/
    ├── train/          # Training annotations (.txt)
    └── val/            # Validation annotations (.txt)
```

**Important:**
- Each image in `images/train/` must have a corresponding `.txt` file in `labels/train/` with the same base name
- Each image in `images/val/` must have a corresponding `.txt` file in `labels/val/` with the same base name
- Example: `image001.jpg` → `image001.txt`

---

## 📝 YOLO Annotation Format

Each `.txt` annotation file contains one line per bounding box with this format:

```
class_id x_center y_center width height
```

### Format Details:

- **class_id**: Integer representing the food class (0 to 29 for 30 classes)
- **x_center**: Center X coordinate (normalized 0-1)
- **y_center**: Center Y coordinate (normalized 0-1)
- **width**: Bounding box width (normalized 0-1)
- **height**: Bounding box height (normalized 0-1)

**All coordinates are normalized by image dimensions!**

### Normalization Formula:

```python
x_center = (absolute_x + absolute_width / 2) / image_width
y_center = (absolute_y + absolute_height / 2) / image_height
width = absolute_width / image_width
height = absolute_height / image_height
```

---

## 📋 Example Annotations

### Example 1: Single Dish
Image: `pho_001.jpg` (1920x1080)
Contains 1 bowl of phở at position (400, 200) with size (800x600)

**File:** `labels/train/pho_001.txt`
```
28 0.625 0.463 0.417 0.556
```

**Calculation:**
```python
class_id = 28  # Phở is class 28
x_center = (400 + 800/2) / 1920 = 0.625
y_center = (200 + 600/2) / 1080 = 0.463
width = 800 / 1920 = 0.417
height = 600 / 1080 = 0.556
```

### Example 2: Multiple Dishes
Image: `mixed_001.jpg` (1920x1080)
Contains:
- 1 bánh mì at (100, 100) size (300x200)
- 2 phở at (500, 150) size (400x350) and (1000, 200) size (450x400)

**File:** `labels/train/mixed_001.txt`
```
9 0.130 0.139 0.156 0.185
28 0.365 0.300 0.208 0.324
28 0.638 0.370 0.234 0.370
```

---

## 🏷️ Class Mapping

Your food classes should match the order in `data_master/labels.csv`. The system uses alphabetical order by default:

| Class ID | Class Name |
|----------|------------|
| 0 | Banh_beo |
| 1 | Banh_bot_loc |
| 2 | Banh_can |
| ... | ... |
| 28 | Pho |
| 29 | Xoi_xeo |

**Important:** Check your `labels.csv` file to confirm the exact class order!

---

## ✅ Validation Checklist

Before training, verify your dataset:

### 1. File Count Match
```bash
# Count images
ls data_master/detection_dataset/images/train/*.jpg | wc -l
ls data_master/detection_dataset/images/val/*.jpg | wc -l

# Count labels
ls data_master/detection_dataset/labels/train/*.txt | wc -l
ls data_master/detection_dataset/labels/val/*.txt | wc -l
```

**Counts must match!**

### 2. Filename Match
Every image must have a corresponding label file:
```bash
# Check for missing labels
for img in data_master/detection_dataset/images/train/*.jpg; do
    base=$(basename "$img" .jpg)
    if [ ! -f "data_master/detection_dataset/labels/train/$base.txt" ]; then
        echo "Missing label: $base.txt"
    fi
done
```

### 3. Format Validation
Each annotation line must have exactly 5 values:
```bash
# Check annotation format
awk 'NF != 5 {print FILENAME ":" NR ": Expected 5 fields, got " NF}' \
    data_master/detection_dataset/labels/train/*.txt
```

### 4. Value Range Check
All coordinates must be between 0 and 1:
```bash
# Check for invalid coordinates
awk '$2<0 || $2>1 || $3<0 || $3>1 || $4<0 || $4>1 || $5<0 || $5>1 \
    {print FILENAME ":" NR ": Coordinates out of range [0,1]"}' \
    data_master/detection_dataset/labels/train/*.txt
```

### 5. Class ID Check
All class IDs must be valid (0 to num_classes-1):
```bash
# Check for invalid class IDs (assuming 30 classes)
awk '$1<0 || $1>=30 {print FILENAME ":" NR ": Invalid class ID " $1}' \
    data_master/detection_dataset/labels/train/*.txt
```

---

## 🛠️ Annotation Tools

### Recommended Tools:

1. **LabelImg** (Most Popular)
   - GUI tool for object detection
   - Direct YOLO format export
   - https://github.com/heartexlabs/labelImg

2. **Roboflow** (Cloud-based)
   - Web-based annotation
   - Auto-generates train/val splits
   - Exports to YOLO format
   - https://roboflow.com

3. **CVAT** (Advanced)
   - Full-featured annotation platform
   - Team collaboration
   - Supports YOLO export
   - https://github.com/opencv/cvat

4. **Labelme** (Lightweight)
   - JSON format (needs conversion)
   - Python-based, easy to use
   - https://github.com/wkentaro/labelme

---

## 🔄 Dataset Split Recommendations

### Typical Split Ratios:

| Split | Percentage | Purpose |
|-------|------------|---------|
| **Train** | 70-80% | Model learning |
| **Val** | 20-30% | Hyperparameter tuning & early stopping |

### Split Strategies:

1. **Random Split** - Shuffle all images randomly
2. **Stratified Split** - Maintain class distribution
3. **Scene-based Split** - Separate by location/lighting (recommended for real-world)

---

## 🚀 Training Process

### After Preparing Your Dataset:

1. **Place annotations in correct folders:**
   ```bash
   data_master/detection_dataset/
   ├── images/train/  # Your training images
   ├── images/val/    # Your validation images
   ├── labels/train/  # Your training annotations
   └── labels/val/    # Your validation annotations
   ```

2. **Start training:**
   ```bash
   ./menu.sh
   # Select: 1. Train Model → 2. Train YOLOv10
   ```

3. **The system will:**
   - ✅ Auto-detect your annotations
   - ✅ Generate `dataset.yaml` automatically
   - ✅ Start training with progress display
   - ✅ Save checkpoints to `models/yolov10_detector.pt`

**No need to run `python src/app.py prepare-dataset yolo`!**

---

## 📊 Dataset Statistics

### Recommended Minimum:

| Metric | Minimum | Recommended |
|--------|---------|-------------|
| **Total Images** | 300 | 1,000+ |
| **Images per Class** | 10 | 50+ |
| **Bounding Boxes** | 500 | 2,000+ |
| **Train/Val Ratio** | 70/30 | 80/20 |

### Quality Guidelines:

- ✅ Various angles and lighting conditions
- ✅ Different dish presentations and plating
- ✅ Multiple servings per image (realistic scenarios)
- ✅ Occlusions and partial views
- ✅ Background variations (restaurant, home, outdoor)
- ❌ Avoid duplicate or near-duplicate images
- ❌ Avoid extreme blur or low resolution
- ❌ Avoid mislabeled or ambiguous annotations

---

## 🐛 Common Issues & Solutions

### Issue 1: "Dataset configuration not found"
**Solution:** The system now auto-generates `dataset.yaml` - just ensure your images and labels are in place

### Issue 2: Training crashes with "No labels found"
**Solution:** Check that label files exist and match image filenames exactly

### Issue 3: "Invalid YOLO format"
**Solution:** Verify each line has exactly 5 space-separated values

### Issue 4: Low mAP during training
**Possible causes:**
- Insufficient training data
- Incorrect annotations (check bounding box alignment)
- Class imbalance (some dishes have too few examples)
- Images too small or low quality

### Issue 5: "Class ID out of range"
**Solution:** Ensure class IDs are 0 to (num_classes-1), check `labels.csv` for class order

---

## 📞 Need Help?

If you encounter issues:

1. **Verify dataset structure** using the checklist above
2. **Run validation commands** to catch format errors
3. **Check annotation tool settings** (ensure YOLO format export)
4. **Inspect sample annotations** manually to verify correctness

---

## ✨ Tips for Best Results

1. **Annotate tightly** - Bounding boxes should closely fit the food item
2. **Include context** - Leave small margins around objects for better detection
3. **Label consistently** - Use same class names across all annotations
4. **Balance classes** - Try to have similar numbers of each food type
5. **Augmentation** - System automatically applies augmentation during training
6. **Multi-instance** - Annotate ALL food items in each image for hybrid system to work

---

**Status:** ✅ Dataset Guide Complete | 📦 YOLO Format | 🚀 Ready for Manual Annotation
