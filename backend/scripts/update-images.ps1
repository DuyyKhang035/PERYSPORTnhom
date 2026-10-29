param([switch]$Seed)

$ErrorActionPreference = 'Stop'

if ($Seed) {
  Write-Host 'Seed se XOA va tao lai du lieu: admin, thuong hieu, danh muc, khuyen mai, san pham, banner, bai viet.'
  if ((Read-Host 'Go YES de tiep tuc') -ne 'YES') {
    Write-Host 'Da huy.'
    exit 0
  }
}

$securePassword = Read-Host 'Nhap mat khau MongoDB (ky tu se duoc an)' -AsSecureString
$passwordPointer = [IntPtr]::Zero
$previousMongoUri = [Environment]::GetEnvironmentVariable('MONGODB_URI', 'Process')

try {
  $passwordPointer = [Runtime.InteropServices.Marshal]::SecureStringToBSTR($securePassword)
  $password = [Runtime.InteropServices.Marshal]::PtrToStringBSTR($passwordPointer)
  $encodedPassword = [Uri]::EscapeDataString($password)
  $env:MONGODB_URI = "mongodb+srv://vok6863_db_user:$encodedPassword@cluster0.rqixqwk.mongodb.net/?retryWrites=true&w=majority"

  Push-Location (Join-Path $PSScriptRoot '..')
  try {
    if ($Seed) {
      npm run seed
      if ($LASTEXITCODE -ne 0) {
        throw "Seed that bai, ma loi: $LASTEXITCODE"
      }
    }

    npm run update-images
    if ($LASTEXITCODE -ne 0) {
      throw "Cap nhat anh that bai, ma loi: $LASTEXITCODE"
    }
  }
  finally {
    Pop-Location
  }
}
finally {
  if ($passwordPointer -ne [IntPtr]::Zero) {
    [Runtime.InteropServices.Marshal]::ZeroFreeBSTR($passwordPointer)
  }

  $password = $null
  $encodedPassword = $null
  $securePassword.Dispose()
  [Environment]::SetEnvironmentVariable('MONGODB_URI', $previousMongoUri, 'Process')
}
