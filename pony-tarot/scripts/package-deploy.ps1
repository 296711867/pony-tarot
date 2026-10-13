$ErrorActionPreference = 'Stop'
$projectRoot = [IO.Path]::GetFullPath((Join-Path $PSScriptRoot '..\..'))
$appRoot = Join-Path $projectRoot 'pony-tarot'
$packageParent = Join-Path $projectRoot 'deploy-package'
$packageRoot = [IO.Path]::GetFullPath((Join-Path $packageParent 'pony-tarot'))
$expectedRoot = [IO.Path]::GetFullPath((Join-Path $projectRoot 'deploy-package\pony-tarot'))
if ($packageRoot -ne $expectedRoot -or $packageRoot -eq $projectRoot) { throw 'Unexpected package directory' }
if (-not (Test-Path -LiteralPath (Join-Path $appRoot '.next\standalone\server.js'))) { throw 'Run build and deploy:prepare first' }
if (Test-Path -LiteralPath $packageRoot) { Remove-Item -LiteralPath $packageRoot -Recurse -Force }
New-Item -ItemType Directory -Path $packageRoot -Force | Out-Null
Get-ChildItem -LiteralPath (Join-Path $appRoot '.next\standalone') -Force | ForEach-Object {
    Copy-Item -LiteralPath $_.FullName -Destination $packageRoot -Recurse -Force
}
Copy-Item -LiteralPath (Join-Path $appRoot 'deploy\start.mjs') -Destination $packageRoot
Copy-Item -LiteralPath (Join-Path $appRoot '部署说明.md') -Destination (Join-Path $packageRoot 'DEPLOY.md')
Copy-Item -LiteralPath (Join-Path $appRoot 'AI接入说明.md') -Destination (Join-Path $packageRoot 'AI-USAGE.md')
Copy-Item -LiteralPath (Join-Path $appRoot 'THIRD_PARTY_LICENSES.txt') -Destination $packageRoot
foreach ($forbidden in @('.env', '.env.local', '.runtime')) {
    if (Test-Path -LiteralPath (Join-Path $packageRoot $forbidden)) { throw "Private runtime data found in package: $forbidden" }
}
$release = @{
    builtAt = [DateTimeOffset]::Now.ToString('o')
    buildId = (Get-Content -LiteralPath (Join-Path $appRoot '.next\BUILD_ID') -Raw).Trim()
    features = @('pony-svg-marks', 'smooth-apple-butterfly', 'magic-ui-icons', 'visible-ai-entry', 'inline-ai-settings', 'http-reading-id')
}
[IO.File]::WriteAllText((Join-Path $packageRoot 'release.json'), ($release | ConvertTo-Json), [Text.UTF8Encoding]::new($false))
$archive = Join-Path $projectRoot ('pony-tarot-deploy-' + (Get-Date -Format 'yyyyMMdd') + '.zip')
& tar.exe -a -cf $archive -C $packageParent 'pony-tarot'
if ($LASTEXITCODE -ne 0) { throw 'bsdtar packaging failed' }
Get-Item -LiteralPath $archive | Select-Object FullName,Length
