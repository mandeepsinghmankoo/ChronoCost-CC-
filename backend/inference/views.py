# inference/views.py
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
import pandas as pd
import numpy as np
from sklearn.ensemble import RandomForestRegressor
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import LabelEncoder
import json
import warnings
warnings.filterwarnings('ignore')

class CompanyDataPredictor:
    def _init_(self):
        self.company_models = {}
        self.company_data = {}
        self.company_analysis = {}
    
    def load_company_dataset(self, file_path, company_name):
        """Load and analyze company's historical dataset"""
        print(f"📊 Loading dataset for {company_name}...")
        
        try:
            # Load CSV file
            df = pd.read_csv(file_path)
            print(f"✅ Dataset loaded: {df.shape[0]} projects, {df.shape[1]} features")
            
            # Store company data
            self.company_data[company_name] = df
            self.company_analysis[company_name] = self.analyze_company_data(df, company_name)
            
            # Train model immediately
            self.train_company_model(company_name)
            
            return True
            
        except Exception as e:
            print(f"❌ Error loading dataset: {e}")
            return False
    
    def analyze_company_data(self, df, company_name):
        """Analyze company's historical performance"""
        analysis = {}
        
        # Basic statistics
        analysis['total_projects'] = len(df)
        analysis['avg_project_cost'] = df['final_project_cost'].mean() if 'final_project_cost' in df.columns else 0
        analysis['avg_duration'] = df['project_duration'].mean() if 'project_duration' in df.columns else 0
        analysis['success_rate'] = self.calculate_success_rate(df)
        
        # Risk analysis
        if 'delays' in df.columns:
            analysis['avg_delays'] = df['delays'].mean()
        if 'rework_percent' in df.columns:
            analysis['avg_rework'] = df['rework_percent'].mean()
        
        # Project type analysis
        if 'project_type' in df.columns:
            analysis['project_types'] = df['project_type'].value_counts().to_dict()
        
        print(f"📈 Company Analysis Complete:")
        print(f"   • Projects: {analysis['total_projects']}")
        print(f"   • Avg Cost: ₹{analysis['avg_project_cost']:,.2f}")
        print(f"   • Success Rate: {analysis['success_rate']:.1f}%")
        
        return analysis
    
    def calculate_success_rate(self, df):
        """Calculate project success rate"""
        if 'final_project_cost' not in df.columns:
            return 0
        
        estimated_cost = df['labor_cost'] + df['material_cost'] + df.get('equipment_cost', 0) + df.get('overhead_cost', 0)
        cost_variance = abs(df['final_project_cost'] - estimated_cost) / estimated_cost
        success_rate = (cost_variance <= 0.15).mean() * 100
        
        return success_rate
    
    def train_company_model(self, company_name):
        """Train AI model on company's historical data"""
        if company_name not in self.company_data:
            print(f"❌ No data found for {company_name}")
            return None
        
        df = self.company_data[company_name]
        
        # Prepare features
        X = self.prepare_features(df)
        y = df['final_project_cost']
        
        # Train model
        X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)
        
        model = RandomForestRegressor(n_estimators=100, random_state=42, n_jobs=-1)
        model.fit(X_train, y_train)
        
        # Evaluate
        train_score = model.score(X_train, y_train)
        test_score = model.score(X_test, y_test)
        
        self.company_models[company_name] = {
            'model': model,
            'features': list(X.columns),
            'train_score': train_score,
            'test_score': test_score
        }
        
        print(f"✅ AI Model trained for {company_name}")
        print(f"   Model Accuracy: {test_score:.3f}")
        
        return model
    
    def prepare_features(self, df):
        """Prepare features for training"""
        # Select available features
        feature_columns = []
        possible_features = [
            'project_size', 'project_duration', 'labor_cost', 'material_cost', 
            'equipment_cost', 'overhead_cost', 'inflation_rate', 'region', 
            'year', 'delays', 'rework_percent', 'safety_incidents', 'project_type'
        ]
        
        for feature in possible_features:
            if feature in df.columns:
                feature_columns.append(feature)
        
        X = df[feature_columns].copy()
        
        # Encode categorical variables
        for col in X.select_dtypes(include=['object']).columns:
            le = LabelEncoder()
            X[col] = le.fit_transform(X[col].astype(str))
        
        return X
    
    def predict_with_company_data(self, company_name, project_data):
        """Predict project cost using company's historical data"""
        if company_name not in self.company_models:
            print(f"❌ No model found for {company_name}. Training now...")
            self.train_company_model(company_name)
        
        if company_name not in self.company_models:
            return None
        
        model_info = self.company_models[company_name]
        model = model_info['model']
        expected_features = model_info['features']
        
        # Prepare input data
        input_df = pd.DataFrame([project_data])
        
        # Ensure all expected features are present
        for feature in expected_features:
            if feature not in input_df.columns:
                # Add missing features with default values
                if feature in ['labor_cost', 'material_cost', 'equipment_cost', 'overhead_cost']:
                    input_df[feature] = 0
                elif feature == 'project_type':
                    input_df[feature] = 'Unknown'
                elif feature == 'region':
                    input_df[feature] = 'Unknown'
                else:
                    input_df[feature] = 0
        
        # Reorder columns to match training
        input_df = input_df[expected_features]
        
        # Encode categorical variables
        for col in input_df.select_dtypes(include=['object']).columns:
            if col in input_df.columns:
                input_df[col] = input_df[col].astype('category').cat.codes
        
        # Make prediction
        predicted_cost = model.predict(input_df)[0]
        
        return predicted_cost
    
    def get_company_insights(self, company_name, project_data, predicted_cost):
        """Get insights based on company's historical performance"""
        if company_name not in self.company_analysis:
            return []
        
        analysis = self.company_analysis[company_name]
        insights = []
        
        # Size comparison
        avg_cost = analysis['avg_project_cost']
        if predicted_cost > avg_cost * 1.3:
            insights.append("📈 This project is larger than your company's average")
        elif predicted_cost < avg_cost * 0.7:
            insights.append("📉 This project is smaller than your typical projects")
        else:
            insights.append("📊 Project size matches your company's typical projects")
        
        # Success rate insight
        insights.append(f"🎯 Your company's historical success rate: {analysis['success_rate']:.1f}%")
        
        # Risk insights
        if 'avg_delays' in analysis and project_data.get('delays', 0) > analysis['avg_delays']:
            insights.append("⏰ Higher delays than your average - plan extra buffer time")
        
        if 'avg_rework' in analysis and project_data.get('rework_percent', 0) > analysis['avg_rework']:
            insights.append("🔧 Higher rework risk than usual - strengthen quality control")
        
        return insights

    def simulate_scenarios_manual(self, company_name, project_data):
        """Manual scenario calculations when AI model is unresponsive"""
        print("\n🧪 MANUAL SCENARIO ANALYSIS (AI Model Bypass)")
        
        base_cost = (project_data.get('labor_cost', 0) + 
                    project_data.get('material_cost', 0) + 
                    project_data.get('equipment_cost', 0) + 
                    project_data.get('overhead_cost', 0))
        
        # Get company's average cost patterns from analysis
        company_analysis = self.company_analysis.get(company_name, {})
        avg_cost_overrun = company_analysis.get('cost_performance', {}).get('avg_cost_overrun', 10)  # Default 10%
        
        # Manual scenario calculations based on industry standards
        scenarios = []
        
        # Scenario 1: Labor cost increase
        labor_increase = project_data.get('labor_cost', 0) * 0.10
        scenario1_cost = base_cost + labor_increase
        scenarios.append({
            "name": "Labor +10%",
            "cost": scenario1_cost,
            "difference": scenario1_cost - base_cost,
            "percent_change": ((scenario1_cost / base_cost) - 1) * 100 if base_cost != 0 else 0
        })
        
        # Scenario 2: Equipment delay impact
        delay_days = 7
        delay_cost = base_cost * (delay_days * 0.002)  # 0.2% per day delay
        equipment_increase = project_data.get('equipment_cost', 0) * 0.08
        scenario2_cost = base_cost + delay_cost + equipment_increase
        scenarios.append({
            "name": "Equipment Delay (7 days)",
            "cost": scenario2_cost,
            "difference": scenario2_cost - base_cost,
            "percent_change": ((scenario2_cost / base_cost) - 1) * 100 if base_cost != 0 else 0
        })
        
        # Scenario 3: Weather delay impact  
        delay_days = 14
        delay_cost = base_cost * (delay_days * 0.002)  # 0.2% per day delay
        labor_increase = project_data.get('labor_cost', 0) * 0.12
        scenario3_cost = base_cost + delay_cost + labor_increase
        scenarios.append({
            "name": "Weather Delay (14 days)",
            "cost": scenario3_cost,
            "difference": scenario3_cost - base_cost,
            "percent_change": ((scenario3_cost / base_cost) - 1) * 100 if base_cost != 0 else 0
        })
        
        # Scenario 4: Material price increase
        material_increase = project_data.get('material_cost', 0) * 0.15
        scenario4_cost = base_cost + material_increase
        scenarios.append({
            "name": "Material Price +15%",
            "cost": scenario4_cost,
            "difference": scenario4_cost - base_cost,
            "percent_change": ((scenario4_cost / base_cost) - 1) * 100 if base_cost != 0 else 0
        })
        
        # Find worst-case scenario
        max_increase = max(scenario['difference'] for scenario in scenarios)
        worst_scenario = next(scenario for scenario in scenarios if scenario['difference'] == max_increase)
        
        # Apply company's historical risk pattern
        risk_adjusted_contingency = max_increase * (1 + avg_cost_overrun/100)
        
        return {
            "baseline_cost": base_cost,
            "scenarios": scenarios,
            "worst_case_scenario": worst_scenario["name"],
            "max_increase": max_increase,
            "risk_adjusted_contingency": risk_adjusted_contingency,
            "total_recommended_budget": base_cost + risk_adjusted_contingency
        }

    def simulate_scenarios(self, company_name, project_data):
        """Compatibility wrapper to run scenario analysis"""
        return self.simulate_scenarios_manual(company_name, project_data)

