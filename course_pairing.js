import { createObjectCsvWriter } from 'csv-writer';
import { calculateETA, readNonEmptyCourses, formatTime } from './util';

const scrape = async (page, course) => {
  try {
    await page.goto(`https://kurser.dtu.dk/course/${course}`);
  } catch (error) {
    return 'error_page_goto';
  }

  const data = await page.evaluate((course) => {
    try {
      const tds = document.querySelectorAll(
        'div[id="pagecontents"] div + div div div td'
      );

      const englishTitle = document
        .querySelector('div[class="col-xs-8"] h2')
        .innerHTML.trim()
        .split(' ')
        .slice(1)
        .join(' ');

      const obj = [{ course, name: 'English title', info: englishTitle }];

      for (let i = 1; i < tds.length; i += 2) {
        const name = tds[i - 1].querySelector('label').innerHTML.trim();
        const info = tds[i].innerHTML.trim().replace(/\n/g, '');
        obj.push({ course, name, info });
      }

      return obj;
    } catch (e) {
      console.log(e);
      return 'error_data_evaluate';
    }
  }, course);

  return data;
};

const printOut = (i, courseListLength, course, startTime) => {
  console.log(
    `${i
      .toString()
      .padEnd(4)} / ${courseListLength}  -  ${course}  -  ${formatTime(
      (new Date() - startTime) / 1000
    ).padEnd(6)}  -  ${calculateETA(i, courseListLength, startTime)}`
  );
};

export const coursePairs = async (browser) => {
  console.log('======== Start Course Pairs Scraping ========');

  const page = await browser.newPage();

  let courseList = readNonEmptyCourses();

  const createCsvWriter = createObjectCsvWriter;
  const csvWriter = createCsvWriter({
    path: 'course_info_pairs.csv',
    append: false,
    header: [
      { id: 'course', title: 'Course' },
      { id: 'name', title: 'Name' },
      { id: 'info', title: 'Info' },
    ],
  });

  const startTime = new Date();
  const courseListLength = courseList.length;

  for (let i = 0; i < courseListLength; i++) {
    const course = courseList[i];
    const result = await scrape(page, course);

    if (result === 'error_page_goto') {
      console.log(`Failed to fetch ${course}`);
    }

    if (typeof result !== 'string') {
      await csvWriter
        .writeRecords(result)
        .then(() => printOut(i, courseListLength, course, startTime));
    }
  }
};
