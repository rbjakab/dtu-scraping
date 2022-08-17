export const getData = async (page, course) => {
  try {
    await page.goto(`https://kurser.dtu.dk/course/${course}/info`);
  } catch (error) {
    return 'error_page_goto';
  }

  await page.waitForTimeout(500);

  const links = await page.evaluate(() => {
    const links = Array.from(
      document.querySelectorAll('div[class="col-md-6"] div div')
    );

    if (links.length === 0) {
      return [];
    }

    if (links[0].innerHTML.trim() !== 'Evaluations') {
      return [];
    }

    const returnList = [];

    for (let i = 1; i < links.length; i++) {
      if (links[i].textContent === 'Grade history') {
        break;
      } else {
        returnList.push(links[i].querySelector('a').href);
      }
    }

    return returnList;
  });

  const scores = [];

  for (let i = 0; i < links.length; i++) {
    await Promise.all([
      await page.goto(links[i]),
      scores.push({ course, ...(await getScores(page)) }),
    ]);
  }

  return scores;
};

export const getScores = (page) =>
  page.evaluate(() => {
    const period = document.querySelector(
      'select[id="PeriodDropDownList"]'
    ).value;

    const responded = +document.querySelector(
      'div[class="table-slide-container remove-gradient"] table tbody tr + tr td'
    ).innerHTML;

    const questions = Array.from(
      document.querySelectorAll(
        'div[class="ResultCourseModelWrapper grid_6 clearmarg"]'
      )
    );

    const responses = [];

    for (let i = 0; i < questions.length; i++) {
      const question = questions[i]
        .querySelector(
          'div[class="FinalEvaluation_QuestionText grid_5 clearleft"]'
        )
        .innerHTML.replace(/(\r\n|\n|\r)/gm, '');

      const rows = Array.from(
        questions[i].querySelectorAll('div[class="RowWrapper"]')
      );

      const rowObj = [];
      for (let j = 0; j < rows.length; j++) {
        const rowName = rows[j]
          .querySelector(
            'div[class="FinalEvaluation_Result_OptionColumn grid_1 clearmarg"]'
          )
          .innerHTML.replace(/(\r\n|\n|\r)/gm, '');

        const rowValue = +rows[j]
          .querySelector('div[class="Answer_Result_Background"] span')
          .innerHTML.replace(/(\r\n|\n|\r)/gm, '');

        rowObj.push({ rowName, rowValue });
      }

      responses.push({ question, rowObj });
    }

    return {
      period,
      responded,
      responses,
    };
  });
