$ApiBase = "http://127.0.0.1:5000/api/v1"
$TestEmail = "test_$(Get-Random -Minimum 1000 -Maximum 9999)@example.com"
$TestUsername = "tester_$(Get-Random -Minimum 1000 -Maximum 9999)"
$TestPassword = "Password123!@#"

Write-Host "🚀 Starting Comprehensive Endpoint Tests (PowerShell)...`n" -ForegroundColor Cyan

try {
    # 1. Get Captcha (and CSRF Token)
    Write-Host "1. Testing GET /auth/captcha..."
    $response = Invoke-WebRequest -Uri "$ApiBase/auth/captcha" -Method Get -SessionVariable WebSession
    $captcha = $response.Content | ConvertFrom-Json
    $captchaId = $captcha.data.id
    
    # Extract CSRF token from cookies
    $csrfToken = ($WebSession.Cookies.GetCookies("$ApiBase") | Where-Object { $_.Name -eq "XSRF-TOKEN" }).Value
    Write-Host "✅ Captcha ID: $captchaId" -ForegroundColor Green
    Write-Host "✅ CSRF Token acquired`n" -ForegroundColor Green

    $baseHeaders = @{ "x-csrf-token" = $csrfToken }

    # 2. Register
    Write-Host "2. Testing POST /auth/register..."
    $registerBody = @{
        email = $TestEmail
        password = $TestPassword
        full_name = "Test User"
        username = $TestUsername
        captcha_id = $captchaId
        captcha_text = "TEST_123"
    } | ConvertTo-Json
    
    $register = Invoke-RestMethod -Uri "$ApiBase/auth/register" -Method Post -Body $registerBody -ContentType "application/json" -Headers $baseHeaders -WebSession $WebSession
    $accessToken = $register.data.accessToken
    Write-Host "✅ User registered successfully: $($register.data.user.username)`n" -ForegroundColor Green

    # 3. Login
    Write-Host "3. Testing POST /auth/login..."
    # Get a fresh captcha for login (since they are single-use)
    $captchaLogin = Invoke-RestMethod -Uri "$ApiBase/auth/captcha" -Method Get -WebSession $WebSession
    $captchaIdLogin = $captchaLogin.data.id
    
    $loginBody = @{
        email = $TestEmail
        password = $TestPassword
        captcha_id = $captchaIdLogin
        captcha_text = "TEST_123"
    } | ConvertTo-Json

    $login = Invoke-RestMethod -Uri "$ApiBase/auth/login" -Method Post -Body $loginBody -ContentType "application/json" -Headers $baseHeaders -WebSession $WebSession
    $accessToken = $login.data.accessToken
    Write-Host "✅ Login successful`n" -ForegroundColor Green

    # 4. Get ME
    Write-Host "4. Testing GET /auth/me..."
    $headers = @{ Authorization = "Bearer $accessToken" }
    $me = Invoke-RestMethod -Uri "$ApiBase/auth/me" -Method Get -Headers $headers
    Write-Host "✅ Auth-Me verification successful: $($me.data.user.email)`n" -ForegroundColor Green

    # 5. Get Sessions
    Write-Host "5. Testing GET /auth/sessions..."
    $sessions = Invoke-RestMethod -Uri "$ApiBase/auth/sessions" -Method Get -Headers $headers
    Write-Host "✅ Active sessions: $($sessions.data.sessions.Count)`n" -ForegroundColor Green

    # 6. Get Audit Logs
    Write-Host "6. Testing GET /auth/audit-logs..."
    $logs = Invoke-RestMethod -Uri "$ApiBase/auth/audit-logs" -Method Get -Headers $headers
    Write-Host "✅ Audit logs retrieved`n" -ForegroundColor Green

    # 7. Get Files
    Write-Host "7. Testing GET /files..."
    $files = Invoke-RestMethod -Uri "$ApiBase/files" -Method Get -Headers $headers
    Write-Host "✅ File listing successful`n" -ForegroundColor Green

    Write-Host "✨ ALL MAJOR ENDPOINTS RESPONDING CORRECTLY! ✨" -ForegroundColor Yellow
    Write-Host "Test Identity: $TestUsername ($TestEmail)"
}
catch {
    Write-Host "❌ TEST FAILED: $($_.Exception.Message)" -ForegroundColor Red
    if ($_.Exception.Response) {
        $reader = New-Object System.IO.StreamReader($_.Exception.Response.GetResponseStream())
        $respBody = $reader.ReadToEnd()
        Write-Host "Response Body: $respBody" -ForegroundColor Yellow
        if ($respBody -match "errors") {
            try {
                $errJson = $respBody | ConvertFrom-Json
                Write-Host "Validation Errors Details:" -ForegroundColor Red
                $errJson.errors | Format-Table -AutoSize
            } catch {}
        }
    }
    exit 1
}
