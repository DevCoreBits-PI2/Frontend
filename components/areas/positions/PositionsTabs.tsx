interface PositionsTabsProps {
  activeTab: "All" | "Hierarchy" | "Archived";
  onTabChange: (tab: "All" | "Hierarchy" | "Archived") => void;
}

export default function PositionsTabs({
  activeTab,
  onTabChange,
}: PositionsTabsProps) {
  const tabs: { id: "All" | "Hierarchy" | "Archived"; label: string }[] = [
    { id: "All", label: "Todas las Posiciones" },
    { id: "Hierarchy", label: "Gestión de Jerarquía" },
    { id: "Archived", label: "Archivadas" },
  ];

  return (
    <div className="flex gap-0 border-b border-[#BDD5EA]">
      {tabs.map((tab) => (
        <button
          key={tab.id}
          onClick={() => onTabChange(tab.id)}
          className={`px-6 py-4 text-sm font-medium transition-all border-b-2 ${
            activeTab === tab.id
              ? "text-[#0F1819] border-b-2 border-[#2ECC71]"
              : "text-[#8aa3ad] border-b-2 border-transparent hover:text-[#203D47]"
          }`}
        >
          {tab.label}
        </button>
      ))}
    </div>
  );
}
