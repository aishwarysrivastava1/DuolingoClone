import { FillBlank } from "./FillBlank";
import { MatchPairs } from "./MatchPairs";
import { MultipleChoice } from "./MultipleChoice";
import { TypeAnswer } from "./TypeAnswer";
import type { ExerciseProps } from "./types";
import { WordBank } from "./WordBank";

/** Picks the renderer for an exercise type. */
export function ExerciseView(props: ExerciseProps) {
  switch (props.exercise.type) {
    case "multiple_choice":
      return <MultipleChoice {...props} />;
    case "translate":
      return <WordBank {...props} />;
    case "match_pairs":
      return <MatchPairs {...props} />;
    case "fill_blank":
      return <FillBlank {...props} />;
    case "type_answer":
      return <TypeAnswer {...props} />;
  }
}
