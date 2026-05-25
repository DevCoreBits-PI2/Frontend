type Props = {
  value: string;
  onChange: (value: string) => void;
};
/* Cambio Prueba - Línea de comentario. */
export default function AccessLevelToggle({ value, onChange }: Props) {
  return (
    <div className="relative flex bg-gray-200 rounded-lg p-1">
      
      
      <div
        className={`absolute top-1 bottom-1 w-[calc(50%-4px)] rounded-md bg-white shadow transition-all duration-300 ease-in-out
        ${value === "user" ? "left-1" : "left-[calc(50%+2px)]"}`}
      />

      {["user", "admin"].map((role) => (
        <button
          key={role}
          type="button"
          onClick={() => onChange(role)}
          className={`flex-1 z-10 text-sm py-2 rounded-md transition-colors duration-300 ${
            value === role
              ? "font-medium text-black"
              : "text-gray-600 hover:text-black"
          }`}
        >
          {role === "user" ? "Funcionario" : "Administrador"}
        </button>
      ))}
    </div>
  );
}
