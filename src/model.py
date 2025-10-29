import torch
import torch.nn as nn
from torchvision import models

def get_model(num_classes, unfreeze_blocks=0):
    # Load a pretrained EfficientNet model
    model = models.efficientnet_b4(weights=models.EfficientNet_B4_Weights.DEFAULT)

    # Freeze all the parameters in the feature extraction part of the model initially
    for param in model.parameters():
        param.requires_grad = False

    # Unfreeze specified number of last blocks in the features extractor
    # model.features is a Sequential module, typically with 9 blocks (0-8)
    if unfreeze_blocks > 0:
        # Iterate from the end of the features blocks
        for i in range(1, unfreeze_blocks + 1):
            if i <= len(model.features): # Ensure we don't go out of bounds
                for param in model.features[-i].parameters():
                    param.requires_grad = True
            else:
                print(f"Warning: Tried to unfreeze {unfreeze_blocks} blocks, but model only has {len(model.features)} feature blocks.")
                break

    # Replace the classifier with a new one for our specific number of classes
    num_ftrs = model.classifier[1].in_features
    model.classifier[1] = nn.Linear(num_ftrs, num_classes)
    # Ensure the new classifier layers are trainable
    for param in model.classifier.parameters():
        param.requires_grad = True

    return model
