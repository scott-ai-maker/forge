import Foundation
import AppKit
import UniformTypeIdentifiers

// Target background color #080E14
let bgRed: CGFloat = 8.0 / 255.0
let bgGreen: CGFloat = 14.0 / 255.0
let bgBlue: CGFloat = 20.0 / 255.0

let sourcePath = "public/images/brand-logo.png"

guard let sourceNSImage = NSImage(contentsOfFile: sourcePath),
      let sourceCGImage = sourceNSImage.cgImage(forProposedRect: nil, context: nil, hints: nil) else {
    print("❌ Error: Unable to load source image at \(sourcePath)")
    exit(1)
}

let srcW = sourceCGImage.width
let srcH = sourceCGImage.height
let colorSpace = CGColorSpaceCreateDeviceRGB()

var srcData = [UInt8](repeating: 0, count: srcW * srcH * 4)
guard let srcCtx = CGContext(data: &srcData,
                             width: srcW,
                             height: srcH,
                             bitsPerComponent: 8,
                             bytesPerRow: srcW * 4,
                             space: colorSpace,
                             bitmapInfo: CGImageAlphaInfo.premultipliedLast.rawValue) else {
    print("❌ Error: Failed to create source context")
    exit(1)
}
srcCtx.draw(sourceCGImage, in: CGRect(x: 0, y: 0, width: srcW, height: srcH))

// Gold crest bounds are centered around (511.5, 497.5) with width ~686, height ~646
let centerX: Double = 511.5
let centerY: Double = 497.5
let maxRadius: Double = 370.0

// Create clean, alpha-matted master crest image of size 760x760
let masterSize = 760
var masterData = [UInt8](repeating: 0, count: masterSize * masterSize * 4)

let halfMaster = Double(masterSize) / 2.0

for my in 0..<masterSize {
    for mx in 0..<masterSize {
        let masterOffset = (my * masterSize + mx) * 4
        
        let sx = Int(round(centerX - halfMaster + Double(mx)))
        let sy = Int(round(centerY - halfMaster + Double(my)))
        
        if sx < 0 || sx >= srcW || sy < 0 || sy >= srcH {
            masterData[masterOffset] = 8
            masterData[masterOffset + 1] = 14
            masterData[masterOffset + 2] = 20
            masterData[masterOffset + 3] = 255
            continue
        }
        
        let srcOffset = (sy * srcW + sx) * 4
        let r = Double(srcData[srcOffset])
        let g = Double(srcData[srcOffset + 1])
        let b = Double(srcData[srcOffset + 2])
        
        let dx = Double(sx) - centerX
        let dy = Double(sy) - centerY
        let dist = sqrt(dx * dx + dy * dy)
        
        let isGold = (r > 70.0 && g > 55.0)
        let luminance = 0.299 * r + 0.587 * g + 0.114 * b
        
        var alpha: Double = 0.0
        if dist > maxRadius {
            alpha = 0.0
        } else if isGold {
            alpha = 1.0
        } else {
            if dist < 310.0 {
                alpha = max(0.0, min(1.0, luminance / 70.0 + 0.15))
            } else {
                let fade = max(0.0, (maxRadius - dist) / (maxRadius - 310.0))
                alpha = max(0.0, min(1.0, (luminance / 70.0) * fade))
            }
        }
        
        let bgR = 8.0
        let bgG = 14.0
        let bgB = 20.0
        
        let finalR = UInt8(max(0.0, min(255.0, r * alpha + bgR * (1.0 - alpha))))
        let finalG = UInt8(max(0.0, min(255.0, g * alpha + bgG * (1.0 - alpha))))
        let finalB = UInt8(max(0.0, min(255.0, b * alpha + bgB * (1.0 - alpha))))
        
        masterData[masterOffset] = finalR
        masterData[masterOffset + 1] = finalG
        masterData[masterOffset + 2] = finalB
        masterData[masterOffset + 3] = 255
    }
}

guard let masterCtx = CGContext(data: &masterData,
                                width: masterSize,
                                height: masterSize,
                                bitsPerComponent: 8,
                                bytesPerRow: masterSize * 4,
                                space: colorSpace,
                                bitmapInfo: CGImageAlphaInfo.premultipliedLast.rawValue),
      let masterCGImage = masterCtx.makeImage() else {
    print("❌ Error: Failed to create master crest image")
    exit(1)
}

