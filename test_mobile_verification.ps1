# Test script for TOTP Alternative Mobile Verification
# This script tests the mobile verification requirement for SMS OTP

$baseUrl = "http://localhost:8080"

Write-Host "================================" -ForegroundColor Cyan
Write-Host "TOTP Alternative SMS Test Script" -ForegroundColor Cyan
Write-Host "================================" -ForegroundColor Cyan
Write-Host ""

# Test Case 1: User with no phone number
Write-Host "Test 1: User with no phone number" -ForegroundColor Yellow
Write-Host "Expected: Error - Phone number is not registered" -ForegroundColor Gray
Write-Host ""

$body1 = @{
    method = "SMS"
    tempToken = "YOUR_TEMP_TOKEN_FOR_USER_WITHOUT_PHONE"
} | ConvertTo-Json

Write-Host "Request:" -ForegroundColor Green
Write-Host $body1
Write-Host ""

try {
    $response1 = Invoke-RestMethod -Uri "$baseUrl/api/v1/auth/totp-alternative/send" `
        -Method Post `
        -ContentType "application/json" `
        -Body $body1 `
        -ErrorAction Stop
    
    Write-Host "Response:" -ForegroundColor Green
    Write-Host ($response1 | ConvertTo-Json -Depth 10)
} catch {
    $errorResponse = $_.ErrorDetails.Message | ConvertFrom-Json
    Write-Host "Error Response (Expected):" -ForegroundColor Red
    Write-Host "Status Code: $($_.Exception.Response.StatusCode.value__)"
    Write-Host "Message: $($errorResponse.message)"
}

Write-Host ""
Write-Host "================================" -ForegroundColor Cyan
Write-Host ""

# Test Case 2: User with unverified phone number
Write-Host "Test 2: User with unverified phone number" -ForegroundColor Yellow
Write-Host "Expected: Error - Phone number is not verified" -ForegroundColor Gray
Write-Host ""

$body2 = @{
    method = "SMS"
    tempToken = "YOUR_TEMP_TOKEN_FOR_USER_WITH_UNVERIFIED_PHONE"
} | ConvertTo-Json

Write-Host "Request:" -ForegroundColor Green
Write-Host $body2
Write-Host ""

try {
    $response2 = Invoke-RestMethod -Uri "$baseUrl/api/v1/auth/totp-alternative/send" `
        -Method Post `
        -ContentType "application/json" `
        -Body $body2 `
        -ErrorAction Stop
    
    Write-Host "Response:" -ForegroundColor Green
    Write-Host ($response2 | ConvertTo-Json -Depth 10)
} catch {
    $errorResponse = $_.ErrorDetails.Message | ConvertFrom-Json
    Write-Host "Error Response (Expected):" -ForegroundColor Red
    Write-Host "Status Code: $($_.Exception.Response.StatusCode.value__)"
    Write-Host "Message: $($errorResponse.message)"
}

Write-Host ""
Write-Host "================================" -ForegroundColor Cyan
Write-Host ""

# Test Case 3: User with verified phone number
Write-Host "Test 3: User with verified phone number" -ForegroundColor Yellow
Write-Host "Expected: Success - OTP sent" -ForegroundColor Gray
Write-Host ""

$body3 = @{
    method = "SMS"
    tempToken = "YOUR_TEMP_TOKEN_FOR_USER_WITH_VERIFIED_PHONE"
} | ConvertTo-Json

Write-Host "Request:" -ForegroundColor Green
Write-Host $body3
Write-Host ""

try {
    $response3 = Invoke-RestMethod -Uri "$baseUrl/api/v1/auth/totp-alternative/send" `
        -Method Post `
        -ContentType "application/json" `
        -Body $body3 `
        -ErrorAction Stop
    
    Write-Host "Response (Success):" -ForegroundColor Green
    Write-Host ($response3 | ConvertTo-Json -Depth 10)
} catch {
    $errorResponse = $_.ErrorDetails.Message | ConvertFrom-Json
    Write-Host "Error Response:" -ForegroundColor Red
    Write-Host "Status Code: $($_.Exception.Response.StatusCode.value__)"
    Write-Host "Message: $($errorResponse.message)"
}

Write-Host ""
Write-Host "================================" -ForegroundColor Cyan
Write-Host "Test Complete" -ForegroundColor Cyan
Write-Host "================================" -ForegroundColor Cyan
