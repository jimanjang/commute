function parseCheckIn(checkIn) {
  let hhmm = "";
  if (checkIn.length >= 12) {
    hhmm = `${checkIn.substring(8, 10)}:${checkIn.substring(10, 12)}`;
  } else if (checkIn.length >= 4) {
    hhmm = `${checkIn.substring(0, 2)}:${checkIn.substring(2, 4)}`;
  }
  return hhmm;
}

const samples = [
  { input: "20260515094600", expected: "09:46" },
  { input: "094600", expected: "09:46" },
  { input: "1030", expected: "10:30" }
];

console.log("--- Testing Time Parsing Logic ---");
samples.forEach(s => {
  const result = parseCheckIn(s.input);
  console.log(`Input: ${s.input} => Result: ${result} | ${result === s.expected ? '✅ OK' : '❌ FAIL'}`);
});
