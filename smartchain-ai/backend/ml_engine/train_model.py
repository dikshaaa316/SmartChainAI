# ML Engine: Training Script
# Generates synthetic data and trains a Random Forest model

import numpy as np
import pandas as pd
from sklearn.ensemble import RandomForestClassifier
from sklearn.model_selection import train_test_split
from sklearn.metrics import accuracy_score, precision_score, recall_score, f1_score
import joblib
import os

# Step 1 - Generate synthetic data
np.random.seed(42)
n = 8000

distance = np.random.uniform(100, 3000, n)
weather_score = np.random.uniform(0, 100, n)
traffic_score = np.random.uniform(0, 100, n)
warehouse_load = np.random.uniform(0, 100, n)

# Calculate risk score
risk = (weather_score * 0.3) + (traffic_score * 0.4) + (warehouse_load * 0.3)

# Generate delay labels based on risk logic
delay = []
for i in range(n):
    if risk[i] > 55 and distance[i] > 800:
        delay.append(np.random.choice([1, 0], p=[0.85, 0.15]))
    elif risk[i] > 40:
        delay.append(np.random.choice([1, 0], p=[0.50, 0.50]))
    else:
        delay.append(np.random.choice([1, 0], p=[0.10, 0.90]))

# Step 2 - Create DataFrame
df = pd.DataFrame({
    'distance': distance,
    'weather_score': weather_score,
    'traffic_score': traffic_score,
    'warehouse_load': warehouse_load,
    'delay': delay
})

print(f"Dataset created: {len(df)} rows")
print(f"Delay distribution: {df['delay'].value_counts().to_dict()}")

# Step 3 - Train/test split
X = df[['distance', 'weather_score', 'traffic_score', 'warehouse_load']]
y = df['delay']
X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)

# Step 4 - Train Random Forest
model = RandomForestClassifier(n_estimators=100, random_state=42)
model.fit(X_train, y_train)

# Step 5 - Evaluate
y_pred = model.predict(X_test)
print(f"\nModel Performance:")
print(f"Accuracy:  {accuracy_score(y_test, y_pred):.4f}")
print(f"Precision: {precision_score(y_test, y_pred):.4f}")
print(f"Recall:    {recall_score(y_test, y_pred):.4f}")
print(f"F1 Score:  {f1_score(y_test, y_pred):.4f}")

# Feature importances
print(f"\nFeature Importances:")
for feat, imp in zip(X.columns, model.feature_importances_):
    print(f"  {feat}: {imp:.4f}")

# Step 6 - Save model
os.makedirs('ml_engine', exist_ok=True)
joblib.dump(model, 'ml_engine/delay_model.pkl')
print("\nModel saved successfully to ml_engine/delay_model.pkl")