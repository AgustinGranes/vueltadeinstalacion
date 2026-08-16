$data = Invoke-RestMethod 'https://raw.githubusercontent.com/AgustinGranes/DataExtractor/main/data/horarios.json'
$series = $data.series
Write-Host "Number of series: $($series.Count)"

# Find series with events in the next 7 days
$now = [DateTimeOffset]::Now
$end7 = $now.AddDays(7)

$eventsFound = 0
foreach ($s in $series) {
    if ($s.events -and $s.events.Count -gt 0) {
        foreach ($ev in $s.events) {
            $eventsFound++
            if ($eventsFound -le 3) {
                Write-Host "--- Event from series: $($s.details.shortName) ---"
                $ev | ConvertTo-Json -Depth 4
            }
        }
    }
}
Write-Host "Total events found: $eventsFound"
