import { useId } from "react";
import { GRAPH_NODES, GRAPH_EDGES, affectedModules } from "../data";
import { Result } from "./controls";
import type { ExperimentProps } from "../study-experiment";

export function GraphLab({ input, onChange }: ExperimentProps<"graphify">) {
  const { selected } = input;
  const arrowId = useId();
  const affected = affectedModules(selected);
  const current = GRAPH_NODES.find((node) => node.id === selected)!;
  return (
    <>
      <div className="lv-graph-instrument lv-instrument">
        <div className="lv-instrument-caption" aria-hidden="true">
          <span>DEPENDENCY ATLAS</span>
          <span>05 MODULES</span>
        </div>
        <div className="o-code-graph lv-code-graph">
          <svg viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
            <defs>
              <marker id={arrowId} viewBox="0 0 6 6" refX="5" refY="3" markerWidth="6" markerHeight="6" orient="auto">
                <path d="M0 0 6 3 0 6Z" fill="context-stroke" />
              </marker>
            </defs>
            <path className="lv-graph-grid" d="M0 25h100M0 50h100M0 75h100M25 0v100M50 0v100M75 0v100" />
            <ellipse className="lv-graph-orbit" cx="50" cy="48" rx="45" ry="39" />
            <ellipse className="lv-graph-orbit lv-graph-inner-orbit" cx="50" cy="48" rx="35" ry="29" />
            {GRAPH_NODES.map((node) => (
              <g
                key={node.id}
                className={`lv-graph-platform ${node.id === selected ? "lv-graph-platform-selected" : affected.includes(node.id) ? "lv-graph-platform-affected" : ""}`}
              >
                <path d={`m${node.x - 8} ${node.y + 4} 8-4 8 4-8 4Z`} />
                <path d={`m${node.x - 8} ${node.y + 4}v2l8 4 8-4v-2`} />
                {node.id === selected && (
                  <ellipse className="lv-graph-activation lv-continuous" cx={node.x} cy={node.y + 4} rx="11" ry="6" />
                )}
              </g>
            ))}
            {GRAPH_EDGES.map(([a, b]) => {
              const from = GRAPH_NODES.find((node) => node.id === a)!;
              const to = GRAPH_NODES.find((node) => node.id === b)!;
              const traced = [selected, ...affected].includes(a) && [selected, ...affected].includes(b);
              const path = `M${from.x} ${from.y}Q${(from.x + to.x) / 2} ${(from.y + to.y) / 2 - 8} ${to.x} ${to.y}`;
              return (
                <g key={`${selected}-${a}-${b}`}>
                  <path className="lv-graph-link-bed" d={path} />
                  <path
                    d={path}
                    pathLength="1"
                    markerEnd={`url(#${arrowId})`}
                    className={`lv-graph-link ${traced ? "affected lv-draw" : ""}`}
                  />
                  {traced && <path className="lv-graph-runner lv-continuous" pathLength="1" d={path} />}
                </g>
              );
            })}
          </svg>
          {GRAPH_NODES.map((node) => (
            <button
              key={node.id}
              style={{ left: `${node.x}%`, top: `${node.y}%` }}
              aria-pressed={node.id === selected}
              className={node.id === selected ? "selected" : affected.includes(node.id) ? "affected" : ""}
              onClick={() => onChange({ ...input, selected: node.id })}
            >
              <i aria-hidden="true">
                <svg viewBox="0 0 30 30" fill="none">
                  <path d="m15 4 9 5v12l-9 5-9-5V9Z" />
                  <path d="m10 12 5-3 5 3-5 3Zm5 3v7m-5-6 5 3 5-3" />
                </svg>
              </i>
              <span className="lv-module-label">{node.label}</span>
            </button>
          ))}
        </div>
      </div>
      <div className="o-graph-legend">
        <span>
          <i />
          Selected module
        </span>
        <span>
          <i />
          Dependent module
        </span>
      </div>
      <Result title={`${current.label}: ${affected.length} dependent ${affected.length === 1 ? "module" : "modules"}`}>
        {affected.length
          ? `A change here can affect ${GRAPH_NODES.filter((node) => affected.includes(node.id))
              .map((node) => node.label)
              .join(", ")}. Follow both direct and indirect dependencies, then review the affected contracts.`
          : "No other module in this example depends on the selected module. Its own dependencies still deserve review."}
      </Result>
      <p className="o-lab-note">
        Select any module. This synthetic graph demonstrates transitive impact; it is not a scan of a real codebase.
      </p>
    </>
  );
}
