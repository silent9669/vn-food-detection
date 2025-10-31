import os
import sys
import pandas as pd
import json
from shutil import copyfile
from tqdm import tqdm
from pathlib import Path
import yaml

# Add parent directory to path for imports to work in Streamlit Cloud
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from src.settings import CLASSIFICATION_DATA_DIR, DETECTION_DATA_DIR, LABELS_CSV_PATH


def prepare_yolo_dataset(use_existing_annotations=True, split_ratio=0.8):
    """
    Prepare YOLO format dataset from user-provided annotations or classification data.

    IMPORTANT: This function expects you to provide your own annotations!

    Supported formats:
    1. YOLO format (recommended): Place .txt files in detection_dataset/labels/
    2. COCO format: Place train.json and val.json in detection_dataset/annotations/
    3. Auto-generate: Creates whole-image annotations (only for single-dish classification)

    Args:
        use_existing_annotations: If True, use existing YOLO/COCO annotations provided by user.
                                 If False, auto-generate from classification images.
        split_ratio: Train/val split ratio (default 0.8) - only used for auto-generation
    """
    print("="*60)
    print("YOLO Dataset Preparation")
    print("="*60)

    # Define paths
    raw_images_dir = CLASSIFICATION_DATA_DIR
    train_images_dir = os.path.join(DETECTION_DATA_DIR, "images", "train")
    val_images_dir = os.path.join(DETECTION_DATA_DIR, "images", "val")
    train_labels_dir = os.path.join(DETECTION_DATA_DIR, "labels", "train")
    val_labels_dir = os.path.join(DETECTION_DATA_DIR, "labels", "val")

    # Create directories if they don't exist
    for dir_path in [train_images_dir, val_images_dir, train_labels_dir, val_labels_dir]:
        os.makedirs(dir_path, exist_ok=True)

    # Load labels CSV
    labels_df = pd.read_csv(LABELS_CSV_PATH)

    # Get unique class names and create a class_to_idx mapping
    class_names = sorted(labels_df['class_name'].unique().tolist())
    class_to_idx = {name: i for i, name in enumerate(class_names)}
    num_classes = len(class_names)

    print(f"Found {num_classes} classes: {', '.join(class_names[:5])}{'...' if len(class_names) > 5 else ''}")

    # Check for existing YOLO format labels
    existing_train_labels = os.path.join(DETECTION_DATA_DIR, "labels", "train")
    existing_val_labels = os.path.join(DETECTION_DATA_DIR, "labels", "val")
    existing_yolo_labels = os.path.exists(existing_train_labels) and os.path.exists(existing_val_labels)

    # Check for COCO annotations
    coco_train_path = os.path.join(DETECTION_DATA_DIR, "annotations", "train.json")
    coco_val_path = os.path.join(DETECTION_DATA_DIR, "annotations", "val.json")
    existing_coco_annotations = os.path.exists(coco_train_path) and os.path.exists(coco_val_path)

    if existing_yolo_labels and use_existing_annotations:
        print("✓ Found existing YOLO format annotations!")
        print(f"  Train labels: {existing_train_labels}")
        print(f"  Val labels: {existing_val_labels}")
        print("\nValidating annotation format...")

        # Count annotation files
        train_label_count = len([f for f in os.listdir(existing_train_labels) if f.endswith('.txt')])
        val_label_count = len([f for f in os.listdir(existing_val_labels) if f.endswith('.txt')])

        print(f"  Train annotations: {train_label_count} files")
        print(f"  Val annotations: {val_label_count} files")

        if train_label_count == 0 or val_label_count == 0:
            print("\n⚠️  Warning: No annotation files found!")
            print("Please provide YOLO format annotations (.txt files) in:")
            print(f"  - {existing_train_labels}/")
            print(f"  - {existing_val_labels}/")
            print("\nAnnotation format: class_id x_center y_center width height (normalized)")
            return

        print("\n✓ Annotations validated! Using existing labels.")

    elif existing_coco_annotations and use_existing_annotations:
        print("✓ Found COCO format annotations. Converting to YOLO format...")
        _convert_coco_to_yolo(coco_train_path, train_images_dir, train_labels_dir, class_to_idx)
        _convert_coco_to_yolo(coco_val_path, val_images_dir, val_labels_dir, class_to_idx)

    elif not use_existing_annotations:
        print("⚠️  Auto-generating annotations from classification images...")
        print("Note: This creates whole-image bounding boxes (only suitable for single-dish images)")
        print("      For multi-dish detection, please provide proper annotations!")

        response = input("\nContinue with auto-generation? (yes/no): ")
        if response.lower() not in ['yes', 'y']:
            print("Cancelled. Please provide proper annotations.")
            return

        # Split data into train and validation sets
        train_df = labels_df.sample(frac=split_ratio, random_state=42)
        val_df = labels_df.drop(train_df.index)

        datasets = {
            'train': (train_df, train_images_dir, train_labels_dir),
            'val': (val_df, val_images_dir, val_labels_dir)
        }

        for split_name, (df, images_dir, labels_dir) in datasets.items():
            print(f"Processing {split_name} set ({len(df)} images)...")
            _process_classification_to_yolo(df, raw_images_dir, images_dir, labels_dir, class_to_idx)

    else:
        print("\n❌ No annotations found!")
        print("\nPlease provide annotations in one of these formats:")
        print("\n1. YOLO Format (Recommended):")
        print(f"   Place .txt files in:")
        print(f"   - {train_labels_dir}/")
        print(f"   - {val_labels_dir}/")
        print("   Format: class_id x_center y_center width height (normalized)")
        print("\n2. COCO Format:")
        print(f"   Place JSON files:")
        print(f"   - {coco_train_path}")
        print(f"   - {coco_val_path}")
        print("\n3. Auto-generate (only for single-dish images):")
        print("   Run: python app.py prepare-dataset yolo --auto-generate")
        return

    # Generate dataset.yaml for YOLOv10
    _create_yolo_yaml(DETECTION_DATA_DIR, class_names)

    print(f"\nYOLO dataset preparation complete!")
    print(f"Dataset structure:")
    print(f"  - Train images: {train_images_dir}")
    print(f"  - Train labels: {train_labels_dir}")
    print(f"  - Val images: {val_images_dir}")
    print(f"  - Val labels: {val_labels_dir}")
    print(f"  - Config: {os.path.join(DETECTION_DATA_DIR, 'dataset.yaml')}")


