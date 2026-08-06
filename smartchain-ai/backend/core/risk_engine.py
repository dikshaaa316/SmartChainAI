class RiskEngine:
    @staticmethod
    def calculate_risk(weather_score, traffic_score, warehouse_score):
        return (weather_score * 0.3) + (traffic_score * 0.4) + (warehouse_score * 0.3)

    @staticmethod
    def get_risk_level(risk_score):
        if risk_score < 40:
            return "Low"
        elif risk_score <= 70:
            return "Medium"
        return "High"

    @staticmethod
    def get_risk_color(risk_score):
        if risk_score < 40:
            return "green"
        elif risk_score <= 70:
            return "yellow"
        return "red"