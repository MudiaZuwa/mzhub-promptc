export type Evaluator<O> = (
  prediction: O,
  groundTruth: O
) => number | Promise<number>;
