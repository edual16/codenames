[CmdletBinding()]
param (
    [ValidateRange(2, 10000)]
    [int]$Count = 300,
    [string]$OutputPath = (Join-Path $PSScriptRoot 'data/clues.generated.json'),
    [switch]$Force
)

$ErrorActionPreference = 'Stop'

if ($Count % 2 -ne 0) {
    throw 'Count must be even: half the clues start red and half start blue.'
}

$destination = [System.IO.Path]::GetFullPath($OutputPath)
if (Test-Path -LiteralPath $destination -PathType Container) {
    throw 'OutputPath must point to a JSON file, not a directory.'
}
if ((Test-Path -LiteralPath $destination) -and -not $Force) {
    throw 'The output already exists. Choose another path or use -Force to replace it.'
}
if (-not (Test-Path -LiteralPath ([System.IO.Path]::GetDirectoryName($destination)) -PathType Container)) {
    throw 'The output directory does not exist.'
}

function Get-ShuffledPattern {
    param ([string]$Pattern, [System.Random]$Random)

    $letters = $Pattern.ToCharArray()
    for ($position = $letters.Length - 1; $position -gt 0; $position--) {
        $randomPosition = $Random.Next($position + 1)
        $temporary = $letters[$position]
        $letters[$position] = $letters[$randomPosition]
        $letters[$randomPosition] = $temporary
    }
    return -join $letters
}

$random = [System.Random]::new()
$unique = [System.Collections.Generic.HashSet[string]]::new([System.StringComparer]::Ordinal)
$clues = [System.Collections.Generic.List[string]]::new()
$patterns = @('RRRRRRRRRBBBBBBBBGGGGGGGK', 'RRRRRRRRBBBBBBBBBGGGGGGGK')
$attempts = 0
$target = 0

foreach ($pattern in $patterns) {
    $target += $Count / 2
    while ($clues.Count -lt $target) {
        $attempts++
        if ($attempts -gt $Count * 100) {
            throw 'Could not generate enough unique clues. Try again or reduce Count.'
        }
        $clue = Get-ShuffledPattern -Pattern $pattern -Random $random
        if ($unique.Add($clue)) {
            $clues.Add($clue)
        }
    }
}

for ($position = $clues.Count - 1; $position -gt 0; $position--) {
    $randomPosition = $random.Next($position + 1)
    $temporary = $clues[$position]
    $clues[$position] = $clues[$randomPosition]
    $clues[$randomPosition] = $temporary
}

$json = ConvertTo-Json -InputObject $clues.ToArray()
[System.IO.File]::WriteAllText($destination, $json, [System.Text.UTF8Encoding]::new($false))
Write-Output "Generated $Count unique clues ($($Count / 2) red starts, $($Count / 2) blue starts): $destination"