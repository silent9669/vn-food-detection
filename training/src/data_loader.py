import os
import pandas as pd
from PIL import Image
import torch
from torch.utils.data import Dataset
from torchvision import transforms
from sklearn.model_selection import train_test_split

class FoodDataset(Dataset):
    def __init__(self, data_dir, csv_file, transform=None):
        self.data_dir = data_dir
        self.labels_df = pd.read_csv(csv_file)
        self.transform = transform
        # Map class names to integers
        self.classes = sorted(self.labels_df['class_name'].unique().tolist())
        self.class_to_idx = {class_name: i for i, class_name in enumerate(self.classes)}
        self.idx_to_class = {i: class_name for i, class_name in enumerate(self.classes)}

    def __len__(self):
        return len(self.labels_df)

    def __getitem__(self, idx):
        # Assuming csv_file has columns: 'image_id', 'class_name'
        # And images are organized as data_dir/class_name/image_id
        image_path_in_csv = self.labels_df.iloc[idx]['image_path']
        label_name = self.labels_df.iloc[idx]['class_name']
        
        img_path = os.path.join(self.data_dir, image_path_in_csv)
        
        image = Image.open(img_path).convert("RGB")
        label = self.class_to_idx[label_name]

        if self.transform:
            image = self.transform(image)

        return image, label

def get_train_transforms(): # New function for training transforms
    return transforms.Compose([
        transforms.Resize((224, 224)),
        transforms.RandomHorizontalFlip(), # Added
        transforms.RandomRotation(degrees=(-30, 30)), # Added
        transforms.ColorJitter(brightness=0.2, contrast=0.2, saturation=0.2, hue=0.1), # Added
        transforms.RandomPerspective(distortion_scale=0.3, p=0.5), # Added
        transforms.RandomAffine(degrees=0, translate=(0.1, 0.1), scale=(0.9, 1.1), shear=10), # Added
        transforms.ToTensor(),
        transforms.Normalize(mean=[0.485, 0.456, 0.406], std=[0.229, 0.224, 0.225]),
    ])

def get_val_transforms(): # New function for validation transforms
    return transforms.Compose([
        transforms.Resize((224, 224)),
        transforms.ToTensor(),
        transforms.Normalize(mean=[0.485, 0.456, 0.406], std=[0.229, 0.224, 0.225]),
    ])

def get_data_loaders(data_dir, csv_file, batch_size=32, validation_split=0.2, shuffle=True, num_workers=0, pin_memory=False, limit_data=None):
    # Use different transforms for training and validation datasets
    train_transform = get_train_transforms()
    val_transform = get_val_transforms()

    full_dataset = FoodDataset(data_dir, csv_file, transform=None) # Initial dataset without transforms

    if limit_data:
        indices = list(range(len(full_dataset)))
        if limit_data < len(full_dataset) and limit_data < len(full_dataset.labels_df['class_name'].unique()):
            print(f"Warning: limit_data ({limit_data}) is too small for robust stratification ({len(full_dataset.labels_df['class_name'].unique())} classes). Stratification will be skipped.")
            full_dataset_for_split = torch.utils.data.Subset(full_dataset, indices[:limit_data])
            labels_for_stratify = None
        else:
            full_dataset_for_split = torch.utils.data.Subset(full_dataset, indices[:limit_data])
            labels_for_stratify = [full_dataset.labels_df['class_name'].iloc[i] for i in indices[:limit_data]]
    else:
        full_dataset_for_split = full_dataset
        labels_for_stratify = full_dataset.labels_df['class_name']

    train_indices, val_indices = train_test_split(
        range(len(full_dataset_for_split)),
        test_size=validation_split,
        random_state=42, # for reproducibility
        stratify=labels_for_stratify
    )

    # Create separate datasets with appropriate transforms
    train_dataset = FoodDataset(data_dir, csv_file, transform=train_transform)
    val_dataset = FoodDataset(data_dir, csv_file, transform=val_transform)

    # Adjust datasets to use the split indices
    train_subset = torch.utils.data.Subset(train_dataset, train_indices)
    val_subset = torch.utils.data.Subset(val_dataset, val_indices)

    train_loader = torch.utils.data.DataLoader(train_subset, batch_size=batch_size, shuffle=shuffle, num_workers=num_workers, pin_memory=pin_memory)
    val_loader = torch.utils.data.DataLoader(val_subset, batch_size=batch_size, shuffle=False, num_workers=num_workers, pin_memory=pin_memory)

    return train_loader, val_loader
