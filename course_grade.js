import { browser, formatTime } from './util';
import { unlink } from 'node:fs';
import fs from 'fs';
import { createObjectCsvWriter } from 'csv-writer';
import { calculateETA } from './util';

const courseGradeScrape = async (page, course, season, year) => {
  try {
    await page.goto(
      `https://karakterer.dtu.dk/Histogram/1/${course}/${season}-${year}`,
      { waitUntil: 'domcontentloaded' }
    );
  } catch (error) {
    return 'error_page_goto';
  }

  const data = await page.evaluate(() => {
    try {
      const registered = document
        .querySelector(
          'div[class="table-slide-container remove-gradient"] table tbody tr td + td'
        )
        .innerHTML.replace(/\s/g, '');

      const attended = document
        .querySelector(
          'div[class="table-slide-container remove-gradient"] table tbody tr + tr td + td'
        )
        .innerHTML.replace(/\s/g, '');

      const passed = document
        .querySelector(
          'div[class="table-slide-container remove-gradient"] table tbody tr + tr + tr td + td'
        )
        .innerHTML.replace(/\s/g, '');

      const average = document
        .querySelector(
          'div[class="table-slide-container remove-gradient"] table tbody tr + tr + tr + tr td + td'
        )
        .innerHTML.replace(/\s/g, '');

      return { registered, attended, passed, average };
    } catch (e) {
      return null;
    }
  });

  if (data === null) {
    return 'error_data_evaluate';
  }

  return [{ course, year, season, ...data }];
};

const printOut = (
  currentCourse,
  startTime,
  startTimeYear,
  newRows,
  allRows
) => {
  const endTime = new Date();

  formatTime;

  console.log(
    `${currentCourse}  -  ${formatTime((endTime - startTime) / 1000).padEnd(
      4
    )}  -  ${((endTime - startTimeYear) / 1000)
      .toFixed(1)
      .padEnd(3)}s (+${newRows.toString().padEnd(2)} rows, all: ${allRows
      .toString()
      .padEnd(3)})  -  ${calculateETA(+currentCourse, 99999, startTime)}`
  );
};

const getNextCourse = (currentCourse) => {
  let nextCourse = (+currentCourse + 1).toString();
  while (nextCourse.length < 5) {
    nextCourse = '0' + nextCourse;
  }
  return nextCourse;
};

export const courseGrade = async () => {
  console.log('======== Start Course Grade Scraping ========');

  unlink('nonEmptyCourses.txt', (err) => {
    if (err) return;
    console.log('nonEmptyCourses.txt was deleted');
  });

  const page = await browser.newPage();

  const createCsvWriter = createObjectCsvWriter;
  const csvWriter = createCsvWriter({
    path: 'grades.csv',
    append: false,
    header: [
      { id: 'course', title: 'Course' },
      { id: 'year', title: 'Year' },
      { id: 'season', title: 'Season' },
      { id: 'registered', title: 'Registered' },
      { id: 'attended', title: 'Attended' },
      { id: 'passed', title: 'Passed' },
      { id: 'average', title: 'Average' },
    ],
  });

  let currentCourse = '00000';
  const startTime = new Date();
  let allRows = 0;

  while (currentCourse !== '100000') {
    const startTimeYear = new Date();
    let newRows = 0;

    for (let year = 2021; year >= 2014; year--) {
      for (let season of ['Winter', 'Summer']) {
        const result = await courseGradeScrape(
          page,
          currentCourse,
          season,
          year
        );

        if (result === 'error_page_goto') {
          console.log(`Failed to fetch ${currentCourse} - ${season} - ${year}`);
        }

        if (typeof result !== 'string') {
          csvWriter.writeRecords(result).then(() => {
            newRows++;
            allRows++;
          });
        }
      }

      if (newRows === 0 && year === 2020) {
        break;
      }
    }

    printOut(currentCourse, startTime, startTimeYear, newRows, allRows);

    if (newRows > 0) {
      fs.appendFileSync('nonEmptyCourses.txt', `${currentCourse}\n`);
    }

    currentCourse = getNextCourse(currentCourse);
  }
};
