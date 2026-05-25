type Props = {
  text: string;
};

export default function AuthButton({ text }: Props) {
  return (
    <button className="w-full bg-[#1e2f45] text-white py-2 rounded-md hover:opacity-90 transition">
      {text}
    </button>
  );
}