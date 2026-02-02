import { Spinner } from "../ui/Spinner";

export function LoadingSpinner() {
  return (
    <div className="flex items-center justify-center p-12">
      <Spinner size={32} />
    </div>
  );
}
