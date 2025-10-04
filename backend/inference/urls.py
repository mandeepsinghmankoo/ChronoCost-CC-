# inference/urls.py
from django.urls import path
from . import views

urlpatterns = [
    path('health/', views.health_check, name='health_check'),
    path('predict/', views.predict_cost, name='predict_cost'),  # Make sure this exists
    path('scenarios/', views.scenario_analysis, name='scenario_analysis'),
]