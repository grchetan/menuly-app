Add-Type -AssemblyName System.Drawing

$ErrorActionPreference = "Stop"

function Draw-MenulyIcon([int]$size) {
    $bmp = New-Object System.Drawing.Bitmap($size, $size, [System.Drawing.Imaging.PixelFormat]::Format32bppArgb)
    $g = [System.Drawing.Graphics]::FromImage($bmp)
    $g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::AntiAlias
    $g.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
    $g.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality
    $g.Clear([System.Drawing.Color]::Transparent)

    $scale = $size / 512.0

    # Squircle Background
    $path = New-Object System.Drawing.Drawing2D.GraphicsPath
    $r = 110.0 * $scale
    $pad = 6.0 * $scale
    $w = $size - (2.0 * $pad)
    $h = $size - (2.0 * $pad)
    $rect = New-Object System.Drawing.RectangleF($pad, $pad, $w, $h)

    $path.AddArc($rect.X, $rect.Y, $r * 2, $r * 2, 180, 90)
    $path.AddArc($rect.Right - ($r * 2), $rect.Y, $r * 2, $r * 2, 270, 90)
    $path.AddArc($rect.Right - ($r * 2), $rect.Bottom - ($r * 2), $r * 2, $r * 2, 0, 90)
    $path.AddArc($rect.X, $rect.Bottom - ($r * 2), $r * 2, $r * 2, 90, 90)
    $path.CloseFigure()

    # Emerald-to-forest green brand gradient (#15803d to #0d4722)
    $c1 = [System.Drawing.Color]::FromArgb(255, 21, 128, 61)
    $c2 = [System.Drawing.Color]::FromArgb(255, 13, 71, 34)
    $gradBrush = New-Object System.Drawing.Drawing2D.LinearGradientBrush($rect, $c1, $c2, 45.0)
    $g.FillPath($gradBrush, $path)

    # Subtle contrast border for dark & light browser tabs (#22c55e, 35% opacity)
    $borderPen = New-Object System.Drawing.Pen([System.Drawing.Color]::FromArgb(90, 34, 197, 94), [single](3.5 * $scale))
    $g.DrawPath($borderPen, $path)

    # Helper function for rounded rectangles
    function DrawRoundedRect([float]$x, [float]$y, [float]$rw, [float]$rh, [float]$radius, [System.Drawing.Brush]$brush, [System.Drawing.Pen]$pen) {
        $p = New-Object System.Drawing.Drawing2D.GraphicsPath
        $d = [Math]::Max(1.0, $radius * 2.0)
        $p.AddArc($x, $y, $d, $d, 180, 90)
        $p.AddArc($x + $rw - $d, $y, $d, $d, 270, 90)
        $p.AddArc($x + $rw - $d, $y + $rh - $d, $d, $d, 0, 90)
        $p.AddArc($x, $y + $rh - $d, $d, $d, 90, 90)
        $p.CloseFigure()
        if ($brush -ne $null) { $g.FillPath($brush, $p) }
        if ($pen -ne $null) { $g.DrawPath($pen, $p) }
        $p.Dispose()
    }

    $whiteBrush = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::White)
    $whitePen = New-Object System.Drawing.Pen([System.Drawing.Color]::White, [single](22.0 * $scale))

    # 1. Top-Left Finder Eye
    # Outer box (stroke 22 centered at 96..200, so adjusted x,y is +11)
    DrawRoundedRect (107.0 * $scale) (107.0 * $scale) (82.0 * $scale) (82.0 * $scale) (16.0 * $scale) $null $whitePen
    # Inner solid dot (126..170)
    DrawRoundedRect (126.0 * $scale) (126.0 * $scale) (44.0 * $scale) (44.0 * $scale) (10.0 * $scale) $whiteBrush $null

    # 2. Top-Right Finder Eye
    DrawRoundedRect (323.0 * $scale) (107.0 * $scale) (82.0 * $scale) (82.0 * $scale) (16.0 * $scale) $null $whitePen
    DrawRoundedRect (342.0 * $scale) (126.0 * $scale) (44.0 * $scale) (44.0 * $scale) (10.0 * $scale) $whiteBrush $null

    # 3. Bottom-Left Finder Eye
    DrawRoundedRect (107.0 * $scale) (323.0 * $scale) (82.0 * $scale) (82.0 * $scale) (16.0 * $scale) $null $whitePen
    DrawRoundedRect (126.0 * $scale) (342.0 * $scale) (44.0 * $scale) (44.0 * $scale) (10.0 * $scale) $whiteBrush $null

    # 4. QR Data Modules & Center Matrix
    $modules = @(
        @(236, 107), @(236, 172), @(236, 236), @(236, 300), @(236, 365),
        @(107, 236), @(172, 236), @(300, 236), @(365, 236),
        @(315, 315), @(365, 315), @(340, 340), @(315, 365), @(365, 365)
    )

    foreach ($m in $modules) {
        DrawRoundedRect ($m[0] * $scale) ($m[1] * $scale) (38.0 * $scale) (38.0 * $scale) (9.0 * $scale) $whiteBrush $null
    }

    $g.Dispose()
    $path.Dispose()
    $gradBrush.Dispose()
    $borderPen.Dispose()
    $whiteBrush.Dispose()
    $whitePen.Dispose()

    return $bmp
}

