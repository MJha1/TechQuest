/**
 * Seed data for TechQuest.
 *
 * Seeds the six launch missions (each with a sequence of typed steps) and a set
 * of completion badges. Idempotent: missions are upserted by slug and their
 * steps are fully rebuilt on each run, so `prisma db seed` can be re-run safely.
 *
 * No child/user/progress data is seeded — only content.
 */
import { PrismaClient, MissionStepType } from "@prisma/client";

const prisma = new PrismaClient();

type SeedStep = {
  type: MissionStepType;
  title: string;
  content: Record<string, unknown>;
  xpReward?: number;
};

type SeedMission = {
  slug: string;
  title: string;
  subtitle: string;
  concept: string;
  description: string;
  order: number;
  estimatedMinutes: number;
  steps: SeedStep[];
};

const missions: SeedMission[] = [
  {
    slug: "how-ai-learns",
    title: "How Does AI Learn?",
    subtitle: "Examples, patterns, and smart guesses",
    concept: "Examples → Patterns → Prediction",
    description:
      "Discover how an AI learns from examples, spots patterns, and then makes a prediction.",
    order: 1,
    estimatedMinutes: 8,
    steps: [
      {
        type: "INTRO",
        title: "Meet a learning machine",
        content: {
          heading: "How does AI learn?",
          body: "AI does not know things the way you do. It learns by looking at lots of examples until it spots a pattern.",
        },
      },
      {
        type: "CHOICE",
        title: "What is an example?",
        content: {
          prompt: "You want an AI to know what a cat looks like. What helps it learn best?",
          options: [
            { id: "a", label: "One blurry photo", correct: false },
            { id: "b", label: "Hundreds of cat photos", correct: true },
            { id: "c", label: "A drawing of a dog", correct: false },
          ],
          explanation: "More good examples give the AI more chances to find the pattern.",
        },
      },
      {
        type: "DRAG_DROP",
        title: "Find the pattern",
        content: {
          prompt: "Drag each picture into the right group.",
          items: [
            { id: "1", label: "🐱 cat" },
            { id: "2", label: "🐶 dog" },
            { id: "3", label: "🐱 cat" },
            { id: "4", label: "🐶 dog" },
          ],
          targets: [
            { id: "cats", label: "Cats" },
            { id: "dogs", label: "Dogs" },
          ],
          solution: { "1": "cats", "2": "dogs", "3": "cats", "4": "dogs" },
        },
      },
      {
        type: "PREDICTION",
        title: "Make a prediction",
        content: {
          prompt: "The AI has learned the cat pattern. It sees a new photo with pointy ears and whiskers. What will it guess?",
          options: [
            { id: "a", label: "Cat", correct: true },
            { id: "b", label: "Car", correct: false },
          ],
          reveal: "It predicts 'cat' — because the new photo matches the pattern it learned.",
        },
      },
      {
        type: "QUESTION",
        title: "In your words",
        content: {
          prompt: "What did the AI use to learn the cat pattern?",
          sampleAnswer: "Lots of example photos of cats.",
        },
      },
      {
        type: "CHALLENGE",
        title: "Teach it yourself",
        content: {
          task: "Pick three examples you would show an AI to teach it what a 'ball' is.",
          successCriteria: "Any three round, ball-like things count.",
        },
        xpReward: 20,
      },
      {
        type: "REFLECTION",
        title: "Think about it",
        content: {
          prompt: "What is one thing you could teach an AI using examples?",
          placeholder: "I could teach an AI to...",
        },
      },
      {
        type: "COMPLETION",
        title: "Mission complete!",
        content: {
          heading: "You did it!",
          body: "AI learns from examples, finds patterns, and makes predictions. Now you know the secret!",
        },
        xpReward: 30,
      },
    ],
  },
  {
    slug: "how-youtube-knows",
    title: "How Does YouTube Know?",
    subtitle: "The magic of recommendations",
    concept: "Recommendations",
    description:
      "Find out how apps guess what you might like to watch next.",
    order: 2,
    estimatedMinutes: 7,
    steps: [
      {
        type: "INTRO",
        title: "The 'up next' mystery",
        content: {
          heading: "How does YouTube know?",
          body: "Apps watch what you tap, like, and finish. Then they recommend more things like it.",
        },
      },
      {
        type: "CHOICE",
        title: "Why this video?",
        content: {
          prompt: "You watched three videos about space. What will the app likely show next?",
          options: [
            { id: "a", label: "More space videos", correct: true },
            { id: "b", label: "A random cooking show", correct: false },
            { id: "c", label: "Nothing at all", correct: false },
          ],
          explanation: "The app recommends more of what you seemed to enjoy.",
        },
      },
      {
        type: "DRAG_DROP",
        title: "Match the signals",
        content: {
          prompt: "Drag each action to what it tells the app.",
          items: [
            { id: "like", label: "👍 You liked it" },
            { id: "skip", label: "⏭️ You skipped it" },
          ],
          targets: [
            { id: "more", label: "Show more like this" },
            { id: "less", label: "Show less like this" },
          ],
          solution: { like: "more", skip: "less" },
        },
      },
      {
        type: "PREDICTION",
        title: "Your turn to guess",
        content: {
          prompt: "A friend only watches soccer videos. What will their app recommend?",
          options: [
            { id: "a", label: "More soccer", correct: true },
            { id: "b", label: "Piano lessons", correct: false },
          ],
          reveal: "More soccer — the app follows the pattern of what they watch.",
        },
      },
      {
        type: "REFLECTION",
        title: "Think about it",
        content: {
          prompt: "Is it always good to only see more of the same? Why or why not?",
          placeholder: "I think...",
        },
      },
      {
        type: "COMPLETION",
        title: "Mission complete!",
        content: {
          heading: "Recommendation expert!",
          body: "Apps recommend things by learning what you like. Now the 'up next' magic makes sense.",
        },
        xpReward: 30,
      },
    ],
  },
  {
    slug: "can-ai-be-wrong",
    title: "Can AI Be Wrong?",
    subtitle: "Why we should double-check",
    concept: "AI limitations and verification",
    description:
      "Learn that AI can make mistakes — and how to check its answers.",
    order: 3,
    estimatedMinutes: 8,
    steps: [
      {
        type: "INTRO",
        title: "Smart, but not perfect",
        content: {
          heading: "Can AI be wrong?",
          body: "Yes! AI can make mistakes, especially with tricky or new things. Good thinkers check the answer.",
        },
      },
      {
        type: "CHOICE",
        title: "Spot the mistake",
        content: {
          prompt: "An AI says a tomato is a vegetable. A scientist says it's a fruit. What should you do?",
          options: [
            { id: "a", label: "Believe the AI no matter what", correct: false },
            { id: "b", label: "Check a trusted source", correct: true },
            { id: "c", label: "Guess randomly", correct: false },
          ],
          explanation: "When answers disagree, check a trusted source.",
        },
      },
      {
        type: "QUESTION",
        title: "How to check",
        content: {
          prompt: "Name one way you could check if an AI's answer is correct.",
          sampleAnswer: "Ask a teacher, read a book, or look at a trusted website.",
        },
      },
      {
        type: "CHALLENGE",
        title: "Be a fact detective",
        content: {
          task: "An AI says the sun is cold. How would you prove that's wrong?",
          successCriteria: "Any real evidence (science books, trusted sites, experts) is a great answer.",
        },
        xpReward: 20,
      },
      {
        type: "REFLECTION",
        title: "Think about it",
        content: {
          prompt: "Why is it smart to double-check what an AI tells you?",
          placeholder: "It's smart because...",
        },
      },
      {
        type: "COMPLETION",
        title: "Mission complete!",
        content: {
          heading: "Careful thinker!",
          body: "AI can be wrong. Checking answers keeps you smart and safe.",
        },
        xpReward: 30,
      },
    ],
  },
  {
    slug: "how-computers-follow-instructions",
    title: "How Do Computers Follow Instructions?",
    subtitle: "Step-by-step thinking",
    concept: "Algorithms",
    description:
      "Discover how computers follow clear, ordered steps called algorithms.",
    order: 4,
    estimatedMinutes: 9,
    steps: [
      {
        type: "INTRO",
        title: "A recipe for computers",
        content: {
          heading: "How do computers follow instructions?",
          body: "Computers follow steps in order, exactly as written. A list of steps is called an algorithm.",
        },
      },
      {
        type: "DRAG_DROP",
        title: "Put the steps in order",
        content: {
          prompt: "Drag the steps to make a sandwich in the right order.",
          items: [
            { id: "1", label: "Get two slices of bread" },
            { id: "2", label: "Add the filling" },
            { id: "3", label: "Put the slices together" },
          ],
          targets: [
            { id: "step1", label: "First" },
            { id: "step2", label: "Second" },
            { id: "step3", label: "Third" },
          ],
          solution: { "1": "step1", "2": "step2", "3": "step3" },
        },
      },
      {
        type: "CHOICE",
        title: "Clear or confusing?",
        content: {
          prompt: "Which instruction is clearest for a computer?",
          options: [
            { id: "a", label: "'Do the thing'", correct: false },
            { id: "b", label: "'Turn left, then walk 3 steps'", correct: true },
            { id: "c", label: "'Go somewhere nice'", correct: false },
          ],
          explanation: "Computers need clear, exact steps — no guessing.",
        },
      },
      {
        type: "CHALLENGE",
        title: "Write an algorithm",
        content: {
          task: "Write the steps to brush your teeth, in order.",
          successCriteria: "Clear, ordered steps (get brush, add paste, brush, rinse) are perfect.",
        },
        xpReward: 20,
      },
      {
        type: "REFLECTION",
        title: "Think about it",
        content: {
          prompt: "What happens if the steps are in the wrong order?",
          placeholder: "If the steps are wrong...",
        },
      },
      {
        type: "COMPLETION",
        title: "Mission complete!",
        content: {
          heading: "Algorithm ace!",
          body: "Computers follow clear, ordered steps. You can write algorithms too!",
        },
        xpReward: 30,
      },
    ],
  },
  {
    slug: "teach-the-robot",
    title: "Teach the Robot",
    subtitle: "Data in, behavior out",
    concept: "Data and rules",
    description:
      "See how robots use data and rules to decide what to do.",
    order: 5,
    estimatedMinutes: 8,
    steps: [
      {
        type: "INTRO",
        title: "Robots need teaching",
        content: {
          heading: "Teach the robot",
          body: "A robot follows rules and uses data (information) to decide what to do.",
        },
      },
      {
        type: "CHOICE",
        title: "Which data helps?",
        content: {
          prompt: "You want a robot to water plants when the soil is dry. What data does it need?",
          options: [
            { id: "a", label: "How wet the soil is", correct: true },
            { id: "b", label: "The color of the sky", correct: false },
            { id: "c", label: "Your favorite song", correct: false },
          ],
          explanation: "The robot needs the right data: how wet the soil is.",
        },
      },
      {
        type: "DRAG_DROP",
        title: "Match rule to action",
        content: {
          prompt: "Drag each rule to what the robot should do.",
          items: [
            { id: "dry", label: "IF soil is dry" },
            { id: "wet", label: "IF soil is wet" },
          ],
          targets: [
            { id: "water", label: "Water the plant" },
            { id: "wait", label: "Do nothing" },
          ],
          solution: { dry: "water", wet: "wait" },
        },
      },
      {
        type: "PREDICTION",
        title: "What will it do?",
        content: {
          prompt: "The rule is: IF it is dark, turn on the light. It is now dark. What does the robot do?",
          options: [
            { id: "a", label: "Turn on the light", correct: true },
            { id: "b", label: "Turn off the light", correct: false },
          ],
          reveal: "It turns on the light — it follows the rule using the data 'it is dark'.",
        },
      },
      {
        type: "CHALLENGE",
        title: "Make a rule",
        content: {
          task: "Write a rule for a robot using 'IF ... THEN ...'.",
          successCriteria: "Any clear IF/THEN rule works, e.g. 'IF I see trash THEN pick it up'.",
        },
        xpReward: 20,
      },
      {
        type: "REFLECTION",
        title: "Think about it",
        content: {
          prompt: "Why does a robot need both data and rules?",
          placeholder: "A robot needs both because...",
        },
      },
      {
        type: "COMPLETION",
        title: "Mission complete!",
        content: {
          heading: "Robot teacher!",
          body: "Robots use data and rules to act. You just taught one!",
        },
        xpReward: 30,
      },
    ],
  },
  {
    slug: "build-your-first-ai-idea",
    title: "Build Your First AI Idea",
    subtitle: "From problem to prediction",
    concept: "Problem → User → Input → AI → Output",
    description:
      "Put it all together and design your very first AI idea.",
    order: 6,
    estimatedMinutes: 10,
    steps: [
      {
        type: "INTRO",
        title: "Be an AI inventor",
        content: {
          heading: "Build your first AI idea",
          body: "Great AI ideas answer five questions: What problem? Who is the user? What is the input? What does the AI do? What is the output?",
        },
      },
      {
        type: "QUESTION",
        title: "Pick a problem",
        content: {
          prompt: "What is a small problem an AI could help with?",
          sampleAnswer: "Helping me know what animal is in a photo.",
        },
      },
      {
        type: "CHOICE",
        title: "Who is it for?",
        content: {
          prompt: "Your AI names animals in photos. Who is the user?",
          options: [
            { id: "a", label: "A kid who loves animals", correct: true },
            { id: "b", label: "Nobody", correct: false },
          ],
          explanation: "Every good AI idea has a user it helps.",
        },
      },
      {
        type: "CHALLENGE",
        title: "Fill in your idea",
        content: {
          task: "Complete your idea: Input → AI → Output.",
          template: { input: "", ai: "", output: "" },
          example: {
            input: "A photo of a pet",
            ai: "Looks at the photo and finds the pattern",
            output: "The name of the animal",
          },
          aiFeedback: true,
          successCriteria: "Any idea with an input, an AI action, and an output is a winner.",
        },
        xpReward: 25,
      },
      {
        type: "PREDICTION",
        title: "Predict the output",
        content: {
          prompt: "Your AI gets a photo of a rabbit as input. What is the output?",
          options: [
            { id: "a", label: "'Rabbit'", correct: true },
            { id: "b", label: "'Bicycle'", correct: false },
          ],
          reveal: "The output is 'Rabbit' — the AI turns the input into a helpful answer.",
        },
      },
      {
        type: "REFLECTION",
        title: "Think about it",
        content: {
          prompt: "What would you name your AI, and who would it help?",
          placeholder: "My AI is called... and it helps...",
        },
      },
      {
        type: "COMPLETION",
        title: "You're an AI builder!",
        content: {
          heading: "Amazing work!",
          body: "You designed a real AI idea: problem, user, input, AI, and output. You can build with technology!",
        },
        xpReward: 40,
      },
    ],
  },
];

