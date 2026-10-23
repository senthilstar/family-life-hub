import sharp from 'sharp';
const mask=Buffer.from('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512"><rect width="512" height="512" fill="#bd5a37"/><g transform="translate(77 77) scale(.7)"><path d="M256 118 112 236v158h104v-94h80v94h104V236z" fill="#fffdf8"/><circle cx="256" cy="232" r="26" fill="#bb872b"/></g></svg>');
for (const [n,s] of [['favicon-32.png',32],['apple-touch-icon.png',180],['icon-192.png',192],['icon-512.png',512]]) await sharp('public/icon.svg').resize(s,s).png().toFile('public/'+n);
await sharp(mask).resize(512,512).png().toFile('public/icon-maskable-512.png');