# Ensure directories exist
$iconsDir = "public/icons"
if (-not (Test-Path $iconsDir)) {
    New-Item -ItemType Directory -Path $iconsDir -Force | Out-Null
}

Write-Output "Generating Menuly icons..."

# Generate 512x512
$icon512 = Draw-MenulyIcon 512
$icon512.Save("public/icons/icon-512.png", [System.Drawing.Imaging.ImageFormat]::Png)
Write-Output "Saved public/icons/icon-512.png"

# Generate 192x192
$icon192 = Draw-MenulyIcon 192
$icon192.Save("public/icons/icon-192.png", [System.Drawing.Imaging.ImageFormat]::Png)
Write-Output "Saved public/icons/icon-192.png"

# Generate 180x180 (Apple touch icon)
$icon180 = Draw-MenulyIcon 180
$icon180.Save("public/icons/apple-touch-icon.png", [System.Drawing.Imaging.ImageFormat]::Png)
Write-Output "Saved public/icons/apple-touch-icon.png"

# Generate 32x32 & 48x48 for favicon.ico
# To make a valid .ico with proper headers:
# A 32x32 PNG embedded inside .ico is the standard modern ICO format supported by all browsers and Windows.
$icon32 = Draw-MenulyIcon 32
$ms = New-Object System.IO.MemoryStream
$icon32.Save($ms, [System.Drawing.Imaging.ImageFormat]::Png)
$pngBytes = $ms.ToArray()
$ms.Dispose()

# Build valid .ICO header for 1 image (PNG format inside ICO)
# Header: 2 bytes reserved (0), 2 bytes type (1 for ico), 2 bytes image count (1)
# Directory entry: 16 bytes: width(32), height(32), colors(0), reserved(0), planes(1), bpp(32), bytesize, offset(22)
$icoStream = New-Object System.IO.FileStream("public/favicon.ico", [System.IO.FileMode]::Create)
$writer = New-Object System.IO.BinaryWriter($icoStream)

# Header
$writer.Write([uint16]0) # Reserved
$writer.Write([uint16]1) # ICO type
$writer.Write([uint16]1) # 1 image

# Directory Entry
$writer.Write([byte]32)                   # Width
$writer.Write([byte]32)                   # Height
$writer.Write([byte]0)                    # Color count
$writer.Write([byte]0)                    # Reserved
$writer.Write([uint16]1)                  # Color planes
$writer.Write([uint16]32)                 # Bits per pixel
$writer.Write([uint32]$pngBytes.Length)   # Size of image data
$writer.Write([uint32]22)                 # Offset (6 byte header + 16 byte dir = 22)

# Write PNG Payload
$writer.Write($pngBytes)
$writer.Flush()
$writer.Close()
$icoStream.Dispose()
Write-Output "Saved public/favicon.ico (Multi-res 32x32 standard ICO)"

$icon512.Dispose()
$icon192.Dispose()
$icon180.Dispose()
$icon32.Dispose()

Write-Output "All PNG/ICO favicons generated successfully!"
