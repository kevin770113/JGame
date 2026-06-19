interface NavigationProps {
  currentView: string;
  setCurrentView: (view: string) => void;
}

export default function Navigation({ currentView, setCurrentView }: NavigationProps) {
  const tabs = [
    { id: 'Base', label: '基地排程' },
    { id: 'Market', label: '奴隸市場' },
    { id: 'Breeding', label: '繁衍實驗' },
    { id: 'Dispatch', label: '外部派遣' },
    { id: 'Map', label: '據點遷移' },
  ];

  return (
    <nav className="bg-gray-900 border-t border-gray-700 flex justify-around p-2 z-10">
      {tabs.map((tab) => (
        <button
          key={tab.id}
          onClick={() => setCurrentView(tab.id)}
          className={`py-2 px-2 sm:px-4 rounded transition-colors text-sm sm:text-base ${
            currentView === tab.id
              ? 'bg-blood-red text-white font-bold'
              : 'text-gray-400 hover:bg-gray-800'
          }`}
        >
          {tab.label}
        </button>
      ))}
    </nav>
  );
}
