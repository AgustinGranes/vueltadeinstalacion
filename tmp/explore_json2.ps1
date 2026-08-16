$data = Invoke-RestMethod 'https://raw.githubusercontent.com/AgustinGranes/DataExtractor/main/data/horarios.json'
Write-Host "Top-level keys:"
$data.PSObject.Properties.Name | ForEach-Object { Write-Host "  $_" }

Write-Host ""
Write-Host "Series[0] keys:"
$data.series[0].PSObject.Properties.Name | ForEach-Object { Write-Host "  $_" }

Write-Host ""
Write-Host "Details keys of series[0]:"
$data.series[0].details.PSObject.Properties.Name | ForEach-Object { Write-Host "  $_" }

# Check if there's a top-level events or schedules array
if ($data.PSObject.Properties.Name -contains 'events') {
    Write-Host ""
    Write-Host "Top-level events count: $($data.events.Count)"
    if ($data.events.Count -gt 0) {
        Write-Host "First event:"
        $data.events[0] | ConvertTo-Json -Depth 5
    }
}

# Check series for schedule/events fields
Write-Host ""
Write-Host "Checking series for schedules/events..."
$idx = 0
foreach ($s in $data.series) {
    $keys = $s.PSObject.Properties.Name
    if ($keys -contains 'schedule' -or $keys -contains 'events' -or $keys -contains 'schedules') {
        Write-Host "Series $idx ($($s.details.shortName)) has: $($keys -join ', ')"
        if ($idx -lt 3) {
            $s | ConvertTo-Json -Depth 2
        }
    }
    $idx++
}
