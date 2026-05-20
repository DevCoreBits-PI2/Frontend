"use client";

import { useRef, useState, useCallback } from "react";
import { Position, PositionTree } from "@/types/orgChart";
import OrgNode from "./OrgNode";
import { ZoomIn, ZoomOut, Maximize2, Plus } from "lucide-react";

const LINE = "#94a3b8";

interface OrgTreeProps {
  tree: PositionTree;
  selectedId: string | null;
  onSelect: (pos: Position) => void;
  onAddChild?: (parent: Position) => void;
  onEdit?: (pos: Position) => void;
  onDetach?: (pos: Position) => void;
  scale: number;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onReset: () => void;
}

function NodeWithChildren({
  node,
  selectedId,
  onSelect,
  onAddChild,
  onEdit,
  onDetach,
  isRoot = false,
}: {
  node: PositionTree;
  selectedId: string | null;
  onSelect: (pos: Position) => void;
  onAddChild?: (parent: Position) => void;
  onEdit?: (pos: Position) => void;
  onDetach?: (pos: Position) => void;
  isRoot?: boolean;
}) {
  const hasChildren = node.children.length > 0;
  const isLeaf = !hasChildren && !isRoot;

  return (
    <div className="flex flex-col items-center">
      <OrgNode
        position={node}
        isSelected={selectedId === node.id}
        onClick={onSelect}
        isRoot={isRoot}
        isLeaf={isLeaf}
        onEdit={onEdit}
        onDetach={onDetach}
      />

      {hasChildren && (
        <>
          {/* Vertical line down from node */}
          <div style={{ width: 1, height: 26, background: LINE }} />

          {/* Add-child button — only for non-root nodes with children */}
          {!isRoot && (
            <>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onAddChild?.(node);
                }}
                title="Agregar posición hija"
                className="w-6 h-6 rounded-full bg-emerald-500 hover:bg-emerald-400 flex items-center justify-center text-white transition-colors shadow-sm z-10"
              >
                <Plus size={12} />
              </button>
              <div style={{ width: 1, height: 14, background: LINE }} />
            </>
          )}

          {/* Children layout */}
          {node.children.length === 1 ? (
            <NodeWithChildren
              node={node.children[0]}
              selectedId={selectedId}
              onSelect={onSelect}
              onAddChild={onAddChild}
              onEdit={onEdit}
              onDetach={onDetach}
            />
          ) : (
            <div className="flex items-start">
              {node.children.map((child, idx) => {
                const isFirst = idx === 0;
                const isLast = idx === node.children.length - 1;
                return (
                  <div key={child.id} className="flex flex-col items-center px-5">
                    {/* T-connector */}
                    <div className="flex w-full" style={{ height: 24 }}>
                      <div
                        style={{
                          flex: 1,
                          borderTop: isFirst ? "none" : `1px solid ${LINE}`,
                          borderRight: `1px solid ${LINE}`,
                        }}
                      />
                      <div
                        style={{
                          flex: 1,
                          borderTop: isLast ? "none" : `1px solid ${LINE}`,
                          borderLeft: `1px solid ${LINE}`,
                        }}
                      />
                    </div>
                    <NodeWithChildren
                      node={child}
                      selectedId={selectedId}
                      onSelect={onSelect}
                      onAddChild={onAddChild}
                      onEdit={onEdit}
                      onDetach={onDetach}
                    />
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}
    </div>
  );
}

export default function OrgTree({
  tree,
  selectedId,
  onSelect,
  onAddChild,
  onEdit,
  onDetach,
  scale,
  onZoomIn,
  onZoomOut,
  onReset,
}: OrgTreeProps) {
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [dragging, setDragging] = useState(false);
  const dragStart = useRef<{ x: number; y: number; ox: number; oy: number } | null>(null);

  const onMouseDown = useCallback(
    (e: React.MouseEvent) => {
      const el = e.target as HTMLElement;
      // Don't start drag when clicking on nodes or buttons
      if (el.closest("button") || el.closest("[data-nodecard]")) return;
      setDragging(true);
      dragStart.current = { x: e.clientX, y: e.clientY, ox: offset.x, oy: offset.y };
    },
    [offset]
  );

  const onMouseMove = useCallback(
    (e: React.MouseEvent) => {
      if (!dragging || !dragStart.current) return;
      setOffset({
        x: dragStart.current.ox + (e.clientX - dragStart.current.x),
        y: dragStart.current.oy + (e.clientY - dragStart.current.y),
      });
    },
    [dragging]
  );

  const onMouseUp = useCallback(() => {
    setDragging(false);
    dragStart.current = null;
  }, []);

  const onWheel = useCallback((e: React.WheelEvent) => {
    e.preventDefault();
  }, []);

  return (
    <div className="relative flex-1 overflow-hidden flex flex-col">
      {/* Toolbar */}
      <div className="flex items-center justify-between px-5 py-3.5 border-b border-[#f0f4f5] shrink-0">
        <span className="text-sm font-semibold text-[#0F1819]">Árbol Jerárquico</span>
        <div className="flex items-center gap-0.5">
          <ZoomBtn onClick={onZoomOut} title="Alejar"><ZoomOut size={14} /></ZoomBtn>
          <ZoomBtn onClick={onZoomIn} title="Acercar"><ZoomIn size={14} /></ZoomBtn>
          <ZoomBtn onClick={onReset} title="Ajustar vista"><Maximize2 size={14} /></ZoomBtn>
        </div>
      </div>

      {/* Canvas */}
      <div
        className="flex-1 overflow-hidden"
        style={{ cursor: dragging ? "grabbing" : "grab" }}
        onMouseDown={onMouseDown}
        onMouseMove={onMouseMove}
        onMouseUp={onMouseUp}
        onMouseLeave={onMouseUp}
        onWheel={onWheel}
      >
        <div
          style={{
            width: "100%",
            height: "100%",
            display: "flex",
            alignItems: "flex-start",
            justifyContent: "center",
            paddingTop: 40,
            paddingBottom: 48,
          }}
        >
          <div
            style={{
              transform: `translate(${offset.x}px, ${offset.y}px) scale(${scale})`,
              transformOrigin: "top center",
              transition: dragging ? "none" : "transform 0.12s ease-out",
            }}
          >
            <NodeWithChildren
              node={tree}
              selectedId={selectedId}
              onSelect={onSelect}
              onAddChild={onAddChild}
              onEdit={onEdit}
              onDetach={onDetach}
              isRoot
            />
          </div>
        </div>
      </div>
    </div>
  );
}

function ZoomBtn({
  onClick,
  title,
  children,
}: {
  onClick: () => void;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      title={title}
      className="p-1.5 text-[#8aa3ad] hover:text-[#0F1819] hover:bg-[#f4f7f8] rounded-lg transition-colors"
    >
      {children}
    </button>
  );
}
