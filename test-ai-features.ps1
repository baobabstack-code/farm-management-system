# Test AI Features
Write-Host "🧪 Testing AI Features..." -ForegroundColor Green

# Test Analytics API
Write-Host "
1️⃣ Testing AI Analytics..." -ForegroundColor Yellow
try {
    $response = Invoke-RestMethod -Uri "http://localhost:3001/api/ai/analytics" -Method POST -ContentType "application/json" -Body '{"analysisType": "farm_summary"}' -ErrorAction Stop
    Write-Host "   ✅ AI Analytics: Working" -ForegroundColor Green
} catch {
    Write-Host "   ❌ AI Analytics: $($_.Exception.Message)" -ForegroundColor Red
}

# Test Crop Recommendations
Write-Host "
2️⃣ Testing AI Crop Recommendations..." -ForegroundColor Yellow
try {
    $body = @{
        location = "California"
        soilType = "loamy"
        climate = "mediterranean"
        season = "spring"
        budget = 5000
        experience = "intermediate"
    } | ConvertTo-Json
    
    $response = Invoke-RestMethod -Uri "http://localhost:3001/api/ai/crop-recommendations" -Method POST -ContentType "application/json" -Body $body -ErrorAction Stop
    Write-Host "   ✅ AI Crop Recommendations: Working" -ForegroundColor Green
} catch {
    Write-Host "   ❌ AI Crop Recommendations: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host "
🎯 AI Features Test Complete!" -ForegroundColor Green
