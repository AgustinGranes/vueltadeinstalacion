$data = Invoke-RestMethod 'https://raw.githubusercontent.com/AgustinGranes/DataExtractor/main/data/horarios.json'

# Today is 2026-07-18
$now = [DateTime]::UtcNow
$end7 = $now.AddDays(7)

Write-Host "Now (UTC): $now"
Write-Host "End 7 days: $end7"
Write-Host ""

# Build series map by ID
$seriesMap = @{}
foreach ($s in $data.series) {
    $seriesMap[$s.details.id] = $s
}

# Find events with sessions in next 7 days
$weekEvents = @()
foreach ($ev in $data.events) {
    foreach ($session in $ev.sessions) {
        $sessionDate = [DateTime]::Parse($session.date)
        if ($sessionDate -ge $now -and $sessionDate -le $end7) {
            $weekEvents += @{
                event = $ev
                session = $session
                sessionDate = $sessionDate
            }
            break  # Just need one session to include the event
        }
    }
}

Write-Host "Events with sessions in next 7 days: $($weekEvents.Count)"
Write-Host ""

# Show first 5 events
$shown = 0
foreach ($item in $weekEvents) {
    if ($shown -ge 5) { break }
    $ev = $item.event
    Write-Host "EVENT: $($ev.eventName)"
    Write-Host "  Series: $($ev.series -join ', ')"
    foreach ($session in $ev.sessions) {
        $sessionDate = [DateTime]::Parse($session.date)
        if ($sessionDate -ge $now -and $sessionDate -le $end7) {
            Write-Host "  Session: $($session.sessionName) | $($session.date) | Circuit: $($session.circuit.circuit)"
        }
    }
    Write-Host ""
    $shown++
}
