# Test script to verify login error handling
# Make sure the backend is running on http://localhost:8080

$BASE_URL = "http://localhost:8080/api/v1"

# Colors for output
$GREEN = "Green"
$RED = "Red"
$YELLOW = "Yellow"
$BLUE = "Cyan"

Write-Host "`n=== LOGIN ERROR HANDLING TESTS ===" -ForegroundColor $YELLOW
Write-Host "Testing login error responses..." -ForegroundColor $BLUE
Write-Host ""

# First, let's verify we can connect to the backend
Write-Host "Checking backend connectivity..." -ForegroundColor $BLUE
try {
    $health = Invoke-WebRequest -Uri "http://localhost:8080/actuator/health" -ErrorAction Stop
    Write-Host "✓ Backend is running" -ForegroundColor $GREEN
} catch {
    Write-Host "✗ Backend is not running at http://localhost:8080" -ForegroundColor $RED
    Write-Host "Please start the backend before running tests" -ForegroundColor $RED
    exit 1
}

Write-Host ""

# Test 1: Wrong Password (using admin user with wrong password)
Write-Host "TEST 1: Login with WRONG PASSWORD" -ForegroundColor $YELLOW
$body1 = @{
    email = "admin@zohocorp.com"
    password = "wrongpassword123"
} | ConvertTo-Json

Write-Host "Request: POST $BASE_URL/auth/login" -ForegroundColor $BLUE
Write-Host "Email: admin@zohocorp.com" -ForegroundColor $BLUE
Write-Host "Password: wrongpassword123 (incorrect)" -ForegroundColor $BLUE

try {
    $response1 = Invoke-WebRequest -Uri "$BASE_URL/auth/login" `
        -Method POST `
        -Headers @{"Content-Type" = "application/json"} `
        -Body $body1 `
        -ErrorAction Stop
    Write-Host "✗ UNEXPECTED: Got 200 status (should be 401)" -ForegroundColor $RED
} catch {
    $statusCode = $_.Exception.Response.StatusCode.value__
    try {
        $errorResponse = $_.Exception.Response.Content.ToString() | ConvertFrom-Json
        $message = $errorResponse.message
    } catch {
        $message = $_.Exception.Response.Content.ToString()
    }
    
    if ($statusCode -eq 401) {
        Write-Host "✓ Status Code: $statusCode (CORRECT)" -ForegroundColor $GREEN
        Write-Host "✓ Error Message: $message" -ForegroundColor $GREEN
    } else {
        Write-Host "✗ Status Code: $statusCode (WRONG, expected 401)" -ForegroundColor $RED
        Write-Host "Response: $message" -ForegroundColor $RED
    }
}

Write-Host ""

# Test 2: Non-existent Email
Write-Host "TEST 2: Login with NON-EXISTENT EMAIL" -ForegroundColor $YELLOW
$body2 = @{
    email = "nonexistent.user.12345@example.com"
    password = "password123"
} | ConvertTo-Json

Write-Host "Request: POST $BASE_URL/auth/login" -ForegroundColor $BLUE
Write-Host "Email: nonexistent.user.12345@example.com (does not exist)" -ForegroundColor $BLUE
Write-Host "Password: password123" -ForegroundColor $BLUE

try {
    $response2 = Invoke-WebRequest -Uri "$BASE_URL/auth/login" `
        -Method POST `
        -Headers @{"Content-Type" = "application/json"} `
        -Body $body2 `
        -ErrorAction Stop
    Write-Host "✗ UNEXPECTED: Got 200 status (should be 401)" -ForegroundColor $RED
} catch {
    $statusCode = $_.Exception.Response.StatusCode.value__
    try {
        $errorResponse = $_.Exception.Response.Content.ToString() | ConvertFrom-Json
        $message = $errorResponse.message
    } catch {
        $message = $_.Exception.Response.Content.ToString()
    }
    
    if ($statusCode -eq 401) {
        Write-Host "✓ Status Code: $statusCode (CORRECT)" -ForegroundColor $GREEN
        Write-Host "✓ Error Message: $message" -ForegroundColor $GREEN
    } else {
        Write-Host "✗ Status Code: $statusCode (WRONG, expected 401)" -ForegroundColor $RED
        Write-Host "Response: $message" -ForegroundColor $RED
    }
}

Write-Host ""

# Test 3: Verify correct login still works
Write-Host "TEST 3: Valid login (should succeed)" -ForegroundColor $YELLOW
$body3 = @{
    email = "admin@zohocorp.com"
    password = "12345678"
} | ConvertTo-Json

Write-Host "Request: POST $BASE_URL/auth/login" -ForegroundColor $BLUE
Write-Host "Email: admin@zohocorp.com" -ForegroundColor $BLUE
Write-Host "Password: 12345678 (correct)" -ForegroundColor $BLUE

try {
    $response3 = Invoke-WebRequest -Uri "$BASE_URL/auth/login" `
        -Method POST `
        -Headers @{"Content-Type" = "application/json"} `
        -Body $body3 `
        -ErrorAction Stop
    
    Write-Host "✓ Status Code: 200 (SUCCESS)" -ForegroundColor $GREEN
    $loginResponse = $response3.Content | ConvertFrom-Json
    if ($loginResponse.accessToken) {
        Write-Host "✓ Access token received" -ForegroundColor $GREEN
    }
} catch {
    $statusCode = $_.Exception.Response.StatusCode.value__
    Write-Host "✗ Status Code: $statusCode (FAILED - should be 200)" -ForegroundColor $RED
    Write-Host "Response: $($_.Exception.Response.Content.ToString())" -ForegroundColor $RED
}

Write-Host ""
Write-Host "=== TESTS COMPLETE ===" -ForegroundColor $YELLOW