func savePNG(image: CGImage, to path: String) {
    let url = URL(fileURLWithPath: path)
    let dir = url.deletingLastPathComponent()
    try? FileManager.default.createDirectory(at: dir, withIntermediateDirectories: true, attributes: nil)
    
    guard let dest = CGImageDestinationCreateWithURL(url as CFURL, UTType.png.identifier as CFString, 1, nil) else {
        print("❌ Error creating image destination for \(path)")
        return
    }
    CGImageDestinationAddImage(dest, image, nil)
    if CGImageDestinationFinalize(dest) {
        print("  ✅ Generated: \(path) (\(image.width)x\(image.height))")
    } else {
        print("❌ Error writing PNG to \(path)")
    }
}

func renderCanvas(canvasW: Int, canvasH: Int, logoSize: CGFloat) -> CGImage? {
    var pixelData = [UInt8](repeating: 0, count: canvasW * canvasH * 4)
    guard let ctx = CGContext(data: &pixelData,
                              width: canvasW,
                              height: canvasH,
                              bitsPerComponent: 8,
                              bytesPerRow: canvasW * 4,
                              space: colorSpace,
                              bitmapInfo: CGImageAlphaInfo.premultipliedLast.rawValue) else {
        return nil
    }
    
    ctx.setAllowsAntialiasing(true)
    ctx.setShouldAntialias(true)
    ctx.interpolationQuality = .high
    
    ctx.setFillColor(red: bgRed, green: bgGreen, blue: bgBlue, alpha: 1.0)
    ctx.fill(CGRect(x: 0, y: 0, width: canvasW, height: canvasH))
    
    let originX = (CGFloat(canvasW) - logoSize) / 2.0
    let originY = (CGFloat(canvasH) - logoSize) / 2.0
    
    ctx.draw(masterCGImage, in: CGRect(x: originX, y: originY, width: logoSize, height: logoSize))
    
    return ctx.makeImage()
}

print("\n🖼 Generating iOS Splash Screen Assets...")
// iOS Storyboard logo imageset assets
// 1x = 160px, 2x = 320px, 3x = 480px
if let img1x = renderCanvas(canvasW: 160, canvasH: 160, logoSize: 140) {
    savePNG(image: img1x, to: "ios/App/App/Assets.xcassets/Splash.imageset/splash-1x.png")
}
if let img2x = renderCanvas(canvasW: 320, canvasH: 320, logoSize: 280) {
    savePNG(image: img2x, to: "ios/App/App/Assets.xcassets/Splash.imageset/splash-2x.png")
}
if let img3x = renderCanvas(canvasW: 480, canvasH: 480, logoSize: 420) {
    savePNG(image: img3x, to: "ios/App/App/Assets.xcassets/Splash.imageset/splash-3x.png")
}

print("\n🤖 Generating Android 12+ (API 31+) and Legacy Splash Screen Assets...")
// Android 12+ SplashScreen API specifications:
// The icon viewport is 288dp x 288dp. The safe circular zone has diameter 160dp (~55% of canvas).
// Density ratios: mdpi=1x (288px), hdpi=1.5x (432px), xhdpi=2x (576px), xxhdpi=3x (864px), xxxhdpi=4x (1152px)
let androidDensities: [(name: String, canvasSize: Int, logoSize: CGFloat)] = [
    ("mipmap-mdpi", 288, 160),
    ("mipmap-hdpi", 432, 240),
    ("mipmap-xhdpi", 576, 320),
    ("mipmap-xxhdpi", 864, 480),
    ("mipmap-xxxhdpi", 1152, 640),
]

for density in androidDensities {
    if let img = renderCanvas(canvasW: density.canvasSize, canvasH: density.canvasSize, logoSize: density.logoSize) {
        savePNG(image: img, to: "android/app/src/main/res/\(density.name)/splash_icon.png")
    }
}

// Android base drawable assets for layer-list and fallback
if let drawableIcon = renderCanvas(canvasW: 512, canvasH: 512, logoSize: 340) {
    savePNG(image: drawableIcon, to: "android/app/src/main/res/drawable/splash_icon.png")
    savePNG(image: drawableIcon, to: "android/app/src/main/res/drawable/splash.png")
}

print("\n✨ All splash screen assets successfully generated!")