# Initialize the predictor globally
predictor = CompanyDataPredictor()

@csrf_exempt
def health_check(request):
    """Health check endpoint"""
    return JsonResponse({
        'status': 'healthy',
        'service': 'AI Project Cost Advisor with Company Data',
        'message': 'Service is running correctly',
        'loaded_companies': list(predictor.company_models.keys())
    })

@csrf_exempt
@csrf_exempt
def predict_cost(request):
    """Predict project cost using company data"""
    if request.method == 'POST':
        try:
            data = json.loads(request.body)
            
            # Validate required fields
            required_fields = ['project_type', 'project_size', 'project_duration', 
                             'labor_cost', 'material_cost', 'equipment_cost', 'overhead_cost',
                             'region', 'year']
            
            missing_fields = [field for field in required_fields if field not in data]
            if missing_fields:
                return JsonResponse({
                    'error': f'Missing required fields: {", ".join(missing_fields)}'
                }, status=400)
            
            # Get company name from request or use default
            company_name = data.get('company_name', 'Default Company')
            
            # Check if company has historical data loaded
            if company_name not in predictor.company_models:
                # Use a fallback prediction method
                predicted_cost = fallback_prediction(data)
                insights = ["ℹ Using general industry data for prediction"]
            else:
                # Use company-specific model
                predicted_cost = predictor.predict_with_company_data(company_name, data)
                insights = predictor.get_company_insights(company_name, data, predicted_cost)
            
            if predicted_cost is None:
                return JsonResponse({
                    'error': 'Prediction failed. No model available.'
                }, status=500)
            
            # Calculate base cost and analysis
            base_cost = (data['labor_cost'] + data['material_cost'] + 
                        data['equipment_cost'] + data['overhead_cost'])
            risk_adjustment = predicted_cost - base_cost
            contingency_percent = (risk_adjustment / base_cost) * 100 if base_cost else 0
            
            # Identify high risk areas
            high_risk_areas = []
            if data.get('delays', 0) > 7:
                high_risk_areas.append('timeline')
            if data.get('rework_percent', 0) > 4:
                high_risk_areas.append('quality')
            if data.get('safety_incidents', 0) > 1:
                high_risk_areas.append('safety')
            if contingency_percent > 15:
                high_risk_areas.append('budget')
            
            # Generate recommendations
            recommendations = generate_recommendations(contingency_percent, high_risk_areas)
            
            response_data = {
                'success': True,
                'company_used': company_name,
                'prediction': {
                    'predicted_cost': float(predicted_cost),
                    'base_cost': float(base_cost),
                    'risk_adjustment': float(risk_adjustment),
                    'contingency_percent': float(contingency_percent),
                    'high_risk_areas': high_risk_areas
                },
                'company_insights': insights,
                'recommendations': recommendations
            }
            
            return JsonResponse(response_data)
            
        except Exception as e:
            return JsonResponse({
                'error': f'Prediction failed: {str(e)}'
            }, status=500)
    else:
        return JsonResponse({'error': 'Method not allowed. Use POST.'}, status=405)

