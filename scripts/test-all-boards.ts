import { LivePaperGenerator } from "@/server/exam-engine/live-paper-generator";

const boards = [
  "board-fed-01",
  "board-punjab-lhr",
  "board-punjab-dgk",
  "board-punjab-fsd",
  "board-punjab-rwp",
  "board-punjab-grw",
  "board-punjab-mul",
  "board-punjab-swl",
  "board-punjab-sgd",
  "board-punjab-bwp",
];

async function runTest() {
  console.log("Testing all 10 boards...");
  for (const b of boards) {
    try {
      const res = await LivePaperGenerator.generateLivePaper({
        boardId: b,
        classId: "88e672dc-a151-49d6-8c47-0a8a8ea4b375",
        subjectId: "ef746570-dc21-4687-b6c2-4f24e2904ff0",
        totalQuestions: 5,
        title: "Multi-Board Verification: " + b,
      });
      console.log(`PASS [${b}]: paper ${res.paper.id}`);
    } catch (err: any) {
      console.error(`FAIL [${b}]: ${err.message}`);
      process.exit(1);
    }
  }
  console.log(">>> ALL 10 BOARDS VERIFIED PERFECTLY! <<<");
  process.exit(0);
}

runTest();
