type Tone = "info" | "success" | "error";

interface StatusMessageProps {
  message?: string;
  tone?: Tone;
}

export function StatusMessage({ message, tone = "info" }: StatusMessageProps): React.JSX.Element | null {
  if (!message) {
    return null;
  }
  return <p className={`status status-${tone}`}>{message}</p>;
}
