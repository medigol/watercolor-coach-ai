import ResultExperience from "../../components/ResultExperience";
import { ResultState } from "../../components/SavedResultState";
import { useSavedResult } from "../../hooks/useSavedResult";
import type { ReferenceData } from "../../lib/artworks";
import { referenceResult as sample } from "../../data/mockResults";

export default function ReferenceResult() {
  const state = useSavedResult<ReferenceData>(sample, "create_reference");
  if (state.loading || state.error)
    return (
      <ResultState
        loading={state.loading}
        error={state.error}
        retry={state.retry}
      />
    );
  return <ResultExperience mode="create_reference" {...state} />;
}
