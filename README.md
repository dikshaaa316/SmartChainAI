# SmartChain AI

SmartChain AI is a supply chain and shipment tracking dashboard with ML-based delay prediction and route optimization. Built to explore how graph algorithms and machine learning can work together to make logistics decisions smarter than simple shortest-path routing.

## Features

- **Shipment CRUD**: Create, view, update, and delete shipments.
- **Auto-calculated ETA & ML Delay Prediction**: Automatic estimation of arrival times and ML-based delay probability prediction upon shipment creation.
- **Regional Risk Heatmap**: Displays weather, traffic, and warehouse load risk scores as a color-coded heatmap on a live interactive map.
- **Warehouse Utilization Monitoring**: Tracks warehouse capacities and raises automatic alerts if utilization exceeds 90%.
- **Route Optimization**: Visualizes city-to-city routes using Dijkstra's shortest path algorithm, dynamically factoring in regional risks.
- **Interactive Dashboard**: Features live statistics and visualization components powered by Recharts.

## Tech Stack

### Backend
- **Framework**: FastAPI
- **Database ORM**: SQLAlchemy
- **Database**: PostgreSQL (via `psycopg2-binary`)
- **Validation**: Pydantic
- **Machine Learning**: Scikit-learn (Random Forest), Joblib
- **Graph/Routing Algorithms**: NetworkX
- **Data Analysis**: Pandas, NumPy

### Frontend
- **Framework**: React, Vite
- **Styling**: Tailwind CSS
- **Interactive Maps**: Leaflet
- **Visualizations**: Recharts
- **HTTP Client**: Axios
- **Routing**: React Router

## Project Structure

```text
smartchain-ai/
├── backend/                  # FastAPI backend containing database models, schemas, and API logic
│   ├── core/                 # Core engine logic (alerts, risk scoring, route optimization, ETA engine)
│   ├── ml_engine/             # Machine learning files for delay prediction, including model training scripts
│   └── routers/               # FastAPI router endpoints for analytics, routing, and shipments
└── frontend/                  # React frontend built with Vite and Tailwind CSS
    ├── public/                # Public assets and static files
    └── src/                   # React source files (components, pages, services, custom map components)
```

## Setup Instructions — Backend

Follow these steps to set up and run the FastAPI backend:

1. **Navigate to the backend directory**:
   ```bash
   cd backend
   ```

2. **Create a virtual environment**:
   ```bash
   python -m venv venv
   ```

3. **Activate the virtual environment**:
   - **On Windows (Command Prompt)**:
     ```cmd
     venv\Scripts\activate
     ```
   - **On Windows (PowerShell)**:
     ```powershell
     .\venv\Scripts\Activate.ps1
     ```
   - **On macOS/Linux**:
     ```bash
     source venv/bin/activate
     ```

4. **Install dependencies**:
   ```bash
   pip install -r requirements.txt
   ```

5. **Set up PostgreSQL and create the database**:
   - Ensure you have PostgreSQL installed and running on your system.
   - Connect to your PostgreSQL instance and create a new database named `smartchain_db`.

6. **Set the DATABASE_URL environment variable**:
   Set `DATABASE_URL` pointing to your PostgreSQL instance. You can either configure this as an environment variable in your terminal, or create a `.env` file in the root of the `backend` folder.

   *Example environment variable setup:*
   - **On Windows (Command Prompt)**:
     ```cmd
     set DATABASE_URL=postgresql://username:password@localhost:5432/smartchain_db
     ```
   - **On Windows (PowerShell)**:
     ```powershell
     $env:DATABASE_URL="postgresql://username:password@localhost:5432/smartchain_db"
     ```
   - **On macOS/Linux**:
     ```bash
     export DATABASE_URL="postgresql://username:password@localhost:5432/smartchain_db"
     ```

   *Alternatively, create a `backend/.env` file:*
   ```env
   DATABASE_URL=postgresql://username:password@localhost:5432/smartchain_db
   ```

   > **Note:** Never commit a real `.env` file with actual credentials. Add `.env` to your `.gitignore` before pushing.

7. **Train the ML model**:
   Before starting the backend, you must train and serialize the delay prediction model:
   ```bash
   python ml_engine/train_model.py
   ```

8. **Run the server**:
   Start the FastAPI application using Uvicorn:
   ```bash
   uvicorn main:app --reload
   ```

## Setup Instructions — Frontend

Follow these steps to set up and run the React frontend:

1. **Navigate to the frontend directory**:
   ```bash
   cd frontend
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Run the development server**:
   ```bash
   npm run dev
   ```
   The frontend application will be running at `http://localhost:5173`.

## Seeding Initial Data

Once both the backend and frontend are running, you must populate the database with initial regional and warehouse data. You should trigger the following two seed endpoints **once** using the interactive API documentation:

- `POST /analytics/regions/seed` — Seeds geographical regional configurations and risk metrics.
- `POST /analytics/warehouses/seed` — Seeds default warehouse entities and starting capacities.

You can invoke these endpoints easily by visiting the Swagger UI documentation at `http://localhost:8000/docs`.

## API Documentation

Full interactive API documentation is automatically generated by FastAPI and is accessible at:
- Swagger UI: `http://localhost:8000/docs`
- ReDoc: `http://localhost:8000/redoc`

## Machine Learning Model

The shipment delay prediction engine uses a **Random Forest Classifier** trained on synthetic shipping historical records. It evaluates the following variables:
- `distance` (Trip distance)
- `weather_score` (Regional weather hazard multiplier)
- `traffic_score` (Regional traffic congestion index)
- `warehouse_load` (Destination warehouse capacity load)

The trained model is stored as a pickle file at `ml_engine/delay_model.pkl` and is automatically loaded into the FastAPI application state on server startup to handle real-time prediction requests.

## License

This project is licensed under the [MIT License](LICENSE) — feel free to use, modify, and learn from it.
