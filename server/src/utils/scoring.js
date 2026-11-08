// Server-side exam scoring. The client never sends or influences the score.
const OPTS = ['A', 'B', 'C', 'D'];
exports.score = (questions, answers = {}) => {
  let score = 0, correct = 0, incorrect = 0, unanswered = 0;
  const rows = questions.map((q) => {
    const selected = OPTS.includes(answers[q.id]) ? answers[q.id] : null; const isCorrect = selected === q.correctOption;
    if (!selected) unanswered++; else if (isCorrect) { score += q.marks; correct++; } else incorrect++;
    return { questionId: q.id, selected, isCorrect };
  });
  return { score, correct, incorrect, unanswered, rows };
};
exports.evaluate = (score, totalMarks, passingMarks) => ({ percentage: totalMarks ? Math.round((score / totalMarks) * 1000) / 10 : 0, passed: score >= passingMarks });