def _process_classification_to_yolo(df, src_images_dir, dst_images_dir, dst_labels_dir, class_to_idx):
    """Process classification dataset into YOLO format with whole-image bounding boxes."""
    for index, row in tqdm(df.iterrows(), total=len(df), desc="Processing images"):
        image_path_in_csv = row['image_path']  # e.g., 'Banh_beo/100.jpg'
        class_name = row['class_name']

        # Source path in raw_images
        src_image_path = os.path.join(src_images_dir, image_path_in_csv)

        # Create unique filename to avoid conflicts
        # Use format: classname_originalfilename.jpg
        original_filename = os.path.basename(image_path_in_csv)
        base_name = os.path.splitext(original_filename)[0]
        ext = os.path.splitext(original_filename)[1]
        unique_filename = f"{class_name}_{base_name}{ext}"

        dst_image_path = os.path.join(dst_images_dir, unique_filename)

        # Copy image
        if os.path.exists(src_image_path):
            copyfile(src_image_path, dst_image_path)
        else:
            print(f"\nWarning: Image not found at {src_image_path}. Skipping.")
            continue

        # Create YOLO format annotation (.txt file)
        # Format: class_idx x_center y_center width height (normalized)
        # For whole image: x_center=0.5, y_center=0.5, width=1.0, height=1.0
        class_idx = class_to_idx[class_name]
        annotation_content = f"{class_idx} 0.5 0.5 1.0 1.0"

        # Destination path for annotation file
        annotation_filename = os.path.splitext(unique_filename)[0] + ".txt"
        dst_annotation_path = os.path.join(dst_labels_dir, annotation_filename)

        with open(dst_annotation_path, "w") as f:
            f.write(annotation_content)


def _convert_coco_to_yolo(coco_json_path, dst_images_dir, dst_labels_dir, class_to_idx):
    """Convert COCO format annotations to YOLO format."""
    print(f"Converting {coco_json_path} to YOLO format...")

    with open(coco_json_path, 'r') as f:
        coco_data = json.load(f)

    # Create mapping from COCO category id to class index
    coco_cat_to_class = {}
    for cat in coco_data['categories']:
        if cat['name'] in class_to_idx:
            coco_cat_to_class[cat['id']] = class_to_idx[cat['name']]

    # Group annotations by image
    image_annotations = {}
    for ann in coco_data['annotations']:
        image_id = ann['image_id']
        if image_id not in image_annotations:
            image_annotations[image_id] = []
        image_annotations[image_id].append(ann)

    # Process each image
    for img in tqdm(coco_data['images'], desc="Converting annotations"):
        image_id = img['id']
        filename = img['file_name']
        img_width = img['width']
        img_height = img['height']

        # Copy image if exists
        src_img_path = os.path.join(os.path.dirname(coco_json_path), "..", "images", filename)
        dst_img_path = os.path.join(dst_images_dir, filename)

        if os.path.exists(src_img_path):
            copyfile(src_img_path, dst_img_path)

        # Convert annotations for this image
        if image_id in image_annotations:
            yolo_annotations = []

            for ann in image_annotations[image_id]:
                category_id = ann['category_id']
                if category_id not in coco_cat_to_class:
                    continue

                class_idx = coco_cat_to_class[category_id]

                # Convert COCO bbox [x, y, width, height] to YOLO format
                # [x_center, y_center, width, height] (normalized)
                x, y, w, h = ann['bbox']
                x_center = (x + w / 2) / img_width
                y_center = (y + h / 2) / img_height
                norm_width = w / img_width
                norm_height = h / img_height

                yolo_annotations.append(f"{class_idx} {x_center:.6f} {y_center:.6f} {norm_width:.6f} {norm_height:.6f}")

            # Write YOLO annotation file
            label_filename = os.path.splitext(filename)[0] + ".txt"
            label_path = os.path.join(dst_labels_dir, label_filename)

            with open(label_path, 'w') as f:
                f.write('\n'.join(yolo_annotations))


def create_yolo_yaml(data_dir, class_names):
    """
    Create YOLO dataset configuration YAML file.

    Args:
        data_dir: Path to detection dataset directory
        class_names: List of class names in order

    Returns:
        str: Path to created YAML file
    """
    yaml_path = os.path.join(data_dir, "dataset.yaml")

    config = {
        'path': str(Path(data_dir).absolute()),
        'train': 'images/train',
        'val': 'images/val',
        'nc': len(class_names),
        'names': class_names
    }

    with open(yaml_path, 'w') as f:
        yaml.dump(config, f, default_flow_style=False, sort_keys=False)

    print(f"Created YOLO configuration: {yaml_path}")
    return yaml_path

# Keep backward compatibility
_create_yolo_yaml = create_yolo_yaml

if __name__ == "__main__":
    prepare_yolo_dataset()
