/**
 * TechQuest mission + badge content (data only, no side effects).
 *
 * This is the single source of truth for mission content. It is imported by the
 * seed runner (prisma/seed.ts) AND by the content validator
 * (scripts/validate-content.ts), so the same data is seeded and validated.
 *
 * Content lives here, in @techquest/db — never inside React components.
 */
import type { MissionStepType } from "@prisma/client";

export type SeedStep = {
  type: MissionStepType;
  title: string;
  content: Record<string, unknown>;
  xpReward?: number;
};

export type SeedMission = {
  slug: string;
  title: string;
  subtitle: string;
  concept: string;
  description: string;
  order: number;
  estimatedMinutes: number;
  steps: SeedStep[];
};

export const missions: SeedMission[] = [
  {
    slug: "how-ai-learns",
    title: "How Does AI Learn?",
    subtitle: "Examples, patterns, and smart guesses",
    concept: "Examples → Patterns → Prediction",
    description:
      "Discover how an AI learns from examples, spots a pattern, and uses it to make a prediction — and why it can still make mistakes.",
    order: 1,
    estimatedMinutes: 9,
    steps: [
      // 1. Introduction — meet Byte, and set up the Examples → Pattern →
      //    Prediction spine with a concrete story instead of a definition.
      {
        type: "INTRO",
        title: "Meet Byte, a learning robot",
        content: {
          emoji: "🤖",
          heading: "How does AI learn?",
          body: "Meet Byte! 🤖 Byte is a robot who really wants to tell cats from dogs 🐱🐶 — but Byte was NOT born knowing how. AI learns the way you learned your letters: by looking at lots of EXAMPLES until it spots a PATTERN. Today YOU get to train Byte. Ready? Let's go!",
        },
      },
      // 2. What does AI do? — name the big idea.
      {
        type: "CHOICE",
        title: "How does AI learn?",
        content: {
          prompt: "You're about to train Byte. Which sentence tells the truth about how AI learns?",
          options: [
            { id: "a", emoji: "🎓", label: "It is born already knowing everything.", correct: false },
            { id: "b", emoji: "🔍", label: "It learns from lots of examples and finds a pattern.", correct: true },
            { id: "c", emoji: "🎲", label: "It just guesses, with no help at all.", correct: false },
          ],
          explanation: "Yes! AI learns from EXAMPLES and finds a PATTERN — then it uses that pattern to help. That's the big AI secret.",
        },
      },
      // 3. Examples → Pattern. Training Byte by sorting examples.
      {
        type: "DRAG_DROP",
        title: "Train Byte: find the pattern",
        content: {
          prompt: "Time to train Byte! Sort each example into the right group. The more you sort, the clearer the PATTERN becomes.",
          items: [
            { id: "1", label: "🐱 pointy ears + whiskers" },
            { id: "2", label: "🐶 floppy ears + waggy tail" },
            { id: "3", label: "🐱 purrs and loves to pounce" },
            { id: "4", label: "🐶 barks and loves to fetch" },
          ],
          targets: [
            { id: "cats", label: "Cats" },
            { id: "dogs", label: "Dogs" },
          ],
          solution: { "1": "cats", "2": "dogs", "3": "cats", "4": "dogs" },
          explanation: "Awesome training! Byte can now see the PATTERN: pointy ears + whiskers → cat. That's how AI turns examples into a pattern.",
        },
      },
      // 4. Pattern → Prediction. Byte guesses on something brand new.
      {
        type: "PREDICTION",
        title: "Byte makes a prediction",
        content: {
          prompt: "Byte learned the cat pattern from YOUR examples. Now it sees a brand-new photo it has never seen before — pointy ears and whiskers. What will Byte predict?",
          options: [
            { id: "a", emoji: "🐱", label: "Cat", correct: true },
            { id: "b", emoji: "🚗", label: "Car", correct: false },
          ],
          reveal: "Byte predicts 'Cat!' 🎉 It matched the new photo to the PATTERN it learned. Using a pattern to guess something new is called a PREDICTION.",
        },
      },
      // 5. More data → better learning.
      {
        type: "CHOICE",
        title: "More examples, please!",
        content: {
          prompt: "You want Byte to become a super cat-spotter. What will help it learn the pattern best?",
          options: [
            { id: "a", emoji: "🖼️", label: "Just one cat photo", correct: false },
            { id: "b", emoji: "🐱", label: "Lots and lots of different cat photos", correct: true },
            { id: "c", emoji: "🥪", label: "A photo of a sandwich", correct: false },
          ],
          explanation: "Exactly! More good examples — we call this DATA — give Byte more chances to learn the pattern really well.",
        },
      },
      // 6. AI can be wrong — and what to do about it.
      {
        type: "CHOICE",
        title: "Can Byte be wrong?",
        content: {
          prompt: "Byte is clever, but it is NOT perfect — sometimes it makes mistakes. If Byte gives an answer that seems wrong, what's the smart move?",
          options: [
            { id: "a", emoji: "🙈", label: "Believe it no matter what", correct: false },
            { id: "b", emoji: "📚", label: "Check with a grown-up or a book you trust", correct: true },
            { id: "c", emoji: "🚫", label: "Never use a computer again", correct: false },
          ],
          explanation: "Smart thinkers double-check! If Byte's examples missed something, it can guess wrong — so checking tricky answers keeps YOU in charge.",
        },
      },
      // 7. Mini challenge — the child supplies training examples.
      {
        type: "CHALLENGE",
        title: "Your turn to teach Byte",
        content: {
          task: "Now YOU are the teacher! Byte wants to learn what a DOG looks like. Type three example clues you would show it.",
          placeholder: "Like: floppy ears, a waggy tail, loves to fetch",
          successCriteria: "Any three dog-like examples are perfect — you just gave Byte its training data!",
        },
        xpReward: 20,
      },
      // 8. Reflection.
      {
        type: "REFLECTION",
        title: "Think about it",
        content: {
          prompt: "If you could train an AI to recognize ANYTHING using examples, what would you teach it?",
          placeholder: "I would teach an AI to spot...",
        },
      },
      // 9. Completion — recap Examples → Pattern → Prediction.
      // `parentSummary` / `homePrompt` power the parent dashboard's
      // "What your child learned" and "Try this at home" sections.
      {
        type: "COMPLETION",
        title: "You trained an AI!",
        content: {
          emoji: "🏆",
          heading: "You did it! 🎉",
          body: "You cracked the AI secret: show it EXAMPLES → it finds a PATTERN → it makes a PREDICTION. More examples make it smarter, and it can still be wrong — so smart thinkers check. You trained Byte AND became an AI explorer!",
          parentSummary: "AI learns from examples, finds a pattern, and uses it to make predictions — and more examples make it more accurate.",
          homePrompt: "Can you teach me the AI secret — examples, pattern, prediction?",
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
          emoji: "📺",
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
            { id: "a", emoji: "🚀", label: "More space videos", correct: true },
            { id: "b", emoji: "🍳", label: "A random cooking show", correct: false },
            { id: "c", emoji: "🚫", label: "Nothing at all", correct: false },
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
          explanation: "A like tells the app 'more like this'; a skip tells it 'less like this'.",
        },
      },
      {
        type: "PREDICTION",
        title: "Your turn to guess",
        content: {
          prompt: "A friend only watches soccer videos. What will their app recommend?",
          options: [
            { id: "a", emoji: "⚽", label: "More soccer", correct: true },
            { id: "b", emoji: "🎹", label: "Piano lessons", correct: false },
          ],
          reveal: "More soccer — the app follows the pattern of what they watch.",
        },
      },
      {
        type: "CHOICE",
        title: "What if you skip?",
        content: {
          prompt: "You skip every cooking video you see. What will the app probably do?",
          options: [
            { id: "a", emoji: "📉", label: "Show you fewer cooking videos", correct: true },
            { id: "b", emoji: "📈", label: "Show you many more cooking videos", correct: false },
            { id: "c", emoji: "🗑️", label: "Delete all cooking videos forever", correct: false },
          ],
          explanation: "Skipping is a signal too — the app learns to show fewer of those.",
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
          emoji: "🏆",
          heading: "Recommendation expert!",
          body: "Apps recommend things by learning what you like. Now the 'up next' magic makes sense.",
          parentSummary: "Apps recommend videos and shows by learning from what your child watches and likes.",
          homePrompt: "Why do you think our app keeps showing us similar videos?",
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
          emoji: "🤔",
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
            { id: "a", emoji: "🙈", label: "Believe the AI no matter what", correct: false },
            { id: "b", emoji: "📚", label: "Check a trusted source", correct: true },
            { id: "c", emoji: "🎲", label: "Guess randomly", correct: false },
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
        type: "PREDICTION",
        title: "Two different answers",
        content: {
          prompt: "You ask an AI the same question twice and get two different answers. What does that tell you?",
          options: [
            { id: "a", emoji: "🔎", label: "It might be unsure — better to check", correct: true },
            { id: "b", emoji: "🤥", label: "Both answers must be true", correct: false },
          ],
          reveal: "Different answers are a clue the AI might be unsure — a good time to check a trusted source.",
        },
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
          emoji: "🧐",
          heading: "Careful thinker!",
          body: "AI can be wrong. Checking answers keeps you smart and safe.",
          parentSummary: "AI can be wrong, so it's smart to check important answers against a trusted source.",
          homePrompt: "How could we check whether something the computer told us is really true?",
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
          emoji: "📝",
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
            { id: "1", label: "🍞 Get two slices of bread" },
            { id: "2", label: "🧀 Add the filling" },
            { id: "3", label: "🥪 Put the slices together" },
          ],
          targets: [
            { id: "step1", label: "First" },
            { id: "step2", label: "Second" },
            { id: "step3", label: "Third" },
          ],
          solution: { "1": "step1", "2": "step2", "3": "step3" },
          explanation: "Nice ordering! A sandwich only works if the steps happen in the right order.",
        },
      },
      {
        type: "CHOICE",
        title: "Clear or confusing?",
        content: {
          prompt: "Which instruction is clearest for a computer?",
          options: [
            { id: "a", emoji: "🤷", label: "'Do the thing'", correct: false },
            { id: "b", emoji: "🧭", label: "'Turn left, then walk 3 steps'", correct: true },
            { id: "c", emoji: "🌈", label: "'Go somewhere nice'", correct: false },
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
        type: "PREDICTION",
        title: "Out of order",
        content: {
          prompt: "A robot's steps say: (1) Eat the cereal. (2) Pour the milk. (3) Get a bowl. What happens?",
          options: [
            { id: "a", emoji: "😵‍💫", label: "It makes a mess — the steps are out of order", correct: true },
            { id: "b", emoji: "🤖", label: "It works perfectly", correct: false },
          ],
          reveal: "Out-of-order steps don't work — a computer does exactly what the order says.",
        },
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
          emoji: "🏅",
          heading: "Algorithm ace!",
          body: "Computers follow clear, ordered steps. You can write algorithms too!",
          parentSummary: "Computers follow clear, step-by-step instructions (algorithms) in the right order.",
          homePrompt: "Can you give me exact step-by-step instructions to make a sandwich?",
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
          emoji: "🤖",
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
            { id: "a", emoji: "💧", label: "How wet the soil is", correct: true },
            { id: "b", emoji: "🌈", label: "The color of the sky", correct: false },
            { id: "c", emoji: "🎵", label: "Your favorite song", correct: false },
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
            { id: "dry", label: "🏜️ IF soil is dry" },
            { id: "wet", label: "💦 IF soil is wet" },
          ],
          targets: [
            { id: "water", label: "Water the plant" },
            { id: "wait", label: "Do nothing" },
          ],
          solution: { dry: "water", wet: "wait" },
          explanation: "The rule plus the data decide the action: dry soil → water, wet soil → wait.",
        },
      },
      {
        type: "PREDICTION",
        title: "What will it do?",
        content: {
          prompt: "The rule is: IF it is dark, turn on the light. It is now dark. What does the robot do?",
          options: [
            { id: "a", emoji: "💡", label: "Turn on the light", correct: true },
            { id: "b", emoji: "🌑", label: "Turn off the light", correct: false },
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
          emoji: "🦾",
          heading: "Robot teacher!",
          body: "Robots use data and rules to act. You just taught one!",
          parentSummary: "Robots use information (data) together with rules to decide what to do.",
          homePrompt: "What simple rule could we invent for a helpful robot at home?",
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
          emoji: "💡",
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
            { id: "a", emoji: "🧒", label: "A kid who loves animals", correct: true },
            { id: "b", emoji: "🚫", label: "Nobody", correct: false },
          ],
          explanation: "Every good AI idea has a user it helps.",
        },
      },
      {
        type: "CHALLENGE",
        title: "Design your AI product",
        content: {
          task: "Design your own AI product idea: what is the Input, what does the AI do, and what is the Output?",
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
            { id: "a", emoji: "🐰", label: "'Rabbit'", correct: true },
            { id: "b", emoji: "🚲", label: "'Bicycle'", correct: false },
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
          emoji: "🛠️",
          heading: "Amazing work!",
          body: "You designed a real AI idea: problem, user, input, AI, and output. You can build with technology!",
          parentSummary: "A good AI idea starts with a problem, a user, an input, and a helpful output.",
          homePrompt: "If you could invent an AI to help people, what problem would it solve?",
        },
        xpReward: 40,
      },
    ],
  },
];

// Badge definitions. Award rules live server-side in lib/gamification.ts; the
// `criteria` here is a human-readable description of when each is earned.
export const badges = [
  { slug: "first-explorer", name: "First Explorer", description: "Completed your very first mission.", icon: "🧭", criteria: { rule: "Complete 1 mission" } },
  { slug: "pattern-detective", name: "Pattern Detective", description: "Discovered how AI learns patterns from examples.", icon: "🔍", criteria: { rule: "Complete the 'How Does AI Learn?' mission" } },
  { slug: "ai-explorer", name: "AI Explorer", description: "Completed three missions.", icon: "🚀", criteria: { rule: "Complete 3 missions" } },
  { slug: "builder", name: "Builder", description: "Designed your very first AI idea.", icon: "🛠️", criteria: { rule: "Complete the 'Build Your First AI Idea' mission" } },
  { slug: "three-day-streak", name: "3-Day Streak", description: "Learned three days in a row. Keep it going!", icon: "🔥", criteria: { rule: "Reach a 3-day streak" } },
];
