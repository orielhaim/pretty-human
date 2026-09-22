import { humy } from "../src/index.js";

const sample = `## Performance

- **Speed:** It’s fast — but it utilizes resources efficiently.
- **Scale:** Moreover, it handles large workloads…

The system is not only flexible but also reliable. See [docs](https://example.com/a—b).

`;

const sizes = [1_024, 10_240, 102_400, 1_048_576];

for (const size of sizes) {
  const input = sample.repeat(Math.ceil(size / sample.length)).slice(0, size);
  for (let warmup = 0; warmup < 3; warmup++) humy(input);

  const iterations = size >= 1_048_576 ? 5 : size >= 102_400 ? 20 : 100;
  const start = performance.now();
  for (let iteration = 0; iteration < iterations; iteration++) humy(input);
  const elapsed = performance.now() - start;
  const milliseconds = elapsed / iterations;
  const megabytesPerSecond = size / 1_048_576 / (milliseconds / 1_000);
  console.log(
    `${(size / 1_024).toFixed(0).padStart(4)} KB  ${milliseconds.toFixed(2).padStart(8)} ms  ${megabytesPerSecond.toFixed(1).padStart(7)} MB/s`,
  );
}
