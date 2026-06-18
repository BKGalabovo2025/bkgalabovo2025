$json = Get-Content 'D:\FIREBASE STUDIO\bkgalabovo2025\sonar-audit-new.json' -Raw | ConvertFrom-Json

$totalFiles = $json.Count
$filesWithErrors = ($json | Where-Object { $_.errorCount -gt 0 }).Count
$filesWithWarnings = ($json | Where-Object { $_.warningCount -gt 0 }).Count
$totalErrors = ($json | Measure-Object -Property errorCount -Sum).Sum
$totalWarnings = ($json | Measure-Object -Property warningCount -Sum).Sum
$totalFatalErrors = ($json | Measure-Object -Property fatalErrorCount -Sum).Sum

Write-Host "=== SONAR AUDIT SUMMARY ==="
Write-Host "Total files scanned: $totalFiles"
Write-Host "Files with errors: $filesWithErrors"
Write-Host "Files with warnings: $filesWithWarnings"
Write-Host "Total errors: $totalErrors"
Write-Host "Total fatal errors: $totalFatalErrors"
Write-Host "Total warnings: $totalWarnings"

Write-Host ""
Write-Host "=== TOP 15 FILES BY WARNING COUNT ==="
$json | Where-Object { $_.warningCount -gt 0 } | Sort-Object warningCount -Descending | Select-Object -First 15 | ForEach-Object {
    $name = $_.filePath -replace '.*\\', ''
    $wc = $_.warningCount
    $ec = $_.errorCount
    Write-Host "  [W:$wc E:$ec] $name"
}

Write-Host ""
Write-Host "=== RULES BREAKDOWN (Top 20) ==="
$allMessages = $json | ForEach-Object { $_.messages }
$ruleGroups = $allMessages | Where-Object { $_.ruleId } | Group-Object ruleId | Sort-Object Count -Descending | Select-Object -First 20
foreach ($g in $ruleGroups) {
    Write-Host "  [$($g.Count)x] $($g.Name)"
}

Write-Host ""
Write-Host "=== FILES WITH ERRORS ==="
$json | Where-Object { $_.errorCount -gt 0 } | ForEach-Object {
    $name = $_.filePath -replace '.*\\', ''
    $ec = $_.errorCount
    Write-Host "  [E:$ec] $name"
    foreach ($m in $_.messages | Where-Object { $_.severity -eq 2 }) {
        Write-Host "    Line $($m.line): $($m.ruleId) - $($m.message)"
    }
}
