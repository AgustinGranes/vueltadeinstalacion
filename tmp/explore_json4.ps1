$data = Invoke-RestMethod 'https://raw.githubusercontent.com/AgustinGranes/DataExtractor/main/data/horarios.json'

# Build series map by ID
$seriesMap = @{}
foreach ($s in $data.series) {
    $seriesMap[$s.details.id] = $s
}

$now = [DateTime]::UtcNow
$end7 = $now.AddDays(7)

# Find events with sessions in next 7 days
$weekEvents = @()
foreach ($ev in $data.events) {
    $hasSessionInRange = $false
    foreach ($session in $ev.sessions) {
        $sessionDate = [DateTime]::Parse($session.date)
        if ($sessionDate -ge $now -and $sessionDate -le $end7) {
            $hasSessionInRange = $true
            break
        }
    }
    if ($hasSessionInRange) {
        $weekEvents += $ev
    }
}

Write-Host "Total events in next 7 days: $($weekEvents.Count)"
Write-Host ""

# List all unique series involved
$seriesInvolved = @{}
foreach ($ev in $weekEvents) {
    foreach ($sid in $ev.series) {
        if (-not $seriesInvolved.ContainsKey($sid)) {
            $seriesData = $seriesMap[$sid]
            $seriesInvolved[$sid] = @{
                shortName = if ($seriesData) { $seriesData.details.shortName } else { $sid }
                colours = if ($seriesData) { $seriesData.colours } else { $null }
            }
        }
    }
}

Write-Host "Series involved:"
foreach ($key in $seriesInvolved.Keys) {
    $s = $seriesInvolved[$key]
    $dark = if ($s.colours -and $s.colours.dark) { "rgb($($s.colours.dark -join ','))" } else { 'N/A' }
    Write-Host "  $key -> $($s.shortName) | Color: $dark"
}
