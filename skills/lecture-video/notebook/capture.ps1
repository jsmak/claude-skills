# 크롬 창을 앞으로 가져와 전체 화면을 PNG로 저장합니다.
#   capture.ps1 -Out images\S01.png              캡처
#   capture.ps1 -Keys '{F11}'                     크롬에 키 보내기 (SendKeys 형식)
param(
    [string]$Out,
    [string]$Keys,
    [string]$Title = 'Colab',
    [int]$Delay = 0,
    [switch]$NoRetry,
    [int]$Try = 0
)
if ($Delay) { Start-Sleep -Seconds $Delay }

Add-Type -AssemblyName System.Windows.Forms, System.Drawing
Add-Type @'
using System;
using System.Runtime.InteropServices;
public static class W {
    [DllImport("user32.dll")] public static extern bool SetProcessDPIAware();
    [DllImport("user32.dll")] public static extern bool SetForegroundWindow(IntPtr h);
    [DllImport("user32.dll")] public static extern bool ShowWindow(IntPtr h, int n);
    [DllImport("user32.dll")] public static extern bool PrintWindow(IntPtr h, IntPtr hdc, uint f);
    [DllImport("user32.dll")] public static extern bool GetWindowRect(IntPtr h, out RECT r);
    public struct RECT { public int L, T, R, B; }
}
'@
[W]::SetProcessDPIAware() | Out-Null

$p = Get-Process chrome -ErrorAction SilentlyContinue |
    Where-Object { $_.MainWindowTitle -like "*$Title*" } | Select-Object -First 1
if (-not $p) { throw "'$Title' 크롬 창을 찾지 못했습니다." }
[W]::SetForegroundWindow($p.MainWindowHandle) | Out-Null
Start-Sleep -Milliseconds 400

if ($Keys) {
    [System.Windows.Forms.SendKeys]::SendWait($Keys)
    Start-Sleep -Milliseconds 800
}

if ($Out) {
    # 화면 위에 떠 있는 다른 프로그램(녹화 프로그램 오버레이 등)이 찍히지 않도록
    # 화면이 아니라 크롬 창 자체를 그립니다 (PW_RENDERFULLCONTENT = 2).
    $r = New-Object W+RECT
    [W]::GetWindowRect($p.MainWindowHandle, [ref]$r) | Out-Null
    $bmp = New-Object System.Drawing.Bitmap ($r.R - $r.L), ($r.B - $r.T)
    $g = [System.Drawing.Graphics]::FromImage($bmp)
    $hdc = $g.GetHdc()
    [W]::PrintWindow($p.MainWindowHandle, $hdc, 2) | Out-Null
    $g.ReleaseHdc($hdc)
    $b = @{ Width = $bmp.Width; Height = $bmp.Height }

    # 확장 프로그램이 붙으면 맨 위에 "디버깅을 시작함" 알림줄이 잠시 뜹니다.
    # 알림줄의 [취소] 버튼(밝은 파란색)이 보이면 사라질 때까지 기다렸다가 다시 찍습니다.
    $px = $bmp.GetPixel([int]($b.Width * 0.56), [int]($b.Height * 0.0195))
    if ($px.B -gt 150 -and $px.B -gt $px.R + 30 -and -not $NoRetry) {
        $g.Dispose(); $bmp.Dispose()
        Start-Sleep -Seconds 3
        & $PSCommandPath -Out $Out -Title $Title -Try ($Try + 1) -NoRetry:($Try -ge 15)
        return
    }
    $full = [System.IO.Path]::GetFullPath((Join-Path $PSScriptRoot $Out))
    New-Item -ItemType Directory -Force (Split-Path $full) | Out-Null
    $bmp.Save($full, [System.Drawing.Imaging.ImageFormat]::Png)
    $g.Dispose(); $bmp.Dispose()
    "saved $full ($($b.Width)x$($b.Height))"
}
