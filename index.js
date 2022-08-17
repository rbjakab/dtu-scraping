import { browser } from './util';
import stayAwake from 'stay-awake';

import { courseEval } from './course_eval';
import { courseGrade } from './course_grade';
import { coursePairs } from './course_pairing';

(async () => {
  stayAwake.prevent();

  await courseGrade(browser);
  await courseEval(browser);
  await coursePairs(browser);

  await browser.close();

  stayAwake.allow();
})();
