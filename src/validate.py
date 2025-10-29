import os
import streamlit as st
from PIL import Image
import torch
from src.model import get_model
from src.utils import load_model
from src.data_loader import get_val_transforms
import pandas as pd

st.title("Validate AI Model")

# Load the trained model
num_classes = len(pd.read_csv("data_master/labels.csv")['class_name'].unique())
model = get_model(num_classes)
model = load_model(model, "models/food_classifier.pth")

# Create a mapping from index to class name
labels_df = pd.read_csv(os.path.join(os.getcwd(), "data_master", "labels.csv"))
idx_to_class = {i: class_name for i, class_name in enumerate(labels_df['class_name'].unique())}


# Upload image
uploaded_file = st.file_uploader("Choose an image...", type=["jpg", "jpeg", "png"])

if uploaded_file is not None:
    image = Image.open(uploaded_file).convert("RGB")
    st.image(image, caption='Uploaded Image.', use_column_width=True)
    st.write("")
    st.write("Classifying...")

    # Preprocess the image and make a prediction
    transform = get_val_transforms()
    preprocessed_image = transform(image).unsqueeze(0)
    outputs = model(preprocessed_image)
    probabilities = torch.nn.functional.softmax(outputs, dim=1)
    top_p, top_class = probabilities.topk(5, dim=1)

    _, predicted = torch.max(outputs, 1)
    
    class_name = idx_to_class[predicted.item()]
    
    st.write(f"Prediction: **{class_name}** (Confidence: {probabilities[0][predicted.item()]:.2f})")
    st.write("Top 5 Predictions:")
    for i in range(top_p.size(1)):
        st.write(f"- {idx_to_class[top_class.detach().cpu().numpy()[0][i]]}: {top_p.detach().cpu().numpy()[0][i]:.2f}")

    # Get nutrition info
    nutrition_info = labels_df[labels_df['class_name'] == class_name].iloc[0]

    st.write(f"Calories: {nutrition_info['calories']}")
    st.write(f"Protein: {nutrition_info['protein']}")
    st.write(f"Carbs: {nutrition_info['carbs']}")
    st.write(f"Fats: {nutrition_info['fats']}")
    st.write(f"Portion (g): {nutrition_info['portion_gram']}")
