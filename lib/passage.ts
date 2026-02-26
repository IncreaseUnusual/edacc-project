import { Chunk, Difficulty, Passage } from "./types";

export const passage: Passage = {
  id: "passage-1",
  title: "The Secret Life of Honeybees",
  content: `Inside every beehive, there is a world more organized than most human cities. A single hive can contain up to 60,000 bees, and every single one has a job to do. At the center of the hive is the queen bee. She is the only bee that lays eggs—up to 2,000 per day during summer. Despite her title, the queen doesn't actually make decisions for the hive. Her main job is simply to lay eggs and keep the colony growing. The worker bees are all female, and they do everything else. Young workers stay inside the hive, cleaning cells, feeding larvae, and building honeycomb from wax they produce from their own bodies. As they get older, they graduate to guarding the hive entrance. The oldest workers become foragers, flying up to five miles from the hive to collect nectar and pollen. Male bees are called drones. They don't collect food, don't guard the hive, and don't have stingers. Their only purpose is to mate with queens from other hives. In autumn, when food becomes scarce, the workers push the drones out of the hive to conserve resources. Bees communicate through dancing. When a forager finds a good source of flowers, she returns to the hive and performs a 'waggle dance' that tells other bees exactly where to find the food. The angle of her dance shows the direction relative to the sun, and the length of her waggle shows the distance. This tiny insect has been making honey the same way for over 100 million years. Every spoonful of honey represents the life's work of about twelve bees.`,
};

const sections = [
  `Inside every beehive, there is a world more organized than most human cities. A single hive can contain up to 60,000 bees, and every single one has a job to do.`,

  `At the center of the hive is the queen bee. She is the only bee that lays eggs—up to 2,000 per day during summer. Despite her title, the queen doesn't actually make decisions for the hive. Her main job is simply to lay eggs and keep the colony growing.`,

  `The worker bees are all female, and they do everything else. Young workers stay inside the hive, cleaning cells, feeding larvae, and building honeycomb from wax they produce from their own bodies. As they get older, they graduate to guarding the hive entrance.`,

  `The oldest workers become foragers, flying up to five miles from the hive to collect nectar and pollen.`,

  `Male bees are called drones. They don't collect food, don't guard the hive, and don't have stingers. Their only purpose is to mate with queens from other hives. In autumn, when food becomes scarce, the workers push the drones out of the hive to conserve resources.`,

  `Bees communicate through dancing. When a forager finds a good source of flowers, she returns to the hive and performs a 'waggle dance' that tells other bees exactly where to find the food. The angle of her dance shows the direction relative to the sun, and the length of her waggle shows the distance.`,

  `This tiny insect has been making honey the same way for over 100 million years. Every spoonful of honey represents the life's work of about twelve bees.`,
];

const chunkGroupings: Record<Difficulty, number[][]> = {
  easy: [[0], [1], [2], [3, 4], [5], [6]],
  medium: [[0, 1], [2, 3], [4], [5], [6]],
  hard: [[0, 1], [2, 3, 4], [5], [6]],
};

function mergeSections(indices: number[]): string {
  return indices.map((i) => sections[i]).join(" ");
}

export function getChunks(difficulty: Difficulty): Chunk[] {
  return chunkGroupings[difficulty].map((group, index) => ({
    index,
    text: mergeSections(group),
  }));
}
