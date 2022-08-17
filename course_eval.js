import { readNonEmptyCourses, calculateETA, formatTime } from './util';
import { createObjectCsvWriter } from 'csv-writer';
import { getData } from './course_eval_aux.js';

const saveData = async (data, dataRows, csvWriter) => {
  for (let l = 0; l < data.length; l++) {
    for (let j = 0; j < data[l].responses.length; j++) {
      for (let k = 0; k < data[l].responses[j].rowObj.length; k++) {
        const dataToWrite = {
          course: data[l].course,
          period: data[l].period,
          responded: data[l].responded,
          question: data[l].responses[j].question,
          rowName: data[l].responses[j].rowObj[k].rowName,
          rowValue: data[l].responses[j].rowObj[k].rowValue,
        };

        await csvWriter.writeRecords([dataToWrite]);
        dataRows++;
      }
    }
  }

  return dataRows;
};

const printOut = (i, courseListLength, course, startTime, dataRows) => {
  console.log(
    `${i
      .toString()
      .padEnd(4)} / ${courseListLength}  -  ${course}  -  ${formatTime(
      (new Date() - startTime) / 1000
    ).padEnd(7)}  -  ${dataRows.toString().padEnd(5)}  -  ${calculateETA(
      i,
      courseListLength,
      startTime
    )}`
  );
};

export const courseEval = async (browser) => {
  console.log('======== Start Evaluation Scraping ========');

  const page = await browser.newPage();

  const csvWriter = createObjectCsvWriter({
    path: 'evaluations.csv',
    append: false,
    header: [
      { id: 'course', title: 'Course' },
      { id: 'period', title: 'Period' },
      { id: 'responded', title: 'Responded' },
      { id: 'question', title: 'Question' },
      { id: 'rowName', title: 'RowName' },
      { id: 'rowValue', title: 'RowValue' },
    ],
  });

  let courseList = readNonEmptyCourses();

  const courseListLength = courseList.length;
  const startTime = new Date();
  let dataRows = 0;

  for (let i = 0; i < courseListLength; i++) {
    const course = courseList[i];
    const result = await getData(page, course);

    if (result === 'error_page_goto') {
      console.log(`Failed to fetch ${course}`);
    } else {
      dataRows = await saveData(result, dataRows, csvWriter);
      printOut(i, courseListLength, course, startTime, dataRows);
    }
  }
};
