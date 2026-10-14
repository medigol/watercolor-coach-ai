import ResultExperience from "../../components/ResultExperience";
import { ResultState } from "../../components/SavedResultState";
import { useSavedResult } from "../../hooks/useSavedResult";
import type { ImproveData } from "../../lib/artworks";
import { improveResult as sample } from "../../data/mockResults";

export default function ImproveResult() {
  const state = useSavedResult<ImproveData>(sample, "improve_painting");
  if (state.loading || state.error)
    return (
      <ResultState
        loading={state.loading}
        error={state.error}
        retry={state.retry}
      />
    );
  return <ResultExperience mode="improve_painting" {...state} />;
}
