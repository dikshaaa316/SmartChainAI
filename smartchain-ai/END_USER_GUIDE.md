# SmartChain AI - End User Guide

Welcome to **SmartChain AI**, an advanced supply chain management and route optimization platform. This guide provides an overview of the features and capabilities currently available in the system.

## Overview

SmartChain AI is built to help logistics managers, supply chain operators, and dispatchers monitor shipments, analyze warehouse metrics, and make intelligent routing decisions. It combines modern web interfaces with backend machine learning and graph algorithms to provide actionable insights.

The platform is divided into three main operational areas:
1. **Shipments Management**
2. **Analytics and Monitoring**
3. **Route Optimization**

---

## 1. Shipments Management

The platform allows you to track and manage active shipments in real-time. 

### Key Capabilities:
- **Track Active Deliveries:** View current shipments including their source, destination, estimated time of arrival (ETA), and current geographical coordinates (latitude/longitude).
- **Manage Records:** Operators can add new shipments into the system, update the status or location of existing shipments, and remove completed or canceled shipments.
- **Delay Prediction:** The system integrates a Machine Learning model that predicts potential delays based on shipment data, helping you proactively manage customer expectations.

---

## 2. Analytics and Monitoring (Dashboard)

The Dashboard is your central hub for high-level insights and warehouse monitoring. 

### Key Capabilities:
- **Warehouse Monitoring:** Visualizes inventory levels, capacity, and throughput across different warehouses using interactive bar charts.
- **Performance Metrics:** Quickly assess the health of your supply chain operations through easy-to-read charts and metrics.
- **Data-Driven Decisions:** Real-time data visualization helps managers identify bottlenecks or warehouses that are nearing full capacity.

---

## 3. Route Optimization

One of the standout features of SmartChain AI is the Route Optimizer, which helps dispatchers choose the best path for a shipment across major Indian cities (e.g., Mumbai, Delhi, Bengaluru, Hyderabad).

### Key Capabilities:
- **Smart Graph Routing:** The system maps out highways and distances between major hubs.
- **Risk-Aware Pathfinding:** Instead of just finding the shortest distance, the system factors in "Region Risks" (e.g., weather hazards, traffic congestion, or security risks).
- **Route Comparison:** When you select a Source and Destination city, the system automatically compares two routes:
  - **Route A (Safe Route):** The optimal path that factors in both physical distance and the risk scores of the regions it passes through. 
  - **Route B (Fast Route):** The absolute shortest path based purely on highway distance, ignoring potential risks.
- **Intelligent Recommendations:** The system provides a clear recommendation on which route to take and explains *why* (e.g., "Route A avoids high-risk areas, making it the safer choice despite potentially being longer").

---

## Technical Foundation (For IT/Admin)

While the user interface is simple and intuitive, it is powered by a robust modern tech stack:
- **Frontend:** Built with React and Tailwind CSS for a fast, responsive, and beautiful user experience. Charting is powered by Recharts.
- **Backend:** Powered by Python and FastAPI, ensuring high performance. 
- **Algorithms:** Uses NetworkX and Dijkstra's algorithm for complex supply chain graph calculations.
- **Database:** Uses SQLAlchemy to reliably store and manage shipment and analytics data.
