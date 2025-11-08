// Script Node.js per generare icone PNG per la PWA
// Usa Canvas per creare icone di alta qualità

const fs = require('fs');
const { createCanvas } = require('canvas');

function createIcon(size, filename) {
    const canvas = createCanvas(size, size);
    const ctx = canvas.getContext('2d');

    // Background con gradiente
    const gradient = ctx.createLinearGradient(0, 0, size, size);
    gradient.addColorStop(0, '#667eea');
    gradient.addColorStop(1, '#764ba2');
    ctx.fillStyle = gradient;

    // Angoli arrotondati
    const radius = size * 0.1;
    ctx.beginPath();
    ctx.moveTo(radius, 0);
    ctx.lineTo(size - radius, 0);
    ctx.quadraticCurveTo(size, 0, size, radius);
    ctx.lineTo(size, size - radius);
    ctx.quadraticCurveTo(size, size, size - radius, size);
    ctx.lineTo(radius, size);
    ctx.quadraticCurveTo(0, size, 0, size - radius);
    ctx.lineTo(0, radius);
    ctx.quadraticCurveTo(0, 0, radius, 0);
    ctx.closePath();
    ctx.fill();

    // Emoji target
    const emojiSize = size * 0.55;
    ctx.font = `${emojiSize}px Arial`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('🎯', size / 2, size / 2.2);

    // Testo "VERBS"
    const textSize = size * 0.11;
    ctx.font = `bold ${textSize}px Arial`;
    ctx.fillStyle = 'white';
    ctx.shadowColor = 'rgba(0,0,0,0.5)';
    ctx.shadowBlur = size * 0.02;
    ctx.fillText('VERBS', size / 2, size * 0.87);

    // Salva PNG
    const buffer = canvas.toBuffer('image/png');
    fs.writeFileSync(filename, buffer);
    console.log(`✅ Creata: ${filename} (${size}x${size})`);
}

console.log('🎨 Generazione icone PWA...\n');

try {
    createIcon(192, 'icon-192.png');
    createIcon(512, 'icon-512.png');
    console.log('\n✨ Icone generate con successo!');
} catch (error) {
    console.error('❌ Errore durante la generazione:', error.message);
    console.log('\n💡 Installa canvas con: npm install canvas');
    console.log('   Oppure usa generate-icons.html nel browser');
    process.exit(1);
}
