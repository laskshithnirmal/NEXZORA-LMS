# Securely saves your existing MySQL password into backend\.env and tests the connection.
# - The password is typed into a hidden prompt (shown as *****), never echoed or logged.
# - It does NOT change your MySQL password; it only stores it for the LMS backend.
# Run it from the project folder:
#   powershell -ExecutionPolicy Bypass -File .\set-db-password.ps1

$ErrorActionPreference = 'Stop'
$envFile = Join-Path $PSScriptRoot 'backend\.env'
$example = Join-Path $PSScriptRoot 'backend\.env.example'
$mysql = 'C:\Program Files\MySQL\MySQL Server 8.0\bin\mysql.exe'

if (-not (Test-Path $envFile)) {
    Copy-Item $example $envFile
    Write-Host "Created backend\.env from .env.example"
}

# Read the username already configured in .env (default root).
$lines = [System.IO.File]::ReadAllLines($envFile)
$userLine = $lines | Where-Object { $_ -match '^DB_USERNAME=' } | Select-Object -First 1
$user = if ($userLine) { $userLine.Substring('DB_USERNAME='.Length).Trim() } else { 'root' }
if (-not $user) { $user = 'root' }

$secure = Read-Host "Enter the MySQL password for user '$user'" -AsSecureString
$bstr = [Runtime.InteropServices.Marshal]::SecureStringToBSTR($secure)
try {
    $plain = [Runtime.InteropServices.Marshal]::PtrToStringBSTR($bstr)
} finally {
    [Runtime.InteropServices.Marshal]::ZeroFreeBSTR($bstr)
}

if ([string]::IsNullOrEmpty($plain)) {
    Write-Host "No password entered - nothing was changed."
    exit 1
}

# 1) Test the password first, so a typo is never saved.
#    It is passed to mysql.exe through a process-only environment variable, not the command line.
if (Test-Path $mysql) {
    $env:MYSQL_PWD = $plain
    $ErrorActionPreference = 'Continue'   # let mysql.exe report errors instead of aborting the script
    try {
        & $mysql -u $user -h localhost --connect-timeout=5 -N -e "SELECT 'MySQL connection OK - version', VERSION();" 2>&1 |
            Where-Object { $_ -notmatch 'Using a password on the command line' } | ForEach-Object { Write-Host $_ }
        $ok = ($LASTEXITCODE -eq 0)
    } finally {
        Remove-Item Env:\MYSQL_PWD -ErrorAction SilentlyContinue
        $ErrorActionPreference = 'Stop'
    }
    if (-not $ok) {
        Write-Host ""
        Write-Host "MySQL rejected that password. Nothing was saved - run the script again." -ForegroundColor Red
        exit 1
    }
} else {
    Write-Host "mysql.exe not found at $mysql - skipping the connection test."
}

# 2) Save it. .env is read as a Java properties file, so each backslash must be doubled.
$escaped = $plain.Replace('\', '\\')
$found = $false
$updated = foreach ($line in $lines) {
    if ($line -match '^DB_PASSWORD=') { $found = $true; "DB_PASSWORD=$escaped" } else { $line }
}
if (-not $found) { $updated = @($updated) + "DB_PASSWORD=$escaped" }

# Write without a BOM so the backend reads the file correctly.
[System.IO.File]::WriteAllLines($envFile, [string[]]$updated, (New-Object System.Text.UTF8Encoding($false)))

$plain = $null
$escaped = $null
Write-Host ""
Write-Host "Saved. DB_PASSWORD is now set in backend\.env (git-ignored)." -ForegroundColor Green
Write-Host "Start the app with start-all.cmd"
