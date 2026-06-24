const fs = require('fs');
const https = require('https');
const path = require('path');

const audioMap = {
  "public/shadow/common/podgotvi_se.mp3": "Подготви се",
  "public/shadow/common/lek_podskok.mp3": "Хоп", 
  "public/shadow/common/split_step.mp3": "Хоп",
  "public/shadow/common/krai.mp3": "Край",
  "public/shadow/common/pochivka.mp3": "Почивка",
  "public/shadow/common/krai_pochivka.mp3": "Край на почивката",
  "public/shadow/common/tsentar.mp3": "Център",
  
  "public/shadow/zones/forhend_mrezha.mp3": "Форхенд Мрежа",
  "public/shadow/zones/forhend_sreda.mp3": "Форхенд Среда",
  "public/shadow/zones/forhend_zadna_linia.mp3": "Форхенд Задна линия",
  "public/shadow/zones/bekhend_mrezha.mp3": "Бекхенд Мрежа",
  "public/shadow/zones/bekhend_sreda.mp3": "Бекхенд Среда",
  "public/shadow/zones/bekhend_zadna_linia.mp3": "Бекхенд Задна линия",
  "public/shadow/zones/overhead_zadna_linia.mp3": "Оувърхед",
  
  "public/shadow/shots/klir_prava.mp3": "Клеър по правата",
  "public/shadow/shots/klir_diagonal.mp3": "Клеър по диагонала",
  "public/shadow/shots/smash_prava.mp3": "Смаш по правата",
  "public/shadow/shots/smash_diagonal.mp3": "Смаш по диагонала",
  "public/shadow/shots/smash_otskok_prava.mp3": "Смаш с отскок по правата",
  "public/shadow/shots/smash_otskok_diagonal.mp3": "Смаш с отскок по диагонала",
  "public/shadow/shots/polusmash_prava.mp3": "Полусмаш по правата",
  "public/shadow/shots/polusmash_diagonal.mp3": "Полусмаш по диагонала",
  "public/shadow/shots/drop_prava.mp3": "Дроп по правата",
  "public/shadow/shots/drop_diagonal.mp3": "Дроп по диагонала",
  "public/shadow/shots/dobivane.mp3": "Нет кил", // Net kill
  "public/shadow/shots/kus_prava.mp3": "Къс на мрежата по правата", // Net shot straight
  "public/shadow/shots/kus_diagonal.mp3": "Къс на мрежата по диагонала", // Net shot cross
  "public/shadow/shots/lift_prava.mp3": "Лифт по правата",
  "public/shadow/shots/lift_diagonal.mp3": "Лифт по диагонала",
  "public/shadow/shots/drayv_prava.mp3": "Драйв по правата",
  "public/shadow/shots/drayv_diagonal.mp3": "Драйв по диагонала",
  "public/shadow/shots/zashtita.mp3": "Защита",
};

async function download(text, filepath) {
  const url = `https://translate.google.com/translate_tts?ie=UTF-8&q=${encodeURIComponent(text)}&tl=bg&client=tw-ob`;
  return new Promise((resolve, reject) => {
    https.get(url, (res) => {
      if (res.statusCode !== 200) {
        reject(new Error(`Failed to get '${text}' (${res.statusCode})`));
        return;
      }
      const dir = path.dirname(filepath);
      if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
      const file = fs.createWriteStream(filepath);
      res.pipe(file);
      file.on('finish', () => {
        file.close();
        resolve();
      });
    }).on('error', reject);
  });
}

async function main() {
  for (const [filepath, text] of Object.entries(audioMap)) {
    console.log(`Downloading ${text} to ${filepath}...`);
    try {
      await download(text, filepath);
      await new Promise(r => setTimeout(r, 600)); // avoid rate limits
    } catch (e) {
      console.error(e);
    }
  }
  console.log("Done.");
}

main();