const badges = [
  { slug: "first-mission", name: "First Steps", description: "Completed your first mission.", icon: "🎉" },
  { slug: "ai-learner", name: "AI Learner", description: "Learned how AI learns.", icon: "🧠" },
  { slug: "recommendation-expert", name: "Recommendation Expert", description: "Learned how apps recommend.", icon: "📺" },
  { slug: "careful-thinker", name: "Careful Thinker", description: "Learned that AI can be wrong.", icon: "🔍" },
  { slug: "algorithm-ace", name: "Algorithm Ace", description: "Learned how computers follow instructions.", icon: "📝" },
  { slug: "robot-teacher", name: "Robot Teacher", description: "Taught a robot with data and rules.", icon: "🤖" },
  { slug: "ai-builder", name: "AI Builder", description: "Designed your first AI idea.", icon: "🚀" },
];

async function main() {
  // Badges (upsert by slug).
  for (const badge of badges) {
    await prisma.badge.upsert({
      where: { slug: badge.slug },
      update: { name: badge.name, description: badge.description, icon: badge.icon },
      create: badge,
    });
  }

  // Missions + steps (rebuild steps each run for idempotency).
  for (const mission of missions) {
    const { steps, ...missionData } = mission;

    const saved = await prisma.mission.upsert({
      where: { slug: mission.slug },
      update: {
        title: missionData.title,
        subtitle: missionData.subtitle,
        concept: missionData.concept,
        description: missionData.description,
        order: missionData.order,
        estimatedMinutes: missionData.estimatedMinutes,
      },
      create: {
        slug: missionData.slug,
        title: missionData.title,
        subtitle: missionData.subtitle,
        concept: missionData.concept,
        description: missionData.description,
        order: missionData.order,
        estimatedMinutes: missionData.estimatedMinutes,
      },
    });

    await prisma.missionStep.deleteMany({ where: { missionId: saved.id } });

    await prisma.missionStep.createMany({
      data: steps.map((step, index) => ({
        missionId: saved.id,
        order: index + 1,
        type: step.type,
        title: step.title,
        content: step.content,
        xpReward: step.xpReward ?? 10,
      })),
    });

    // eslint-disable-next-line no-console
    console.log(`Seeded mission '${saved.slug}' with ${steps.length} steps.`);
  }

  const missionCount = await prisma.mission.count();
  const stepCount = await prisma.missionStep.count();
  const badgeCount = await prisma.badge.count();
  // eslint-disable-next-line no-console
  console.log(`Done: ${missionCount} missions, ${stepCount} steps, ${badgeCount} badges.`);
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error) => {
    // eslint-disable-next-line no-console
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
