import puppeteer from 'puppeteer';
import fs from 'fs';

export const browser = await puppeteer.launch({
  headless: true,
  args: [
    '--disable-gpu',
    '--disable-dev-shm-usage',
    '--disable-setuid-sandbox',
    '--no-first-run',
    '--no-sandbox',
    '--no-zygote',
    '--deterministic-fetch',
    '--disable-features=IsolateOrigins',
    '--disable-site-isolation-trials',
  ],
});

export const formatTime = (timeSec) => {
  const days = Math.floor(timeSec / (24 * 60 * 60));
  timeSec -= days * 24 * 60 * 60;
  const hours = Math.floor(timeSec / (60 * 60));
  timeSec -= hours * 60 * 60;
  const mins = Math.floor(timeSec / 60);
  timeSec -= mins * 60;

  let formattedTime = '';

  if (days > 0) {
    formattedTime += `${days}d `;
  }
  if (hours > 0) {
    formattedTime += `${hours}h `;
  }
  if (mins > 0) {
    formattedTime += `${mins}m `;
  }
  formattedTime += `${timeSec.toFixed(0)}s`;

  return formattedTime;
};

export const calculateETA = (i, courseListLength, startTime) => {
  if (i === 0) {
    return 'NaN';
  }

  const elapsedTime = (new Date() - startTime) / 1000;
  let timeLeftSec = (courseListLength - i) * (elapsedTime / i);

  return formatTime(timeLeftSec);
};

export const readNonEmptyCourses = () => {
  try {
    const courseListRaw = fs.readFileSync('nonEmptyCourses.txt', 'utf8');
    return courseListRaw.toString().split('\n');
  } catch (e) {
    console.log('Error:', e.stack);
    return [];
  }
};

//   console.log(
//     util.inspect(data, { showHidden: true, depth: 10, colors: true })
//   );
