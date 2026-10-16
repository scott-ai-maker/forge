import QRCode from 'qrcode'

export interface QRCodeRenderOptions {
  width?: number
  margin?: number
  darkColor?: string
  lightColor?: string
}

/**
 * Generates an SVG string representation of a QR code.
 * Safe for server components and browser rendering.
 */
export async function generateQrCodeSvg(
  text: string,
  options: QRCodeRenderOptions = {}
): Promise<string> {
  const {
    width = 240,
    margin = 1,
    darkColor = '#C5A059', // Athletic Gold
    lightColor = '#080E14', // Deep Obsidian
  } = options

  return QRCode.toString(text, {
    type: 'svg',
    width,
    margin,
    color: {
      dark: darkColor,
      light: lightColor,
    },
  })
}

/**
 * Generates a base64 Data URL (image/png) for a QR code.
 */
export async function generateQrCodeDataUrl(
  text: string,
  options: QRCodeRenderOptions = {}
): Promise<string> {
  const {
    width = 280,
    margin = 1,
    darkColor = '#C5A059',
    lightColor = '#080E14',
  } = options

  return QRCode.toDataURL(text, {
    width,
    margin,
    color: {
      dark: darkColor,
      light: lightColor,
    },
  })
}
