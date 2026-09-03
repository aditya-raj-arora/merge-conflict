// CSU-02.07.001-SRC-ProjectBriefScreen_r1
// TLCSC-02-UI: the project-brief screen (CR-112) - shown once, the
// first time a level with a `project` is opened, before the level
// itself. Framing only: name, description, and optionally who the
// player's nominally reporting to and what ticket brought them here.
import type { ProjectBrief } from "../engine/project";

export interface ProjectBriefScreenProps {
  project: ProjectBrief;
  onBegin: () => void;
  onBack?: () => void;
}

export function ProjectBriefScreen({
  project,
  onBegin,
  onBack,
}: ProjectBriefScreenProps) {
  return (
    <div className="mx-auto max-w-2xl p-6 text-slate-100">
      {onBack && (
        <button
          type="button"
          onClick={onBack}
          className="mb-4 text-sm text-slate-400 hover:text-slate-200"
        >
          ← Back to levels
        </button>
      )}

      <p className="text-xs font-semibold tracking-wide text-sky-400 uppercase">
        Project brief
      </p>
      <h1 className="mt-1 text-2xl font-bold">{project.name}</h1>

      {(project.stakeholder || project.ticket) && (
        <dl className="mt-3 flex flex-wrap gap-x-6 gap-y-1 text-sm text-slate-400">
          {project.stakeholder && (
            <div className="flex gap-1">
              <dt className="font-medium text-slate-300">Reporting to:</dt>
              <dd>{project.stakeholder}</dd>
            </div>
          )}
          {project.ticket && (
            <div className="flex gap-1">
              <dt className="font-medium text-slate-300">Ticket:</dt>
              <dd>{project.ticket}</dd>
            </div>
          )}
        </dl>
      )}

      <p className="mt-6 whitespace-pre-line text-slate-300">
        {project.description}
      </p>

      <button
        type="button"
        onClick={onBegin}
        className="mt-8 rounded bg-sky-600 px-4 py-2 font-medium"
      >
        Begin
      </button>
    </div>
  );
}
