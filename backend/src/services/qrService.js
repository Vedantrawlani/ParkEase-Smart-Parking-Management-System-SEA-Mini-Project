const QRCode = require('qrcode');

/**
 * Generate QR code as Base64 Data URL
 */
async function generateQRCode(payload) {
  try {
    const stringData = typeof payload === 'string' ? payload : JSON.stringify(payload);
    const dataUrl = await QRCode.toDataURL(stringData, {
      errorCorrectionLevel: 'H',
      type: 'image/png',
      margin: 2,
      width: 320,
      color: {
        dark: '#0f172a', // Slate 900
        light: '#ffffff'
      }
    });
    return dataUrl;
  } catch (err) {
    console.error('QR Generation failed:', err);
    throw new Error('Failed to generate QR code');
  }
}

module.exports = {
  generateQRCode
};

