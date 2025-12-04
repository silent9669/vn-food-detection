import torch

def save_model(model, path):
    torch.save(model.state_dict(), path)

def load_model(model, path, device=None):
    """
    Load model from checkpoint.

    Args:
        model: The model instance to load weights into
        path: Path to the checkpoint file
        device: Device to load the model on ('cuda' or 'cpu'). If None, uses current device.

    Returns:
        model: Loaded model in eval mode
    """
    if device is None:
        # If no device specified, try to infer from model
        device = next(model.parameters()).device if len(list(model.parameters())) > 0 else torch.device('cpu')

    # Convert string device to torch.device if needed
    if isinstance(device, str):
        device = torch.device(device)

    # Load checkpoint with map_location to handle CPU/GPU compatibility
    checkpoint = torch.load(path, map_location=device)
    model.load_state_dict(checkpoint)

    # Move model to specified device
    model = model.to(device)
    model.eval()

    return model