@csrf_exempt
def scenario_analysis(request):
    """Run scenario analysis"""
    if request.method == 'POST':
        try:
            data = json.loads(request.body)
            
            company_name = data.get('company_name', 'Default Company')
            
            # Run scenario analysis
            scenario_result = predictor.simulate_scenarios(company_name, data)
            
            return JsonResponse({
                'success': True,
                'scenario_analysis': scenario_result
            })
            
        except Exception as e:
            return JsonResponse({
                'error': f'Scenario analysis failed: {str(e)}'
            }, status=500)
    else:
        return JsonResponse({'error': 'Method not allowed. Use POST.'}, status=405)

@csrf_exempt
def upload_company_data(request):
    """Upload company historical data"""
    if request.method == 'POST':
        try:
            if 'file' not in request.FILES:
                return JsonResponse({'error': 'No file uploaded'}, status=400)
            
            file = request.FILES['file']
            company_name = request.POST.get('company_name', 'Unknown Company')
            
            # Save uploaded file temporarily
            import tempfile
            import os
            
            with tempfile.NamedTemporaryFile(delete=False, suffix='.csv') as temp_file:
                for chunk in file.chunks():
                    temp_file.write(chunk)
                temp_path = temp_file.name
            
            # Load company data
            success = predictor.load_company_dataset(temp_path, company_name)
            
            # Clean up temporary file
            os.unlink(temp_path)
            
            if success:
                return JsonResponse({
                    'success': True,
                    'message': f'Company data loaded successfully for {company_name}',
                    'company_name': company_name,
                    'projects_loaded': predictor.company_analysis[company_name]['total_projects']
                })
            else:
                return JsonResponse({
                    'error': 'Failed to load company data'
                }, status=500)
                
        except Exception as e:
            return JsonResponse({
                'error': f'File upload failed: {str(e)}'
            }, status=500)
    else:
        return JsonResponse({'error': 'Method not allowed. Use POST.'}, status=405)

