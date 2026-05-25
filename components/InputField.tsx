type Props = {
  label: string;
  type?: string;
  placeholder?: string;
  value: string;
  disabled?: boolean;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
};

export default function InputField({
  label,
  type = "text",
  placeholder,
  value,
  onChange,
  disabled = false,
}: Props) {
  return (
    <div className="flex flex-col gap-1">
      <label className="text-xs text-gray-800">{label}</label>
      <input
        type={type}
        placeholder={placeholder}
        value={value}
        onChange={onChange}
        disabled={disabled}
        className={`px-3 py-2 rounded-md border text-sm 
        ${disabled ? "bg-gray-100 cursor-not-allowed" : ""}
        focus:outline-none focus:ring-2 focus:ring-blue-500 
        placeholder-gray-400 text-gray-800`}
      />
    </div>
  );
}