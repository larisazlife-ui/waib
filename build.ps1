# Сборка одного HTML-файла для публикации как артефакт Claude.
# Запуск:  powershell -ExecutionPolicy Bypass -File build.ps1
# Результат: dist/marshrut-novogo-produkta.html — стили и скрипты встроены, порядок скриптов берётся из index.html.
$root = $PSScriptRoot
$utf8 = New-Object Text.UTF8Encoding($false)
function Read-Text($rel) { [IO.File]::ReadAllText((Join-Path $root $rel), [Text.Encoding]::UTF8) }

$index = Read-Text 'index.html'
$body = [regex]::Match($index, '(?s)<body>(.*?)<!-- Порядок').Groups[1].Value.Trim()
$scripts = [regex]::Matches($index, '(?s)<body>.*') | ForEach-Object { [regex]::Matches($_.Value, '<script src="([^"]+)"></script>') } | ForEach-Object { $_.Groups[1].Value }
$headScripts = [regex]::Matches([regex]::Match($index, '(?s)<head>(.*?)</head>').Value, '<script src="([^"]+)"></script>') | ForEach-Object { $_.Groups[1].Value }

$js = ($scripts | ForEach-Object { "/* ---- $_ ---- */`n" + (Read-Text $_) }) -join "`n"
if ($js -match '</script') { throw 'В JavaScript встретилось </script — встраивать небезопасно' }
$headJs = ($headScripts | ForEach-Object { Read-Text $_ }) -join "`n"

$out = @"
<title>Маршрут нового продукта</title>
<meta name="description" content="Stage-gate маршрут вывода страховых продуктов через подразделения компании с юридической проверкой, сверкой с рынком и паспортом продукта.">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link href="https://fonts.googleapis.com/css2?family=Libre+Caslon+Text:wght@400;700&family=Inter:wght@400;500;600&display=swap" rel="stylesheet">
<style>
$(Read-Text 'css/styles.css')
</style>
<script>$headJs</script>
$body

<script>
{
$js
}
</script>
"@

New-Item -ItemType Directory -Force (Join-Path $root 'dist') | Out-Null
$target = Join-Path $root 'dist\marshrut-novogo-produkta.html'
[IO.File]::WriteAllText($target, $out, $utf8)
"Собрано: $target ($([math]::Round((Get-Item $target).Length / 1KB)) КБ, скриптов: $($scripts.Count))"