@csrf_exempt
def get_company_info(request):
    """Get information about loaded companies"""
    if request.method == 'GET':
        company_info = {}
        
        for company_name, analysis in predictor.company_analysis.items():
            company_info[company_name] = {
                'total_projects': analysis['total_projects'],
                'avg_project_cost': analysis['avg_project_cost'],
                'avg_duration': analysis['avg_duration'],
                'success_rate': analysis['success_rate']
            }
        
        return JsonResponse({
            'success': True,
            'companies': company_info
        })
    else:
        return JsonResponse({'error': 'Method not allowed. Use GET.'}, status=405)

# Helper functions
def fallback_prediction(project_data):
    """Fallback prediction when no company data is available"""
    base_cost = (project_data['labor_cost'] + project_data['material_cost'] + 
                project_data['equipment_cost'] + project_data['overhead_cost'])
    
    # Simple risk calculation
    risk_multiplier = 1.0
    risk_multiplier += project_data.get('delays', 0) * 0.015
    risk_multiplier += project_data.get('rework_percent', 0) * 0.025
    risk_multiplier += project_data.get('safety_incidents', 0) * 0.04
    risk_multiplier += project_data.get('inflation_rate', 0) * 0.01
    
    return base_cost * risk_multiplier

def generate_recommendations(contingency_percent, high_risk_areas):
    """Generate recommendations based on risk analysis"""
    recommendations = []
    
    if contingency_percent > 20:
        recommendations.extend([
            "🚨 HIGH RISK PROJECT - Consider:",
            "• Increase contingency budget to 25%",
            "• Review project scope and timeline",
            "• Implement stronger risk mitigation",
            "• Consider phased delivery approach"
        ])
    elif contingency_percent > 12:
        recommendations.extend([
            "⚠ MEDIUM RISK PROJECT - Suggestions:",
            "• Maintain 15% contingency budget",
            "• Monitor risks closely",
            "• Regular progress reviews"
        ])
    else:
        recommendations.extend([
            "✅ LOW RISK PROJECT - Good to go!",
            "• Standard 10% contingency sufficient",
            "• Maintain current risk management"
        ])
    
    # Specific recommendations based on high risk areas
    if 'timeline' in high_risk_areas:
        recommendations.append("⏰ Focus on timeline management and buffer planning")
    if 'quality' in high_risk_areas:
        recommendations.append("🔧 Improve quality control processes")
    if 'safety' in high_risk_areas:
        recommendations.append("🛡 Enhance safety protocols and training")
    if 'budget' in high_risk_areas:
        recommendations.append("💰 Strengthen budget controls and monitoring")
    
    return recommendations