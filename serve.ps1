# Локальный веб-сервер для «Маршрута нового продукта» без установки Node.js или Python.
# Запуск:  powershell -ExecutionPolicy Bypass -File serve.ps1 [-Port 8080]
# Затем откройте http://localhost:8080/ (тесты: http://localhost:8080/tests/tests.html)
param([int]$Port = 8080)

$root = [IO.Path]::GetFullPath($PSScriptRoot)
$types = @{
  '.html' = 'text/html; charset=utf-8'; '.js' = 'text/javascript; charset=utf-8'
  '.css'  = 'text/css; charset=utf-8';  '.json' = 'application/json; charset=utf-8'
  '.md'   = 'text/plain; charset=utf-8'; '.svg' = 'image/svg+xml'; '.png' = 'image/png'; '.ico' = 'image/x-icon'
}

$listener = New-Object Net.HttpListener
$listener.Prefixes.Add("http://localhost:$Port/")
$listener.Start()
Write-Host "Маршрут нового продукта: http://localhost:$Port/  (Ctrl+C — остановить)"

try {
  while ($listener.IsListening) {
    $ctx = $listener.GetContext()
    $res = $ctx.Response
    try {
      $rel = [Uri]::UnescapeDataString($ctx.Request.Url.AbsolutePath).TrimStart('/')
      if ($rel -eq '' -or $rel.EndsWith('/')) { $rel += 'index.html' }
      $path = [IO.Path]::GetFullPath((Join-Path $root $rel))
      # Отдаём только файлы внутри папки проекта
      if (-not $path.StartsWith($root, [StringComparison]::OrdinalIgnoreCase) -or -not (Test-Path -LiteralPath $path -PathType Leaf)) {
        $res.StatusCode = 404; $bytes = [Text.Encoding]::UTF8.GetBytes('Not found')
      } else {
        $ext = [IO.Path]::GetExtension($path).ToLower()
        $res.ContentType = if ($types.ContainsKey($ext)) { $types[$ext] } else { 'application/octet-stream' }
        $res.Headers.Add('Cache-Control', 'no-store')
        $bytes = [IO.File]::ReadAllBytes($path)
      }
      $res.OutputStream.Write($bytes, 0, $bytes.Length)
    } catch {
      $res.StatusCode = 500
    } finally {
      $res.Close()
    }
  }
} finally {
  $listener.Stop()
}
